-- OmniCampus Database Schema
-- Migration: Initial schema setup

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enum types
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('student','moderator','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.content_status AS ENUM ('active','flagged','removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('pending','reviewed','action_taken','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_reason AS ENUM ('harassment','hate_speech','doxxing','spam','threats','self_harm','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.vote_value AS ENUM ('up','down');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Universities
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  abbrev text,
  domain text, -- e.g. myuwi.edu
  location text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id uuid REFERENCES public.universities(id),
  name text NOT NULL,
  role public.user_role NOT NULL DEFAULT 'student',
  is_verified boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  ban_reason text,
  banned_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid NOT NULL REFERENCES public.universities(id),
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous boolean NOT NULL DEFAULT true,
  title text,
  content text NOT NULL,
  sentiment text,
  sentiment_score double precision,
  toxicity_score double precision,
  distress_score double precision,
  status public.content_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments (nested)
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous boolean NOT NULL DEFAULT true,
  content text NOT NULL,
  sentiment text,
  sentiment_score double precision,
  toxicity_score double precision,
  status public.content_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Votes
CREATE TABLE IF NOT EXISTS public.post_votes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value public.vote_value NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comment_votes (
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  value public.vote_value NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('post','comment')),
  target_id uuid NOT NULL,
  reason public.report_reason NOT NULL,
  details text,
  status public.report_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('post','comment','user')),
  target_id uuid NOT NULL,
  performed_by text NOT NULL, -- 'AI' or user_id
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trends
CREATE TABLE IF NOT EXISTS public.trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id), -- NULL = cross-campus
  keyword text NOT NULL,
  frequency integer NOT NULL DEFAULT 0,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  last_updated timestamptz NOT NULL DEFAULT now()
);

-- Blocks
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_user_id, blocked_user_id)
);

-- Muted keywords
CREATE TABLE IF NOT EXISTS public.muted_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Per-thread anonymous aliases
CREATE TABLE IF NOT EXISTS public.thread_aliases (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alias_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_posts_university_created ON public.posts(university_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_university_window ON public.trends(university_id, start_date DESC);

-- Vote count materialized views (for performance)
CREATE OR REPLACE VIEW public.post_vote_counts AS
SELECT 
  post_id,
  COUNT(*) FILTER (WHERE value = 'up') as upvotes,
  COUNT(*) FILTER (WHERE value = 'down') as downvotes,
  COUNT(*) FILTER (WHERE value = 'up') - COUNT(*) FILTER (WHERE value = 'down') as score
FROM public.post_votes
GROUP BY post_id;

CREATE OR REPLACE VIEW public.comment_vote_counts AS
SELECT 
  comment_id,
  COUNT(*) FILTER (WHERE value = 'up') as upvotes,
  COUNT(*) FILTER (WHERE value = 'down') as downvotes,
  COUNT(*) FILTER (WHERE value = 'up') - COUNT(*) FILTER (WHERE value = 'down') as score
FROM public.comment_votes
GROUP BY comment_id;

COMMIT;

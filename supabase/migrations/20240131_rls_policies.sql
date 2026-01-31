-- OmniCampus Row Level Security Policies
-- Migration: RLS setup

BEGIN;

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_aliases ENABLE ROW LEVEL SECURITY;

-- Helper: current user's university
CREATE OR REPLACE FUNCTION public.current_university_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT university_id FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Helper: is moderator/admin
CREATE OR REPLACE FUNCTION public.is_mod_or_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE((SELECT role IN ('moderator','admin') FROM public.profiles WHERE user_id = auth.uid()), false);
$$;

-- Universities: readable to authenticated users
CREATE POLICY "universities_select" ON public.universities
FOR SELECT TO authenticated
USING (true);

-- Profiles: user can read own; mods can read in their university
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "profiles_select_mod" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_mod_or_admin() AND university_id = public.current_university_id());

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Posts: select only within your university and not removed (mods can also see flagged)
CREATE POLICY "posts_select_student" ON public.posts
FOR SELECT TO authenticated
USING (
  university_id = public.current_university_id()
  AND (status = 'active' OR (status = 'flagged' AND NOT public.is_mod_or_admin()))
);

CREATE POLICY "posts_select_mod" ON public.posts
FOR SELECT TO authenticated
USING (
  public.is_mod_or_admin()
  AND university_id = public.current_university_id()
);

-- Posts: insert only into your university; must be verified + not banned
CREATE POLICY "posts_insert" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (
  university_id = public.current_university_id()
  AND author_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.is_verified = true AND p.is_banned = false)
);

-- Posts: author can update within short window
CREATE POLICY "posts_update_own" ON public.posts
FOR UPDATE TO authenticated
USING (author_user_id = auth.uid())
WITH CHECK (author_user_id = auth.uid());

-- Posts: mods can update status
CREATE POLICY "posts_update_mod" ON public.posts
FOR UPDATE TO authenticated
USING (public.is_mod_or_admin() AND university_id = public.current_university_id())
WITH CHECK (public.is_mod_or_admin() AND university_id = public.current_university_id());

-- Comments: select within your university by joining post
CREATE POLICY "comments_select" ON public.comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_id
      AND p.university_id = public.current_university_id()
      AND (p.status = 'active' OR (p.status = 'flagged' AND public.is_mod_or_admin()))
  )
);

CREATE POLICY "comments_insert" ON public.comments
FOR INSERT TO authenticated
WITH CHECK (
  author_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.user_id = auth.uid() AND pr.is_verified = true AND pr.is_banned = false)
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id() AND p.status <> 'removed')
);

CREATE POLICY "comments_update_own" ON public.comments
FOR UPDATE TO authenticated
USING (author_user_id = auth.uid())
WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "comments_update_mod" ON public.comments
FOR UPDATE TO authenticated
USING (
  public.is_mod_or_admin() 
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
)
WITH CHECK (
  public.is_mod_or_admin()
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
);

-- Votes: only within your university scope
CREATE POLICY "post_votes_select" ON public.post_votes
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
);

CREATE POLICY "post_votes_insert" ON public.post_votes
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
);

CREATE POLICY "post_votes_update" ON public.post_votes
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "post_votes_delete" ON public.post_votes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "comment_votes_select" ON public.comment_votes
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.posts p ON p.id = c.post_id
    WHERE c.id = comment_id AND p.university_id = public.current_university_id()
  )
);

CREATE POLICY "comment_votes_insert" ON public.comment_votes
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.comments c
    JOIN public.posts p ON p.id = c.post_id
    WHERE c.id = comment_id AND p.university_id = public.current_university_id()
  )
);

CREATE POLICY "comment_votes_update" ON public.comment_votes
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "comment_votes_delete" ON public.comment_votes
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Reports: create only within your university scope
CREATE POLICY "reports_insert" ON public.reports
FOR INSERT TO authenticated
WITH CHECK (
  reported_by = auth.uid()
  AND (
    (target_type = 'post' AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = target_id AND p.university_id = public.current_university_id()))
    OR
    (target_type = 'comment' AND EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = target_id AND p.university_id = public.current_university_id()
    ))
  )
);

CREATE POLICY "reports_select_own" ON public.reports
FOR SELECT TO authenticated
USING (reported_by = auth.uid());

CREATE POLICY "reports_select_mod" ON public.reports
FOR SELECT TO authenticated
USING (
  public.is_mod_or_admin()
  AND (
    (target_type = 'post' AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = target_id AND p.university_id = public.current_university_id()))
    OR
    (target_type = 'comment' AND EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = target_id AND p.university_id = public.current_university_id()
    ))
  )
);

CREATE POLICY "reports_update_mod" ON public.reports
FOR UPDATE TO authenticated
USING (
  public.is_mod_or_admin()
  AND (
    (target_type = 'post' AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = target_id AND p.university_id = public.current_university_id()))
    OR
    (target_type = 'comment' AND EXISTS (
      SELECT 1 FROM public.comments c
      JOIN public.posts p ON p.id = c.post_id
      WHERE c.id = target_id AND p.university_id = public.current_university_id()
    ))
  )
)
WITH CHECK (
  public.is_mod_or_admin()
);

-- Moderation logs: mods can insert and read
CREATE POLICY "modlogs_select_mod" ON public.moderation_logs
FOR SELECT TO authenticated
USING (public.is_mod_or_admin());

CREATE POLICY "modlogs_insert_mod" ON public.moderation_logs
FOR INSERT TO authenticated
WITH CHECK (public.is_mod_or_admin());

-- Trends: readable to authenticated; write via service role only
CREATE POLICY "trends_select" ON public.trends
FOR SELECT TO authenticated
USING (true);

-- Blocks + muted keywords: users manage their own
CREATE POLICY "blocks_own" ON public.blocks
FOR ALL TO authenticated
USING (blocker_user_id = auth.uid())
WITH CHECK (blocker_user_id = auth.uid());

CREATE POLICY "muted_keywords_own" ON public.muted_keywords
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Thread aliases: users can read aliases for posts in their university
CREATE POLICY "thread_aliases_select" ON public.thread_aliases
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
);

CREATE POLICY "thread_aliases_insert" ON public.thread_aliases
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.university_id = public.current_university_id())
);

COMMIT;

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "moderator" | "admin";
export type ContentStatus = "active" | "flagged" | "removed";
export type ReportStatus =
  | "pending"
  | "reviewed"
  | "action_taken"
  | "dismissed";
export type ReportReason =
  | "harassment"
  | "hate_speech"
  | "doxxing"
  | "spam"
  | "threats"
  | "self_harm"
  | "other";
export type VoteValue = "up" | "down";

export interface Database {
  public: {
    Tables: {
      universities: {
        Row: {
          id: string;
          name: string;
          abbrev: string | null;
          domain: string | null;
          location: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          abbrev?: string | null;
          domain?: string | null;
          location?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          abbrev?: string | null;
          domain?: string | null;
          location?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          university_id: string | null;
          name: string;
          role: UserRole;
          is_verified: boolean;
          is_banned: boolean;
          ban_reason: string | null;
          banned_until: string | null;
          created_at: string;
          last_login_at: string | null;
        };
        Insert: {
          user_id: string;
          university_id?: string | null;
          name: string;
          role?: UserRole;
          is_verified?: boolean;
          is_banned?: boolean;
          ban_reason?: string | null;
          banned_until?: string | null;
          created_at?: string;
          last_login_at?: string | null;
        };
        Update: {
          user_id?: string;
          university_id?: string | null;
          name?: string;
          role?: UserRole;
          is_verified?: boolean;
          is_banned?: boolean;
          ban_reason?: string | null;
          banned_until?: string | null;
          created_at?: string;
          last_login_at?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          university_id: string;
          author_user_id: string;
          is_anonymous: boolean;
          title: string | null;
          content: string;
          sentiment: string | null;
          sentiment_score: number | null;
          toxicity_score: number | null;
          distress_score: number | null;
          status: ContentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          university_id: string;
          author_user_id: string;
          is_anonymous?: boolean;
          title?: string | null;
          content: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          toxicity_score?: number | null;
          distress_score?: number | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          university_id?: string;
          author_user_id?: string;
          is_anonymous?: boolean;
          title?: string | null;
          content?: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          toxicity_score?: number | null;
          distress_score?: number | null;
          status?: ContentStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          parent_comment_id: string | null;
          author_user_id: string;
          is_anonymous: boolean;
          content: string;
          sentiment: string | null;
          sentiment_score: number | null;
          toxicity_score: number | null;
          status: ContentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          parent_comment_id?: string | null;
          author_user_id: string;
          is_anonymous?: boolean;
          content: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          toxicity_score?: number | null;
          status?: ContentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          parent_comment_id?: string | null;
          author_user_id?: string;
          is_anonymous?: boolean;
          content?: string;
          sentiment?: string | null;
          sentiment_score?: number | null;
          toxicity_score?: number | null;
          status?: ContentStatus;
          created_at?: string;
        };
      };
      post_votes: {
        Row: {
          post_id: string;
          user_id: string;
          value: VoteValue;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          value: VoteValue;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          value?: VoteValue;
          created_at?: string;
        };
      };
      comment_votes: {
        Row: {
          comment_id: string;
          user_id: string;
          value: VoteValue;
          created_at: string;
        };
        Insert: {
          comment_id: string;
          user_id: string;
          value: VoteValue;
          created_at?: string;
        };
        Update: {
          comment_id?: string;
          user_id?: string;
          value?: VoteValue;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          reported_by: string;
          target_type: "post" | "comment";
          target_id: string;
          reason: ReportReason;
          details: string | null;
          status: ReportStatus;
          created_at: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          reported_by: string;
          target_type: "post" | "comment";
          target_id: string;
          reason: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          reported_by?: string;
          target_type?: "post" | "comment";
          target_id?: string;
          reason?: ReportReason;
          details?: string | null;
          status?: ReportStatus;
          created_at?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
      };
      moderation_logs: {
        Row: {
          id: string;
          action: string;
          target_type: "post" | "comment" | "user";
          target_id: string;
          performed_by: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          target_type: "post" | "comment" | "user";
          target_id: string;
          performed_by: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          target_type?: "post" | "comment" | "user";
          target_id?: string;
          performed_by?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      trends: {
        Row: {
          id: string;
          university_id: string | null;
          keyword: string;
          frequency: number;
          start_date: string;
          end_date: string;
          last_updated: string;
        };
        Insert: {
          id?: string;
          university_id?: string | null;
          keyword: string;
          frequency?: number;
          start_date: string;
          end_date: string;
          last_updated?: string;
        };
        Update: {
          id?: string;
          university_id?: string | null;
          keyword?: string;
          frequency?: number;
          start_date?: string;
          end_date?: string;
          last_updated?: string;
        };
      };
      blocks: {
        Row: {
          blocker_user_id: string;
          blocked_user_id: string;
          created_at: string;
        };
        Insert: {
          blocker_user_id: string;
          blocked_user_id: string;
          created_at?: string;
        };
        Update: {
          blocker_user_id?: string;
          blocked_user_id?: string;
          created_at?: string;
        };
      };
      muted_keywords: {
        Row: {
          id: string;
          user_id: string;
          keyword: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keyword: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keyword?: string;
          created_at?: string;
        };
      };
      thread_aliases: {
        Row: {
          post_id: string;
          user_id: string;
          alias_label: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          alias_label: string;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          alias_label?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      post_vote_counts: {
        Row: {
          post_id: string;
          upvotes: number;
          downvotes: number;
          score: number;
        };
      };
      comment_vote_counts: {
        Row: {
          comment_id: string;
          upvotes: number;
          downvotes: number;
          score: number;
        };
      };
    };
    Functions: {
      current_university_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_mod_or_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      report_status: ReportStatus;
      report_reason: ReportReason;
      vote_value: VoteValue;
    };
  };
}

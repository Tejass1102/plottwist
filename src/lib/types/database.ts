// ============================================
// Database TypeScript types
// Keep in sync with your Supabase schema
// src/lib/types/database.ts
// ============================================

export type RatingLabel = "Skip" | "Mid" | "Great" | "Masterpiece";
export type SeriesStatus =
  | "plan_to_watch"
  | "watching"
  | "completed"
  | "dropped";
export type MediaType = "movie" | "series";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  release_year: number | null;
  watched_on: string; // ISO date string e.g. "2024-11-15"
  rating: RatingLabel;
  review: string | null;
  rewatch: boolean;
  created_at: string;
  updated_at: string;
}

export interface SeriesProgress {
  id: string;
  user_id: string;
  tmdb_series_id: number;
  title: string;
  poster_path: string | null;
  status: SeriesStatus;
  current_season: number;
  current_episode: number;
  total_seasons: number | null;
  total_episodes: number | null;
  overall_rating: RatingLabel | null;
  notes: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ListEntry {
  list_id: string;
  diary_entry_id: string;
  added_at: string;
}

// ── Joined / enriched types ──────────────────

// DiaryEntry with profile info (for public pages)
export interface DiaryEntryWithProfile extends DiaryEntry {
  profiles: Pick<Profile, "username" | "display_name" | "avatar_url">;
}

// List with its entry count
export interface ListWithCount extends List {
  entry_count: number;
}

// ── Insert types (omit auto-generated fields) ─

export type DiaryEntryInsert = Omit<
  DiaryEntry,
  "id" | "created_at" | "updated_at"
>;

export type SeriesProgressInsert = Omit<
  SeriesProgress,
  "id" | "created_at" | "updated_at"
>;

export type ProfileUpdate = Partial<
  Pick<Profile, "username" | "display_name" | "avatar_url" | "bio">
>;

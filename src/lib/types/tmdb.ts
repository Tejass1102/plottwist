// ── TMDB API response types ─────────────────────────────────
// src/lib/types/tmdb.ts

export interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string; // movies
  name?: string; // tv series
  release_date?: string; // movies
  first_air_date?: string; // tv series
  poster_path: string | null;
  overview: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  total_results: number;
  total_pages: number;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  runtime: number | null;
  vote_average: number;
  genres: { id: number; name: string }[];
  credits?: {
    cast: { id: number; name: string; character: string }[];
    crew: { id: number; name: string; job: string }[];
  };
}

export interface TMDBSeriesDetail {
  id: number;
  name: string;
  first_air_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  genres: { id: number; name: string }[];
  seasons: {
    id: number;
    season_number: number;
    episode_count: number;
    name: string;
    poster_path: string | null;
  }[];
}

// Normalised result we use in the UI (same shape for movie + series)
export interface NormalizedSearchResult {
  tmdb_id: number;
  media_type: "movie" | "series";
  title: string;
  year: number | null;
  poster_path: string | null;
  overview: string;
}

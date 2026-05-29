// ── TMDB helper functions ───────────────────────────────────
// src/lib/tmdb.ts
// Only ever called server-side (API routes / Edge Functions)

import type {
  TMDBSearchResponse,
  TMDBSearchResult,
  NormalizedSearchResult,
  TMDBMovieDetail,
  TMDBSeriesDetail,
} from "@/lib/types/tmdb";

const BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY!;

export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function getPosterUrl(
  posterPath: string | null,
  size: "w92" | "w185" | "w342" | "w500" | "original" = "w185",
): string {
  if (!posterPath) return "/placeholder-poster.png";
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}

// Search movies + TV series in one call
export async function searchTMDB(
  query: string,
): Promise<NormalizedSearchResult[]> {
  if (!query || query.length < 2) return [];

  const url = new URL(`${BASE}/search/multi`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), {
    next: { revalidate: 3600 }, // cache for 1 hour
  });

  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const data: TMDBSearchResponse = await res.json();

  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8)
    .map(normalize);
}

function normalize(r: TMDBSearchResult): NormalizedSearchResult {
  const isMovie = r.media_type === "movie";
  const dateStr = isMovie ? r.release_date : r.first_air_date;
  const year = dateStr ? new Date(dateStr).getFullYear() : null;

  return {
    tmdb_id: r.id,
    media_type: isMovie ? "movie" : "series",
    title: (isMovie ? r.title : r.name) ?? "Untitled",
    year,
    poster_path: r.poster_path,
    overview: r.overview,
  };
}

// Fetch full movie detail (for the log modal)
export async function getMovieDetail(tmdbId: number): Promise<TMDBMovieDetail> {
  const url = new URL(`${BASE}/movie/${tmdbId}`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("append_to_response", "credits");

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // cache 24h
  });
  if (!res.ok) throw new Error(`TMDB movie detail failed: ${res.status}`);
  return res.json();
}

// Fetch full series detail (for series progress setup)
export async function getSeriesDetail(
  tmdbId: number,
): Promise<TMDBSeriesDetail> {
  const url = new URL(`${BASE}/tv/${tmdbId}`);
  url.searchParams.set("api_key", KEY);

  const res = await fetch(url.toString(), {
    next: { revalidate: 86400 }, // cache 24h
  });
  if (!res.ok) throw new Error(`TMDB series detail failed: ${res.status}`);
  return res.json();
}

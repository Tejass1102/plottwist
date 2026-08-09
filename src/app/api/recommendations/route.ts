// src/app/api/recommendations/route.ts
import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY!;

export interface RecommendedItem {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  year: number | null;
  overview: string;
  media_type: "movie" | "series";
}

async function fetchRecs(
  tmdbId: number,
  type: "movie" | "tv",
): Promise<RecommendedItem[]> {
  const url = new URL(`${BASE}/${type}/${tmdbId}/recommendations`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results ?? []).slice(0, 12).map((r: any) => ({
    tmdb_id: r.id,
    title: r.title ?? r.name ?? "Untitled",
    poster_path: r.poster_path ?? null,
    year: r.release_date
      ? new Date(r.release_date).getFullYear()
      : r.first_air_date
        ? new Date(r.first_air_date).getFullYear()
        : null,
    overview: r.overview ?? "",
    media_type: type === "movie" ? "movie" : "series",
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const movieIds = (searchParams.get("movieIds") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
  const seriesIds = (searchParams.get("seriesIds") ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);

  // Fetch recs from up to 3 recent movies and 3 recent series in parallel
  const [movieRecs, seriesRecs] = await Promise.all([
    Promise.all(movieIds.slice(0, 3).map((id) => fetchRecs(id, "movie"))).then(
      (arrs) => {
        // Deduplicate by tmdb_id, keep insertion order
        const seen = new Set<number>();
        const merged: RecommendedItem[] = [];
        for (const arr of arrs) {
          for (const item of arr) {
            if (!seen.has(item.tmdb_id)) {
              seen.add(item.tmdb_id);
              merged.push(item);
            }
          }
        }
        return merged.slice(0, 12);
      },
    ),
    Promise.all(
      seriesIds.slice(0, 3).map((id) => fetchRecs(id, "tv")),
    ).then((arrs) => {
      const seen = new Set<number>();
      const merged: RecommendedItem[] = [];
      for (const arr of arrs) {
        for (const item of arr) {
          if (!seen.has(item.tmdb_id)) {
            seen.add(item.tmdb_id);
            merged.push(item);
          }
        }
      }
      return merged.slice(0, 12);
    }),
  ]);

  return NextResponse.json({ movies: movieRecs, series: seriesRecs });
}

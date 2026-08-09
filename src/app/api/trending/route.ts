// src/app/api/trending/route.ts
import { NextResponse } from "next/server";
import type { RecommendedItem } from "@/app/api/recommendations/route";

const BASE = "https://api.themoviedb.org/3";
const KEY = process.env.TMDB_API_KEY!;

async function fetchTMDB(path: string): Promise<RecommendedItem[]> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", KEY);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.results ?? []).slice(0, 15).map((r: any) => {
    const isMovie = !!r.title;
    return {
      tmdb_id: r.id,
      title: r.title ?? r.name ?? "Untitled",
      poster_path: r.poster_path ?? null,
      year: r.release_date
        ? new Date(r.release_date).getFullYear()
        : r.first_air_date
          ? new Date(r.first_air_date).getFullYear()
          : null,
      overview: r.overview ?? "",
      media_type: isMovie ? "movie" : "series",
    } satisfies RecommendedItem;
  });
}

export async function GET() {
  const [nowPlaying, onTheAir] = await Promise.all([
    fetchTMDB("/movie/now_playing"), // movies currently in theatres
    fetchTMDB("/tv/on_the_air"),     // series currently airing
  ]);

  return NextResponse.json({ nowPlaying, onTheAir });
}

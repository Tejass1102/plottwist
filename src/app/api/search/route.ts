// ── Search API route ────────────────────────────────────────
// src/app/api/search/route.ts
// Client calls /api/search?q=inception — we proxy to TMDB

import { NextRequest, NextResponse } from "next/server";
import { searchTMDB } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  // Reject empty or very short queries
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchTMDB(q);
    return NextResponse.json(
      { results },
      {
        headers: {
          // Cache in browser for 5 min, CDN for 1 hour
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
        },
      },
    );
  } catch (err) {
    console.error("TMDB search error:", err);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}

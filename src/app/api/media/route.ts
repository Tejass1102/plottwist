import { NextRequest, NextResponse } from "next/server";
import { getMovieDetail, getSeriesDetail } from "@/lib/tmdb";

// Cache responses for 1 hour at the CDN / Next.js data cache layer
export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");

  if (!id || !type) {
    return NextResponse.json({ error: "Missing id or type" }, { status: 400 });
  }

  const tmdbId = parseInt(id, 10);
  if (isNaN(tmdbId)) {
    return NextResponse.json(
      { error: "Invalid id — must be an integer" },
      { status: 400 },
    );
  }

  try {
    const detail =
      type === "movie"
        ? await getMovieDetail(tmdbId)
        : await getSeriesDetail(tmdbId);

    return NextResponse.json(detail, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("[/api/media] Failed to fetch TMDB detail:", err);
    return NextResponse.json(
      { error: "Failed to fetch media details" },
      { status: 500 },
    );
  }
}

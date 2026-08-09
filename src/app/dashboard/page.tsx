// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/NavBar";
import SearchBar from "@/components/search/SearchBar";
import MovieDetailModal from "@/components/diary/MovieDetailModal";
import DiaryEntryCard, {
  type GroupedEntry,
} from "@/components/diary/DiaryEntryCard";
import RecommendationsRow from "@/components/dashboard/RecommendationsRow";
import Link from "next/link";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
import type { DiaryEntry } from "@/lib/types/database";
import type { RecommendedItem } from "@/app/api/recommendations/route";
import ChatWidget from "@/components/chat/ChatWidget";

/** Collapse same-series same-day same-season rows into one card */
function groupEntries(entries: DiaryEntry[]): GroupedEntry[] {
  const map = new Map<string, GroupedEntry>();
  for (const e of entries) {
    if (e.media_type === "series" && e.season != null && e.episode != null) {
      const key = `${e.tmdb_id}|${e.season}|${e.watched_on}`;
      if (map.has(key)) {
        const g = map.get(key)!;
        g.ids.push(e.id);
        if (e.episode < (g.episodeFrom ?? e.episode)) g.episodeFrom = e.episode;
        if (e.episode > (g.episodeTo ?? e.episode)) g.episodeTo = e.episode;
      } else {
        map.set(key, {
          ...e,
          ids: [e.id],
          episodeFrom: e.episode,
          episodeTo: e.episode,
        });
      }
    } else {
      map.set(e.id, {
        ...e,
        ids: [e.id],
        episodeFrom: null,
        episodeTo: null,
      });
    }
  }
  return [...map.values()];
}

export default function DashboardPage() {
  const [selectedMedia, setSelectedMedia] =
    useState<NormalizedSearchResult | null>(null);

  // Diary data
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [allEntries, setAllEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Trending
  const [nowPlaying, setNowPlaying] = useState<RecommendedItem[]>([]);
  const [onTheAir, setOnTheAir] = useState<RecommendedItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);

  // Recommendations
  const [recMovies, setRecMovies] = useState<RecommendedItem[]>([]);
  const [recSeries, setRecSeries] = useState<RecommendedItem[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const supabase = createClient();

  async function fetchEntries() {
    // Recent 10 for the diary strip
    const { data: recent } = await supabase
      .from("diary_entries")
      .select("*")
      .order("watched_on", { ascending: false })
      .limit(10);
    setEntries(recent ?? []);

    // All entries to derive recommendation seeds
    const { data: all } = await supabase
      .from("diary_entries")
      .select("tmdb_id, media_type, watched_on")
      .order("watched_on", { ascending: false });
    setAllEntries((all as DiaryEntry[]) ?? []);

    setLoading(false);
  }

  // Fetch trending on mount
  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then(({ nowPlaying: np, onTheAir: ota }) => {
        setNowPlaying(np ?? []);
        setOnTheAir(ota ?? []);
      })
      .catch(() => {})
      .finally(() => setTrendingLoading(false));

    fetchEntries();
  }, []);

  // Derive recommendations from watched history
  useEffect(() => {
    if (allEntries.length === 0) return;

    const movieIds = [
      ...new Set(
        allEntries
          .filter((e) => e.media_type === "movie")
          .map((e) => e.tmdb_id),
      ),
    ].slice(0, 5);

    const seriesIds = [
      ...new Set(
        allEntries
          .filter((e) => e.media_type === "series")
          .map((e) => e.tmdb_id),
      ),
    ].slice(0, 5);

    if (movieIds.length === 0 && seriesIds.length === 0) return;

    setRecsLoading(true);
    const params = new URLSearchParams();
    if (movieIds.length) params.set("movieIds", movieIds.join(","));
    if (seriesIds.length) params.set("seriesIds", seriesIds.join(","));

    fetch(`/api/recommendations?${params.toString()}`)
      .then((r) => r.json())
      .then(({ movies, series }) => {
        const watchedIds = new Set(allEntries.map((e) => e.tmdb_id));
        setRecMovies(
          (movies as RecommendedItem[]).filter((m) => !watchedIds.has(m.tmdb_id)),
        );
        setRecSeries(
          (series as RecommendedItem[]).filter((s) => !watchedIds.has(s.tmdb_id)),
        );
      })
      .catch(() => {})
      .finally(() => setRecsLoading(false));
  }, [allEntries]);

  function handleDeleted(ids: string[]) {
    setEntries((prev) => prev.filter((e) => !ids.includes(e.id)));
  }

  const groupedEntries = useMemo(() => groupEntries(entries), [entries]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Search ── */}
        <div className="mb-10">
          <p className="text-gray-500 text-sm mb-3">What did you watch?</p>
          <SearchBar onSelect={(m) => setSelectedMedia(m)} />
        </div>

        {/* ── 1. Now in Theatres ── */}
        <RecommendationsRow
          title="🎟 Now in Theatres"
          accent="amber"
          items={nowPlaying}
          loading={trendingLoading}
          onSelect={setSelectedMedia}
          emptyMessage="No theatre listings available right now."
        />

        {/* ── 2. Series Airing Now ── */}
        <RecommendationsRow
          title="📡 Series Airing Now"
          accent="teal"
          items={onTheAir}
          loading={trendingLoading}
          onSelect={setSelectedMedia}
          emptyMessage="No series listings available right now."
        />

        {/* ── 3. Recommended Movies ── */}
        {(recsLoading || recMovies.length > 0) && (
          <RecommendationsRow
            title="Movies you might like"
            accent="blue"
            items={recMovies}
            loading={recsLoading}
            onSelect={setSelectedMedia}
          />
        )}

        {/* ── 4. Recommended Series ── */}
        {(recsLoading || recSeries.length > 0) && (
          <RecommendationsRow
            title="Series you might like"
            accent="purple"
            items={recSeries}
            loading={recsLoading}
            onSelect={setSelectedMedia}
          />
        )}

        {/* ── 5. Recent watches ── */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            Recent watches
          </h2>
          <Link
            href="/diary"
            className="text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            View full diary →
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm">
              Nothing logged yet. Search above to get started.
            </p>
          </div>
        )}

        {!loading && groupedEntries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupedEntries.map((entry) => (
              <DiaryEntryCard
                key={entry.ids.join("-")}
                entry={entry}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
        )}
      </div>

      {selectedMedia && (
        <MovieDetailModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onSaved={fetchEntries}
        />
      )}
      <ChatWidget />
    </div>
  );
}

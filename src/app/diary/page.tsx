// src/app/diary/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import DiaryEntryCard, {
  type GroupedEntry,
} from "@/components/diary/DiaryEntryCard";
import DiaryFilters, {
  type DiaryFilters as Filters,
} from "@/components/diary/DiaryFilters";
import SearchBar from "@/components/search/SearchBar";
import MovieDetailModal from "@/components/diary/MovieDetailModal";
import type { DiaryEntry } from "@/lib/types/database";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
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
      // Movies or series without episode info — one card each
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

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] =
    useState<NormalizedSearchResult | null>(null);
  const [filters, setFilters] = useState<Filters>({
    year: null,
    mediaType: null,
    rating: null,
  });
  const router = useRouter();
  const supabase = createClient();

  async function fetchEntries() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("watched_on", { ascending: false });

    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchEntries();
  }, []);

  // Available years from diary entries
  const availableYears = useMemo(() => {
    const years = [
      ...new Set(entries.map((e) => new Date(e.watched_on).getFullYear())),
    ];
    return years.sort((a, b) => b - a);
  }, [entries]);

  // Filtered entries
  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (filters.mediaType && e.media_type !== filters.mediaType) return false;
      if (filters.rating && e.rating !== filters.rating) return false;
      if (filters.year) {
        const year = new Date(e.watched_on).getFullYear();
        if (year !== filters.year) return false;
      }
      return true;
    });
  }, [entries, filters]);

  function handleDeleted(ids: string[]) {
    setEntries((prev) => prev.filter((e) => !ids.includes(e.id)));
  }

  // Group filtered entries by month, then collapse episode runs
  const grouped = useMemo(() => {
    const map = new Map<string, GroupedEntry[]>();
    // Group raw entries by month first
    const byMonth = new Map<string, DiaryEntry[]>();
    filtered.forEach((e) => {
      const key = e.watched_on.slice(0, 7);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(e);
    });
    // Then collapse episode runs within each month
    byMonth.forEach((monthEntries, key) => {
      map.set(key, groupEntries(monthEntries));
    });
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header + search */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Diary</h1>
          </div>
        </div>

        {/* Quick log search */}
        <div className="mb-6">
          <SearchBar onSelect={(m) => setSelectedMedia(m)} />
        </div>

        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* Filters */}
            <div className="mb-6">
              <DiaryFilters
                filters={filters}
                onChange={setFilters}
                availableYears={availableYears}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-600">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">No entries match these filters.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {[...grouped.entries()].map(([monthKey, monthEntries]) => {
                  const label = new Date(monthKey + "-01").toLocaleDateString(
                    "en-US",
                    { month: "long", year: "numeric" },
                  );
                  return (
                    <div key={monthKey}>
                      <h3
                        className="text-xs font-medium text-gray-500 uppercase
                                     tracking-widest mb-3"
                      >
                        {label}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {monthEntries.map((entry) => (
                          <DiaryEntryCard
                            key={entry.ids.join("-")}
                            entry={entry}
                            onDeleted={handleDeleted}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
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

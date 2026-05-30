// src/app/diary/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import DiaryEntryCard from "@/components/diary/DiaryEntryCard";
import DiaryFilters, {
  type DiaryFilters as Filters,
} from "@/components/diary/DiaryFilters";
import StatsGrid from "@/components/stats/StatsGrid";
import SearchBar from "@/components/search/SearchBar";
import MovieDetailModal from "@/components/diary/MovieDetailModal"; // ← changed
import type { DiaryEntry } from "@/lib/types/database";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
import ChatWidget from "@/components/chat/ChatWidget";

type Tab = "diary" | "stats";

export default function DiaryPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("diary");
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

  function handleDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  // Group filtered entries by month
  const grouped = useMemo(() => {
    const map = new Map<string, DiaryEntry[]>();
    filtered.forEach((e) => {
      const key = e.watched_on.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header + search */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">My Diary</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {entries.length} entries
            </p>
          </div>
        </div>

        {/* Quick log search */}
        <div className="mb-6">
          <SearchBar onSelect={(m) => setSelectedMedia(m)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-900 p-1 rounded-xl w-fit">
          {(["diary", "stats"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${
                tab === t
                  ? "bg-gray-800 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t}
            </button>
          ))}
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

        {!loading && tab === "stats" && <StatsGrid entries={entries} />}

        {!loading && tab === "diary" && (
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
                      <div className="space-y-2">
                        {monthEntries.map((entry) => (
                          <DiaryEntryCard
                            key={entry.id}
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
        <MovieDetailModal // ← changed
          media={selectedMedia} // ← same prop name as before
          onClose={() => setSelectedMedia(null)}
          onSaved={fetchEntries}
        />
      )}
      <ChatWidget />
    </div>
  );
}

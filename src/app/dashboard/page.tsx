// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/NavBar";
import SearchBar from "@/components/search/SearchBar";
import MovieDetailModal from "@/components/diary/MovieDetailModal"; // ← changed
import DiaryEntryCard from "@/components/diary/DiaryEntryCard";
import Link from "next/link";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
import type { DiaryEntry } from "@/lib/types/database";
import ChatWidget from "@/components/chat/ChatWidget";

export default function DashboardPage() {
  const [selectedMedia, setSelectedMedia] =
    useState<NormalizedSearchResult | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  async function fetchEntries() {
    const { data } = await supabase
      .from("diary_entries")
      .select("*")
      .order("watched_on", { ascending: false })
      .limit(10);
    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchEntries();
  }, []);

  function handleDeleted(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-10">
          <p className="text-gray-500 text-sm mb-3">What did you watch?</p>
          <SearchBar onSelect={(m) => setSelectedMedia(m)} />
        </div>

        {/* Recent watches */}
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
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">🎬</p>
            <p className="text-sm">
              Nothing logged yet. Search above to get started.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => (
              <DiaryEntryCard
                key={entry.id}
                entry={entry}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
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

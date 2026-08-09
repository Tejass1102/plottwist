// src/components/diary/DiaryEntryCard.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import type { DiaryEntry } from "@/lib/types/database";

export interface GroupedEntry
  extends Omit<DiaryEntry, "id" | "episode"> {
  /** All DB row IDs that belong to this group */
  ids: string[];
  episodeFrom: number | null;
  episodeTo: number | null;
}

const RATING_STYLES: Record<string, string> = {
  Skip: "bg-red-950 text-red-400 border border-red-900",
  Mid: "bg-yellow-950 text-yellow-400 border border-yellow-900",
  Great: "bg-green-950 text-green-400 border border-green-900",
  Masterpiece: "bg-indigo-950 text-indigo-400 border border-indigo-900",
};

interface Props {
  entry: GroupedEntry;
  /** Called with every id that was deleted */
  onDeleted: (ids: string[]) => void;
}

export default function DiaryEntryCard({ entry, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const supabase = createClient();

  async function handleDelete() {
    const label =
      entry.ids.length > 1
        ? `${entry.ids.length} episodes of "${entry.title}"`
        : `"${entry.title}"`;
    if (!confirm(`Remove ${label} from your diary?`)) return;
    setDeleting(true);
    await supabase.from("diary_entries").delete().in("id", entry.ids);
    onDeleted(entry.ids);
  }

  const formattedDate = new Date(
    entry.watched_on + "T00:00:00",
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="bg-gray-900 border border-gray-800 hover:border-gray-700
                    rounded-xl overflow-hidden transition"
    >
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        {/* Poster */}
        <div className="relative w-9 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
          <Image
            src={getPosterUrl(entry.poster_path, "w92")}
            alt={entry.title}
            fill
            className="object-cover"
            sizes="36px"
          />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-white truncate">
              {entry.title}
            </p>
            {entry.rewatch && (
              <span
                className="text-xs text-gray-600 border border-gray-700
                               rounded px-1.5 py-0.5"
              >
                Rewatch
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">{formattedDate}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                entry.media_type === "movie"
                  ? "text-blue-500"
                  : "text-purple-500"
              }`}
            >
              {entry.media_type === "movie" ? "Movie" : "Series"}
            </span>
            {entry.media_type === "series" &&
              entry.season != null &&
              entry.episodeFrom != null &&
              entry.episodeTo != null && (
                <span className="text-xs text-gray-500 font-mono">
                  {entry.episodeFrom === entry.episodeTo
                    ? `S${String(entry.season).padStart(2, "0")}E${String(entry.episodeFrom).padStart(2, "0")}`
                    : `S${String(entry.season).padStart(2, "0")} E${String(entry.episodeFrom).padStart(2, "0")}–E${String(entry.episodeTo).padStart(2, "0")}`}
                </span>
              )}
          </div>
        </div>

        {/* Rating */}
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-lg flex-shrink-0
          ${RATING_STYLES[entry.rating]}`}
        >
          {entry.rating}
        </span>
      </div>

      {/* Expanded: review + delete */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-3">
          {entry.review ? (
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {entry.review}
            </p>
          ) : (
            <p className="text-sm text-gray-600 italic mb-3">
              No review written.
            </p>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-500 hover:text-red-400 transition disabled:opacity-50"
          >
            {deleting ? "Removing..." : "Remove from diary"}
          </button>
        </div>
      )}
    </div>
  );
}

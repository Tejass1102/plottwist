// src/components/dashboard/RecommendationsRow.tsx
"use client";

import Image from "next/image";
import { getPosterUrl } from "@/lib/tmdb";
import type { RecommendedItem } from "@/app/api/recommendations/route";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";

interface Props {
  title: string;
  accent: "blue" | "purple" | "amber" | "teal";
  items: RecommendedItem[];
  loading: boolean;
  onSelect: (media: NormalizedSearchResult) => void;
  emptyMessage?: string;
}

export default function RecommendationsRow({
  title,
  accent,
  items,
  loading,
  onSelect,
  emptyMessage = "Log more titles to get recommendations.",
}: Props) {
  const accentClass =
    accent === "blue"   ? "text-blue-400"
    : accent === "purple" ? "text-purple-400"
    : accent === "amber"  ? "text-amber-400"
    : "text-teal-400";

  return (
    <div className="mb-10">
      <h2
        className={`text-sm font-medium uppercase tracking-wide mb-4 ${accentClass}`}
      >
        {title}
      </h2>

      {loading ? (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-32 sm:w-40 lg:w-48 rounded-xl bg-gray-900 animate-pulse aspect-[2/3]"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-600 italic">{emptyMessage}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {items.map((item) => (
            <button
              key={item.tmdb_id}
              title={`${item.title}${item.year ? ` (${item.year})` : ""}`}
              onClick={() =>
                onSelect({
                  tmdb_id: item.tmdb_id,
                  media_type: item.media_type,
                  title: item.title,
                  year: item.year,
                  poster_path: item.poster_path,
                  overview: item.overview,
                })
              }
              className="flex-shrink-0 group relative w-32 sm:w-40 lg:w-48 rounded-xl overflow-hidden
                         bg-gray-900 border border-gray-800 hover:border-gray-600
                         transition-all hover:scale-105 focus:outline-none aspect-[2/3]"
            >
              {/* Poster */}
              <Image
                src={getPosterUrl(item.poster_path, "w185")}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 192px, (min-width: 640px) 160px, 128px"
              />
              {/* Hover overlay with title */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity
                              flex flex-col justify-end p-1.5"
              >
                <p className="text-white text-xs font-medium leading-tight line-clamp-2">
                  {item.title}
                </p>
                {item.year && (
                  <p className="text-gray-400 text-[10px] mt-0.5">{item.year}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

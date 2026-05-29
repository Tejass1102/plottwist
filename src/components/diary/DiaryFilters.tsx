// src/components/diary/DiaryFilters.tsx
"use client";

import type { RatingLabel, MediaType } from "@/lib/types/database";

export interface DiaryFilters {
  year: number | null;
  mediaType: MediaType | null;
  rating: RatingLabel | null;
}

interface Props {
  filters: DiaryFilters;
  onChange: (f: DiaryFilters) => void;
  availableYears: number[];
}

const RATINGS: RatingLabel[] = ["Skip", "Mid", "Great", "Masterpiece"];

const RATING_ACTIVE: Record<string, string> = {
  Skip: "bg-red-950 text-red-400 border-red-800",
  Mid: "bg-yellow-950 text-yellow-400 border-yellow-800",
  Great: "bg-green-950 text-green-400 border-green-800",
  Masterpiece: "bg-indigo-950 text-indigo-400 border-indigo-800",
};

export default function DiaryFilters({
  filters,
  onChange,
  availableYears,
}: Props) {
  function set(patch: Partial<DiaryFilters>) {
    onChange({ ...filters, ...patch });
  }

  function chip(
    label: string,
    active: boolean,
    onClick: () => void,
    activeClass = "bg-indigo-950 text-indigo-400 border-indigo-800",
  ) {
    return (
      <button
        key={label}
        onClick={onClick}
        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
          active
            ? activeClass
            : "bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Media type */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600 w-16 flex-shrink-0">Type</span>
        {chip("All", !filters.mediaType, () => set({ mediaType: null }))}
        {chip("Movies", filters.mediaType === "movie", () =>
          set({ mediaType: "movie" }),
        )}
        {chip("Series", filters.mediaType === "series", () =>
          set({ mediaType: "series" }),
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-600 w-16 flex-shrink-0">Rating</span>
        {chip("All", !filters.rating, () => set({ rating: null }))}
        {RATINGS.map((r) =>
          chip(
            r,
            filters.rating === r,
            () => set({ rating: r }),
            RATING_ACTIVE[r],
          ),
        )}
      </div>

      {/* Year */}
      {availableYears.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-600 w-16 flex-shrink-0">Year</span>
          {chip("All", !filters.year, () => set({ year: null }))}
          {availableYears.map((y) =>
            chip(String(y), filters.year === y, () => set({ year: y })),
          )}
        </div>
      )}
    </div>
  );
}

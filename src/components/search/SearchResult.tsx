// ── SearchResult component ──────────────────────────────────
// src/components/search/SearchResult.tsx

import Image from "next/image";
import { getPosterUrl } from "@/lib/tmdb";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";

interface Props {
  result: NormalizedSearchResult;
  onSelect: (result: NormalizedSearchResult) => void;
}

export default function SearchResult({ result, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(result)}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800
                 transition text-left group"
    >
      {/* Poster thumbnail */}
      <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-700">
        <Image
          src={getPosterUrl(result.poster_path, "w92")}
          alt={result.title}
          fill
          className="object-cover"
          sizes="32px"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-poster.png";
          }}
        />
      </div>

      {/* Title + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate group-hover:text-indigo-300 transition">
          {result.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {result.year && (
            <span className="text-xs text-gray-500">{result.year}</span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              result.media_type === "movie"
                ? "bg-blue-950 text-blue-400"
                : "bg-purple-950 text-purple-400"
            }`}
          >
            {result.media_type === "movie" ? "Movie" : "Series"}
          </span>
        </div>
      </div>

      <span className="text-gray-600 text-xs flex-shrink-0 group-hover:text-gray-400">
        Log →
      </span>
    </button>
  );
}

// ── SearchBar component ─────────────────────────────────────
// src/components/search/SearchBar.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import SearchResult from "./SearchResult";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";

interface Props {
  onSelect: (result: NormalizedSearchResult) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NormalizedSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounced search — fires 350ms after user stops typing
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, search]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(result: NormalizedSearchResult) {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(result);
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          🔍
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search for a movie or series..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700
                     text-white text-sm placeholder-gray-500 outline-none
                     focus:border-indigo-500 transition"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs animate-pulse">
            Searching...
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-gray-900 border
                        border-gray-700 rounded-xl overflow-hidden shadow-2xl z-50"
        >
          {results.map((r) => (
            <SearchResult
              key={`${r.media_type}-${r.tmdb_id}`}
              result={r}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {open && !loading && results.length === 0 && query.length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 bg-gray-900 border
                        border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-500 z-50"
        >
          No results for "{query}"
        </div>
      )}
    </div>
  );
}

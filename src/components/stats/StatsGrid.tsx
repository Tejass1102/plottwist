// src/components/stats/StatsGrid.tsx
"use client";

import { useState, useMemo } from "react";
import type { DiaryEntry } from "@/lib/types/database";

interface Props {
  entries: DiaryEntry[];
}

const RATING_ORDER = ["Masterpiece", "Great", "Mid", "Skip"];
const RATING_BAR: Record<string, string> = {
  Masterpiece: "bg-indigo-500",
  Great: "bg-green-500",
  Mid: "bg-yellow-500",
  Skip: "bg-red-500",
};
const RATING_TEXT: Record<string, string> = {
  Masterpiece: "text-indigo-400",
  Great: "text-green-400",
  Mid: "text-yellow-400",
  Skip: "text-red-400",
};

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function uniqueMovies(entries: DiaryEntry[]) {
  return new Set(
    entries.filter((e) => e.media_type === "movie").map((e) => e.tmdb_id),
  ).size;
}
function uniqueSeries(entries: DiaryEntry[]) {
  return new Set(
    entries.filter((e) => e.media_type === "series").map((e) => e.tmdb_id),
  ).size;
}

export default function StatsGrid({ entries }: Props) {
  // ── All-time totals ─────────────────────────────────────────
  const allMovies  = uniqueMovies(entries);
  const allSeries  = uniqueSeries(entries);
  const allRewatches = entries.filter((e) => e.rewatch).length;
  const allTotal   = entries.length;

  // ── Year list ────────────────────────────────────────────────
  const years = useMemo(() => {
    const s = new Set(entries.map((e) => e.watched_on.slice(0, 4)));
    return [...s].sort((a, b) => Number(b) - Number(a));
  }, [entries]);

  const [selectedYear, setSelectedYear] = useState<string>(
    years[0] ?? String(new Date().getFullYear()),
  );

  // ── Year-filtered entries ────────────────────────────────────
  const yearEntries = useMemo(
    () => entries.filter((e) => e.watched_on.startsWith(selectedYear)),
    [entries, selectedYear],
  );

  const yearMovies   = uniqueMovies(yearEntries);
  const yearSeries   = uniqueSeries(yearEntries);
  const yearRewatches = yearEntries.filter((e) => e.rewatch).length;
  const yearTotal    = yearMovies + yearSeries;

  // ── Rating distribution (year-scoped) ───────────────────────
  const ratingCounts = RATING_ORDER.reduce(
    (acc, r) => {
      acc[r] = yearEntries.filter((e) => e.rating === r).length;
      return acc;
    },
    {} as Record<string, number>,
  );
  const maxCount = Math.max(...Object.values(ratingCounts), 1);

  // ── Month-wise breakdown (year-scoped) ──────────────────────
  const monthRows = useMemo(() => {
    return MONTH_NAMES.map((label, i) => {
      const monthKey = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
      const monthEntries = yearEntries.filter((e) =>
        e.watched_on.startsWith(monthKey),
      );
      return {
        label,
        total: uniqueMovies(monthEntries) + uniqueSeries(monthEntries),
        movies: uniqueMovies(monthEntries),
        series: uniqueSeries(monthEntries),
      };
    });
  }, [yearEntries, selectedYear]);

  const monthMax = Math.max(...monthRows.map((m) => m.total), 1);

  // ── Year-wise summary table ──────────────────────────────────
  const yearRows = useMemo(() => {
    return years.map((yr) => {
      const ye = entries.filter((e) => e.watched_on.startsWith(yr));
      return {
        year: yr,
        total: uniqueMovies(ye) + uniqueSeries(ye),
        movies: uniqueMovies(ye),
        series: uniqueSeries(ye),
      };
    });
  }, [entries, years]);

  if (allTotal === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        Log some entries to see your stats.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── All-time summary cards ── */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
          All Time
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Movies", value: allMovies },
            { label: "Series", value: allSeries },
            { label: "Rewatches", value: allRewatches },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
            >
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Year-wise summary table ── */}
      {yearRows.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            Year by Year
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Year</th>
                <th className="text-right pb-2 font-medium">Total</th>
                <th className="text-right pb-2 font-medium">Movies</th>
                <th className="text-right pb-2 font-medium">Series</th>
              </tr>
            </thead>
            <tbody>
              {yearRows.map((row) => (
                <tr
                  key={row.year}
                  onClick={() => setSelectedYear(row.year)}
                  className={`border-b border-gray-800/50 cursor-pointer transition-colors last:border-0 ${
                    selectedYear === row.year
                      ? "text-white"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <td className="py-2.5 font-medium">
                    {row.year}
                    {selectedYear === row.year && (
                      <span className="ml-2 text-xs text-indigo-400">▶</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">{row.total}</td>
                  <td className="py-2.5 text-right text-blue-400">{row.movies}</td>
                  <td className="py-2.5 text-right text-purple-400">{row.series}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Year selector + year stats ── */}
      <div>
        {/* Year tabs */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-widest mr-1">
            {selectedYear}
          </span>
          <div className="flex gap-1 flex-wrap">
            {years.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                  selectedYear === yr
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* Year summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Movies", value: yearMovies },
            { label: "Series", value: yearSeries },
            { label: "Rewatches", value: yearRewatches },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
            >
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Month-wise bar chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            Monthly Activity — {selectedYear}
          </h3>
          <div className="flex items-end gap-1.5 h-24">
            {monthRows.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm bg-gray-800 relative"
                  style={{ height: "80px" }}
                >
                  <div
                    className="absolute bottom-0 w-full rounded-sm bg-indigo-600 transition-all"
                    style={{ height: `${(m.total / monthMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 mt-1">
            {monthRows.map((m) => (
              <div key={m.label} className="flex-1 text-center">
                <span className="text-gray-600" style={{ fontSize: "9px" }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Month-wise table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            Month by Month — {selectedYear}
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-800">
                <th className="text-left pb-2 font-medium">Month</th>
                <th className="text-right pb-2 font-medium">Total</th>
                <th className="text-right pb-2 font-medium">Movies</th>
                <th className="text-right pb-2 font-medium">Series</th>
              </tr>
            </thead>
            <tbody>
              {monthRows
                .filter((m) => m.total > 0)
                .map((m) => (
                  <tr
                    key={m.label}
                    className="border-b border-gray-800/50 last:border-0"
                  >
                    <td className="py-2.5 text-gray-300 font-medium">{m.label}</td>
                    <td className="py-2.5 text-right text-white">{m.total}</td>
                    <td className="py-2.5 text-right text-blue-400">{m.movies}</td>
                    <td className="py-2.5 text-right text-purple-400">{m.series}</td>
                  </tr>
                ))}
              {monthRows.every((m) => m.total === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-gray-600 text-xs"
                  >
                    No entries for {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Rating distribution (year-scoped) ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Rating Distribution — {selectedYear}
        </h3>
        <div className="flex flex-col gap-3">
          {RATING_ORDER.map((r) => (
            <div key={r} className="flex items-center gap-3">
              <span className={`text-xs font-medium w-24 ${RATING_TEXT[r]}`}>
                {r}
              </span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${RATING_BAR[r]}`}
                  style={{ width: `${(ratingCounts[r] / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6 text-right">
                {ratingCounts[r]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// src/components/stats/StatsGrid.tsx
"use client";

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

export default function StatsGrid({ entries }: Props) {
  const movies = entries.filter((e) => e.media_type === "movie").length;
  const series = entries.filter((e) => e.media_type === "series").length;
  const rewatches = entries.filter((e) => e.rewatch).length;
  const total = entries.length;

  // Rating distribution
  const ratingCounts = RATING_ORDER.reduce(
    (acc, r) => {
      acc[r] = entries.filter((e) => e.rating === r).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const maxCount = Math.max(...Object.values(ratingCounts), 1);

  // Watches by month (last 12)
  const byMonth: Record<string, number> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[key] = 0;
  }
  entries.forEach((e) => {
    const key = e.watched_on.slice(0, 7);
    if (key in byMonth) byMonth[key]++;
  });
  const monthMax = Math.max(...Object.values(byMonth), 1);
  const monthLabels = Object.keys(byMonth).map((k) =>
    new Date(k + "-01").toLocaleDateString("en-US", { month: "short" }),
  );
  const monthValues = Object.values(byMonth);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        Log some entries to see your stats.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: total },
          { label: "Movies", value: movies },
          { label: "Series", value: series },
          { label: "Rewatches", value: rewatches },
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

      {/* Rating distribution */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Rating distribution
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

      {/* Monthly activity */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          Activity — last 12 months
        </h3>
        <div className="flex items-end gap-1.5 h-20">
          {monthValues.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm bg-gray-800 relative"
                style={{ height: "64px" }}
              >
                <div
                  className="absolute bottom-0 w-full rounded-sm bg-indigo-600 transition-all"
                  style={{ height: `${(v / monthMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mt-1">
          {monthLabels.map((l, i) => (
            <div key={i} className="flex-1 text-center">
              <span className="text-gray-600" style={{ fontSize: "9px" }}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

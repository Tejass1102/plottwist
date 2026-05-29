// ── RatingSelector component ────────────────────────────────
// src/components/diary/RatingSelector.tsx
"use client";

import type { RatingLabel } from "@/lib/types/database";

interface Props {
  value: RatingLabel | null;
  onChange: (rating: RatingLabel) => void;
}

const RATINGS: {
  label: RatingLabel;
  emoji: string;
  bg: string;
  border: string;
  text: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}[] = [
  {
    label: "Skip",
    emoji: "🗑",
    bg: "bg-gray-900",
    border: "border-gray-700",
    text: "text-gray-400",
    activeBg: "bg-red-950",
    activeBorder: "border-red-500",
    activeText: "text-red-300",
  },
  {
    label: "Mid",
    emoji: "😐",
    bg: "bg-gray-900",
    border: "border-gray-700",
    text: "text-gray-400",
    activeBg: "bg-yellow-950",
    activeBorder: "border-yellow-500",
    activeText: "text-yellow-300",
  },
  {
    label: "Great",
    emoji: "👍",
    bg: "bg-gray-900",
    border: "border-gray-700",
    text: "text-gray-400",
    activeBg: "bg-green-950",
    activeBorder: "border-green-500",
    activeText: "text-green-300",
  },
  {
    label: "Masterpiece",
    emoji: "🏆",
    bg: "bg-gray-900",
    border: "border-gray-700",
    text: "text-gray-400",
    activeBg: "bg-indigo-950",
    activeBorder: "border-indigo-500",
    activeText: "text-indigo-300",
  },
];

export default function RatingSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {RATINGS.map((r) => {
        const active = value === r.label;
        return (
          <button
            key={r.label}
            type="button"
            onClick={() => onChange(r.label)}
            className={`
              flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border
              transition-all duration-150 cursor-pointer
              ${
                active
                  ? `${r.activeBg} ${r.activeBorder} ${r.activeText} scale-105 shadow-lg`
                  : `${r.bg} ${r.border} ${r.text} hover:border-gray-500 hover:text-gray-300`
              }
            `}
          >
            <span className="text-xl">{r.emoji}</span>
            <span className="text-xs font-medium">{r.label}</span>
          </button>
        );
      })}
    </div>
  );
}

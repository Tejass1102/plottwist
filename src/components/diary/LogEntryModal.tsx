// ── LogEntryModal component ─────────────────────────────────
// src/components/diary/LogEntryModal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import RatingSelector from "./RatingSelector";
import { createClient } from "@/lib/supabase/client";
import { getPosterUrl } from "@/lib/tmdb";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
import type { RatingLabel } from "@/lib/types/database";

interface Props {
  media: NormalizedSearchResult;
  onClose: () => void;
  onSaved: () => void;
}

export default function LogEntryModal({ media, onClose, onSaved }: Props) {
  const today = new Date().toISOString().split("T")[0];

  const [watchedOn, setWatchedOn] = useState(today);
  const [rating, setRating] = useState<RatingLabel | null>(null);
  const [review, setReview] = useState("");
  const [rewatch, setRewatch] = useState(false);
  const [season, setSeason] = useState(1);
  const [episodeFrom, setEpisodeFrom] = useState(1);
  const [episodeTo, setEpisodeTo] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSeries = media.media_type === "series";
  const supabase = createClient();

  async function handleSave() {
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    setSaving(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    // 1. Save diary entries — one row per episode for series, one row for movies
    const episodeList = isSeries
      ? Array.from(
          { length: episodeTo - episodeFrom + 1 },
          (_, i) => episodeFrom + i,
        )
      : [null];

    for (const ep of episodeList) {
      const { error: diaryError } = await supabase.from("diary_entries").insert({
        user_id: user.id,
        tmdb_id: media.tmdb_id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path,
        release_year: media.year,
        watched_on: watchedOn,
        rating,
        review: review.trim() || null,
        rewatch,
        season: isSeries ? season : null,
        episode: ep,
      });

      if (diaryError) {
        if (diaryError.code === "23505") {
          setError(
            isSeries
              ? `S${season}E${ep} already logged on that date.`
              : "You already logged this title on that date.",
          );
        } else {
          setError(diaryError.message);
        }
        setSaving(false);
        return;
      }
    }

    // 2. Upsert series progress if it's a series
    if (isSeries) {
      await supabase.from("series_progress").upsert(
        {
          user_id: user.id,
          tmdb_series_id: media.tmdb_id,
          title: media.title,
          poster_path: media.poster_path,
          status: "watching",
          current_season: season,
          current_episode: episodeTo,
        },
        { onConflict: "user_id,tmdb_series_id" },
      );
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50
                 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md
                      shadow-2xl overflow-hidden"
      >
        {/* Header — poster + title */}
        <div className="flex gap-4 p-5 border-b border-gray-800">
          <div className="relative w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-800">
            <Image
              src={getPosterUrl(media.poster_path, "w185")}
              alt={media.title}
              fill
              className="object-cover"
              sizes="56px"
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span
              className={`text-xs font-medium mb-1 ${isSeries ? "text-purple-400" : "text-blue-400"
                }`}
            >
              {isSeries ? "Series" : "Movie"}
              {media.year ? ` · ${media.year}` : ""}
            </span>
            <h2 className="text-white font-semibold text-lg leading-tight">
              {media.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-400 text-xl self-start transition"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Rating */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Rating
            </label>
            <RatingSelector value={rating} onChange={setRating} />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Watched on
            </label>
            <input
              type="date"
              value={watchedOn}
              max={today}
              onChange={(e) => setWatchedOn(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                         text-white text-sm outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Series episode fields */}
          {isSeries && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
                Progress
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Season
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                               text-white text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Ep. From
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={episodeFrom}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setEpisodeFrom(v);
                      if (v > episodeTo) setEpisodeTo(v);
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                               text-white text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Ep. To
                  </label>
                  <input
                    type="number"
                    min={episodeFrom}
                    value={episodeTo}
                    onChange={(e) =>
                      setEpisodeTo(Math.max(episodeFrom, Number(e.target.value)))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                               text-white text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Review */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">
              Review{" "}
              <span className="text-gray-600 normal-case">(optional)</span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="What did you think?"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700
                         text-white text-sm placeholder-gray-600 outline-none resize-none
                         focus:border-indigo-500 transition"
            />
          </div>

          {/* Rewatch toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setRewatch((r) => !r)}
              className={`w-9 h-5 rounded-full transition-colors relative ${rewatch ? "bg-indigo-600" : "bg-gray-700"
                }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${rewatch ? "translate-x-4" : "translate-x-0.5"
                  }`}
              />
            </div>
            <span className="text-sm text-gray-400">Rewatch</span>
          </label>

          {/* Error */}
          {error && <p className="text-red-400 text-xs">{error}</p>}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || !rating}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white font-medium text-sm transition
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save to diary"}
          </button>
        </div>
      </div>
    </div>
  );
}

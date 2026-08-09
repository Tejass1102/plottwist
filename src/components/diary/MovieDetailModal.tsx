"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { NormalizedSearchResult } from "@/lib/types/tmdb";
import type { RatingLabel } from "@/lib/types/database";
import LogEntryModal from "./LogEntryModal";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface MovieDetailModalProps {
  media: NormalizedSearchResult; // ← matches your LogEntryModal prop name
  onClose: () => void;
  onSaved?: () => void;
}

interface ActivityEntry {
  id: string;
  watched_on: string;
  rating: string | null;
  review: string | null;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const TMDB = "https://image.tmdb.org/t/p";

const RATINGS: { label: RatingLabel; emoji: string }[] = [
  { label: "Skip", emoji: "🗑️" },
  { label: "Mid", emoji: "😐" },
  { label: "Great", emoji: "👍" },
  { label: "Masterpiece", emoji: "🏆" },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function MovieDetailModal({
  media,
  onClose,
  onSaved,
}: MovieDetailModalProps) {
  const supabase = createClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Media detail
  const [overview, setOverview] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [detailLoading, setDetailLoading] = useState(true);

  // User interaction state
  const [isWatched, setIsWatched] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [currentRating, setCurrentRating] = useState<RatingLabel | null>(null);

  // UI state
  const [showMenu, setShowMenu] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState("");

  // ── Effects ───────────────────────────────────────────────

  useEffect(() => {
    fetchMediaDetail();
    checkUserStatus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  useEffect(() => {
    if (showActivity && activityEntries.length === 0) fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showActivity]);

  // ── Data fetchers ─────────────────────────────────────────

  async function fetchMediaDetail() {
    try {
      const res = await fetch(
        `/api/media?id=${media.tmdb_id}&type=${media.media_type}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setOverview(data.overview || "");
      setGenres(
        (data.genres as Array<{ name: string }> | undefined)
          ?.map((g) => g.name)
          .slice(0, 3) ?? [],
      );
    } catch {
      // overview is optional — fail silently
    } finally {
      setDetailLoading(false);
    }
  }

  async function checkUserStatus() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [diaryRes, likeRes, watchlistRes] = await Promise.all([
      supabase
        .from("diary_entries")
        .select("rating")
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type)
        .order("watched_on", { ascending: false })
        .limit(1),
      supabase
        .from("user_likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type),
      supabase
        .from("watchlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type),
    ]);

    if (diaryRes.data?.length) {
      setIsWatched(true);
      setCurrentRating((diaryRes.data[0].rating as RatingLabel) || null);
    }
    setIsLiked(!!likeRes.data?.length);
    setIsWatchlisted(!!watchlistRes.data?.length);
  }

  async function fetchActivity() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("diary_entries")
      .select("id, watched_on, rating, review")
      .eq("user_id", user.id)
      .eq("tmdb_id", media.tmdb_id)
      .eq("media_type", media.media_type)
      .order("watched_on", { ascending: false });
    setActivityEntries(data || []);
  }

  // ── Action handlers ───────────────────────────────────────

  async function handleWatch() {
    setActionLoading("watch");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setActionLoading(null);
      return;
    }

    if (isWatched) {
      const { data: rows } = await supabase
        .from("diary_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type)
        .order("watched_on", { ascending: false })
        .limit(1);
      if (rows?.[0]) {
        await supabase.from("diary_entries").delete().eq("id", rows[0].id);
      }
      setIsWatched(false);
      setCurrentRating(null);
    } else {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("diary_entries").upsert(
        {
          user_id: user.id,
          tmdb_id: media.tmdb_id,
          media_type: media.media_type,
          title: media.title,
          poster_path: media.poster_path ?? null,
          release_year: media.release_year ?? null,
          watched_on: today,
        },
        { onConflict: "user_id,tmdb_id,watched_on", ignoreDuplicates: true },
      );
      setIsWatched(true);
    }
    setActionLoading(null);
    setShowMenu(false);
    onSaved?.();
  }

  async function handleLike() {
    setActionLoading("like");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setActionLoading(null);
      return;
    }

    if (isLiked) {
      await supabase
        .from("user_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type);
      setIsLiked(false);
    } else {
      await supabase.from("user_likes").insert({
        user_id: user.id,
        tmdb_id: media.tmdb_id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path ?? null,
        release_year: media.release_year ?? null,
      });
      setIsLiked(true);
    }
    setActionLoading(null);
    setShowMenu(false);
  }

  async function handleWatchlist() {
    setActionLoading("watchlist");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setActionLoading(null);
      return;
    }

    if (isWatchlisted) {
      await supabase
        .from("watchlist")
        .delete()
        .eq("user_id", user.id)
        .eq("tmdb_id", media.tmdb_id)
        .eq("media_type", media.media_type);
      setIsWatchlisted(false);
    } else {
      await supabase.from("watchlist").insert({
        user_id: user.id,
        tmdb_id: media.tmdb_id,
        media_type: media.media_type,
        title: media.title,
        poster_path: media.poster_path ?? null,
        release_year: media.release_year ?? null,
      });
      setIsWatchlisted(true);
    }
    setActionLoading(null);
    setShowMenu(false);
  }

  async function handleRating(rating: RatingLabel) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const newRating = currentRating === rating ? null : rating;
    setCurrentRating(newRating);

    const { data: rows } = await supabase
      .from("diary_entries")
      .select("id")
      .eq("user_id", user.id)
      .eq("tmdb_id", media.tmdb_id)
      .eq("media_type", media.media_type)
      .order("watched_on", { ascending: false })
      .limit(1);

    if (rows?.[0]) {
      await supabase
        .from("diary_entries")
        .update({ rating: newRating })
        .eq("id", rows[0].id);
    } else if (newRating) {
      const today = new Date().toISOString().split("T")[0];
      await supabase.from("diary_entries").upsert(
        {
          user_id: user.id,
          tmdb_id: media.tmdb_id,
          media_type: media.media_type,
          title: media.title,
          poster_path: media.poster_path ?? null,
          release_year: media.release_year ?? null,
          watched_on: today,
          rating: newRating,
        },
        { onConflict: "user_id,tmdb_id,watched_on" },
      );
      setIsWatched(true);
    }
    onSaved?.();
  }

  async function handleShare() {
    const text = currentRating
      ? `Just rated "${media.title}" as ${currentRating} on PlotTwist`
      : `Check out "${media.title}" on PlotTwist`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: media.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg("Copied!");
        setTimeout(() => setShareMsg(""), 2000);
      }
    } catch {
      /* user cancelled */
    }
    setShowMenu(false);
  }

  // ── Derived ───────────────────────────────────────────────

  const posterSrc = media.poster_path
    ? `${TMDB}/w500${media.poster_path}`
    : "/placeholder-poster.png";

  const backdropSrc = media.poster_path
    ? `${TMDB}/w780${media.poster_path}`
    : null;

  // ── Swap to LogEntryModal when "Review or log..." is clicked ──

  if (showLogModal) {
    return (
      <LogEntryModal
        media={media} // ← your real prop name
        onClose={() => setShowLogModal(false)}
        onSaved={() => {
          setShowLogModal(false);
          checkUserStatus(); // refresh watched/rating badge
          onSaved?.();
        }}
      />
    );
  }

  // ── Main render ───────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full sm:max-w-[440px] bg-gray-900 sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92dvh] flex flex-col">
        {/* ══ Hero header ══ */}
        <div className="relative h-52 flex-shrink-0 overflow-hidden">
          {backdropSrc && (
            <Image
              src={backdropSrc}
              alt=""
              fill
              priority
              className="object-cover scale-110 blur-md opacity-25"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/65 to-gray-900/15" />

          {/* Poster + title */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end gap-4 p-4 pr-24">
            <div className="relative w-[62px] h-[93px] flex-shrink-0 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
              <Image
                src={posterSrc}
                alt={media.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 pb-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-indigo-600/25 text-indigo-300 border border-indigo-500/30">
                  {media.media_type === "movie" ? "Movie" : "Series"}
                </span>
                {media.release_year && (
                  <span className="text-xs text-gray-400 font-medium">
                    {media.release_year}
                  </span>
                )}
              </div>
              <h2 className="text-white font-bold text-[19px] leading-snug line-clamp-2">
                {media.title}
              </h2>
              {genres.length > 0 && (
                <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                  {genres.join(" · ")}
                </p>
              )}
            </div>
          </div>

          {/* ··· menu + close */}
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            {/* Three-dot button */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-label="More options"
                className="w-9 h-9 rounded-full bg-black/55 border border-white/10 text-gray-300 hover:text-white hover:bg-black/70 flex items-center justify-center transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[18px] h-[18px]"
                >
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>

              {/* Dropdown panel */}
              {showMenu && (
                <div
                  className="absolute right-0 top-11 w-60 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-20"
                  style={{ background: "#141519" }}
                >
                  {/* Watch · Like · Watchlist icon row */}
                  <div className="flex justify-around items-center px-3 py-4 border-b border-white/8">
                    <MenuIconAction
                      icon={<EyeIcon filled={isWatched} />}
                      label="Watch"
                      active={isWatched}
                      color="indigo"
                      loading={actionLoading === "watch"}
                      onClick={handleWatch}
                    />
                    <MenuIconAction
                      icon={<HeartIcon filled={isLiked} />}
                      label="Like"
                      active={isLiked}
                      color="red"
                      loading={actionLoading === "like"}
                      onClick={handleLike}
                    />
                    <MenuIconAction
                      icon={<BookmarkIcon filled={isWatchlisted} />}
                      label="Watchlist"
                      active={isWatchlisted}
                      color="amber"
                      loading={actionLoading === "watchlist"}
                      onClick={handleWatchlist}
                    />
                  </div>

                  {/* Text items */}
                  <div className="py-1.5">
                    <MenuTextItem
                      emoji="✍️"
                      label="Review or log..."
                      onClick={() => {
                        setShowLogModal(true);
                        setShowMenu(false);
                      }}
                    />
                    <MenuTextItem
                      emoji="📋"
                      label="Show your activity"
                      onClick={() => {
                        setShowActivity((v) => !v);
                        setShowMenu(false);
                      }}
                    />
                    <MenuTextItem
                      emoji="📁"
                      label="Add film to lists..."
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="mx-4 my-1 h-px bg-white/8" />
                    <MenuTextItem
                      emoji={shareMsg ? "✅" : "🔗"}
                      label={shareMsg || "Share this review"}
                      onClick={handleShare}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-black/55 border border-white/10 text-gray-300 hover:text-white hover:bg-black/70 flex items-center justify-center transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-4 h-4"
              >
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ══ Scrollable body ══ */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          <div className="p-5 space-y-5">
            {/* Overview */}
            {detailLoading ? (
              <div className="space-y-2.5">
                {[100, 88, 72].map((w) => (
                  <div
                    key={w}
                    className="h-3 rounded-md bg-gray-800 animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            ) : overview ? (
              <ExpandableOverview overview={overview} />
            ) : (
              <p className="text-sm text-gray-600 italic">
                No overview available.
              </p>
            )}

            <div className="h-px bg-gray-800/80" />

            {/* Rating tiles */}
            <div>
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
                Your Rating
              </p>
              <div className="grid grid-cols-4 gap-2">
                {RATINGS.map(({ label, emoji }) => {
                  const active = currentRating === label;
                  return (
                    <button
                      key={label}
                      onClick={() => handleRating(label)}
                      className={`
                        flex flex-col items-center gap-1.5 py-3.5 px-1 rounded-xl
                        border-2 transition-all duration-200 active:scale-95
                        ${
                          active
                            ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                            : "border-gray-700/50 bg-gray-800/60 hover:border-gray-600 hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-2xl leading-none select-none">
                        {emoji}
                      </span>
                      <span
                        className={`text-[10px] font-bold tracking-wide ${active ? "text-indigo-300" : "text-gray-600"}`}
                      >
                        {label.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Activity section */}
            {showActivity && (
              <>
                <div className="h-px bg-gray-800/80" />
                <div>
                  <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">
                    Your Activity
                  </p>
                  {activityEntries.length === 0 ? (
                    <p className="text-sm text-gray-600 text-center py-3 italic">
                      No diary entries yet for this title.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {activityEntries.map((e) => (
                        <div
                          key={e.id}
                          className="bg-gray-800/50 rounded-xl px-3.5 py-3 border border-white/5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(e.watched_on).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                            {e.rating && (
                              <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                {e.rating}
                              </span>
                            )}
                          </div>
                          {e.review && (
                            <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-3">
                              {e.review}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function MenuIconAction({
  icon,
  label,
  active,
  color,
  loading,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  color: "indigo" | "red" | "amber";
  loading: boolean;
  onClick: () => void;
}) {
  const styles = {
    indigo: {
      on: "bg-indigo-500/20 text-indigo-400",
      label: "text-indigo-400",
    },
    red: { on: "bg-red-500/20    text-red-400", label: "text-red-400" },
    amber: { on: "bg-amber-500/20  text-amber-400", label: "text-amber-400" },
  }[color];

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-1.5 group disabled:opacity-40"
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
          active
            ? styles.on
            : "bg-gray-800 text-gray-500 group-hover:text-gray-200 group-hover:bg-gray-700"
        }`}
      >
        {icon}
      </div>
      <span
        className={`text-[10px] font-semibold tracking-wide ${
          active ? styles.label : "text-gray-600 group-hover:text-gray-400"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function MenuTextItem({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      <span className="w-5 text-base">{emoji}</span>
      {label}
    </button>
  );
}

function ExpandableOverview({ overview }: { overview: string }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 200;
  const isLong = overview.length > LIMIT;

  return (
    <div>
      <p className="text-sm text-gray-400 leading-relaxed">
        {isLong && !expanded
          ? `${overview.slice(0, LIMIT).trimEnd()}…`
          : overview}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
    </div>
  );
}

function EyeIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className="w-5 h-5"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

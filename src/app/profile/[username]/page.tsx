// src/app/profile/[username]/page.tsx
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getPosterUrl } from "@/lib/tmdb";
import Navbar from "@/components/layout/NavBar";
import type { DiaryEntry, Profile } from "@/lib/types/database";

const RATING_STYLES: Record<string, string> = {
  Skip: "bg-red-950 text-red-400 border-red-900",
  Mid: "bg-yellow-950 text-yellow-400 border-yellow-900",
  Great: "bg-green-950 text-green-400 border-green-900",
  Masterpiece: "bg-indigo-950 text-indigo-400 border-indigo-900",
};

interface Props {
  params: { username: string };
}

export default async function ProfilePage({ params }: Props) {
  const supabase = await createClient();

  // Fetch profile
  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("username", params.username)
    .single()) as { data: Profile | null };

  if (!profile) notFound();

  // Fetch their diary entries
  const { data: entries } = (await supabase
    .from("diary_entries")
    .select("*")
    .eq("user_id", profile.id)
    .order("watched_on", { ascending: false })
    .limit(50)) as { data: DiaryEntry[] | null };

  const allEntries = entries ?? [];
  const movies = allEntries.filter((e) => e.media_type === "movie").length;
  const series = allEntries.filter((e) => e.media_type === "series").length;
  const masterpieces = allEntries.filter((e) => e.rating === "Masterpiece");

  // Rating distribution
  const ratingCounts = ["Skip", "Mid", "Great", "Masterpiece"].reduce(
    (acc, r) => {
      acc[r] = allEntries.filter((e) => e.rating === r).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <div
            className="w-16 h-16 rounded-full bg-indigo-900 flex items-center
                          justify-center text-2xl font-bold text-indigo-300 flex-shrink-0"
          >
            {(profile.display_name || profile.username)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-gray-500 text-sm">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-400 text-sm mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total", value: allEntries.length },
            { label: "Movies", value: movies },
            { label: "Series", value: series },
            { label: "🏆", value: masterpieces.length },
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

        {/* Rating distribution mini */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-8">
          <h3 className="text-xs text-gray-500 uppercase tracking-wide mb-3">
            Rating breakdown
          </h3>
          <div className="flex gap-2">
            {["Skip", "Mid", "Great", "Masterpiece"].map((r) => (
              <div key={r} className="flex-1 text-center">
                <span
                  className={`text-xs px-2 py-1 rounded-lg border block ${RATING_STYLES[r]}`}
                >
                  {ratingCounts[r]}
                </span>
                <span className="text-gray-600 text-xs mt-1 block">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Masterpieces shelf */}
        {masterpieces.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
              🏆 Masterpieces
            </h2>
            <div className="flex gap-2 flex-wrap">
              {masterpieces.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  className="relative w-14 h-20 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0"
                >
                  <Image
                    src={getPosterUrl(e.poster_path, "w92")}
                    alt={e.title}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent diary */}
        <div>
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3">
            Recent watches
          </h2>
          <div className="space-y-2">
            {allEntries.slice(0, 20).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800
                           rounded-xl"
              >
                <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                  <Image
                    src={getPosterUrl(entry.poster_path, "w92")}
                    alt={entry.title}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {entry.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(
                      entry.watched_on + "T00:00:00",
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-lg border flex-shrink-0
                  ${RATING_STYLES[entry.rating ?? ""]}`}
                >
                  {entry.rating}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

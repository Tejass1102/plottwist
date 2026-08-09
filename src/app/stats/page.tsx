// src/app/stats/page.tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import StatsGrid from "@/components/stats/StatsGrid";
import ChatWidget from "@/components/chat/ChatWidget";
import type { DiaryEntry } from "@/lib/types/database";

export default function StatsPage() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchEntries() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      const { data } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("watched_on", { ascending: false });

      setEntries(data ?? []);
      setLoading(false);
    }

    fetchEntries();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Stats</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <StatsGrid entries={entries} />
        )}
      </div>

      <ChatWidget />
    </div>
  );
}

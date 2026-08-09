// src/components/layout/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/diary", label: "Diary" },
  { href: "/stats", label: "Stats" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single()
          .then(({ data }) => {
            if (data) setUsername(data.username);
          });
      }
    });
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="border-b border-gray-800 bg-gray-950 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-lg font-bold text-white">
          Plot<span className="text-indigo-500">Twist</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                pathname === link.href
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Profile + sign out */}
        <div className="flex items-center gap-3">
          {username && (
            <Link
              href={`/profile/${username}`}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              @{username}
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-600 hover:text-gray-400 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

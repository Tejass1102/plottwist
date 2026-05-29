"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-gray-900 border border-gray-800">
        <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
        <p className="text-gray-400 text-sm mb-8">
          Sign in to your Screenvault
        </p>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-lg border border-gray-700 text-white text-sm
                     hover:bg-gray-800 transition mb-6 flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-xs">or</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700
                       text-white text-sm placeholder-gray-500 outline-none
                       focus:border-indigo-500 transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700
                       text-white text-sm placeholder-gray-500 outline-none
                       focus:border-indigo-500 transition"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          No account?{" "}
          <Link
            href="/auth/signup"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

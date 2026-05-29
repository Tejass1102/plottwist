"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center max-w-sm px-8">
          <div className="text-4xl mb-4">📬</div>
          <h2 className="text-white text-xl font-semibold mb-2">
            Check your email
          </h2>
          <p className="text-gray-400 text-sm">
            We sent a confirmation link to{" "}
            <strong className="text-white">{email}</strong>. Click it to
            activate your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-sm p-8 rounded-2xl bg-gray-900 border border-gray-800">
        <h1 className="text-2xl font-semibold text-white mb-2">
          Create account
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Start tracking what you watch
        </p>

        <button
          onClick={handleGoogleSignup}
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

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700
                       text-white text-sm placeholder-gray-500 outline-none
                       focus:border-indigo-500 transition"
          />
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
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
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-indigo-400 hover:text-indigo-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

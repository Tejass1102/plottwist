import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already logged in — send straight to dashboard
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-xl w-full text-center">
        {/* Logo / wordmark */}
        <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
          Plot<span className="text-indigo-500">Twist</span>
        </h1>
        <p className="text-gray-400 text-lg mb-10">
          Track every movie and series you watch.
          <br />
          Rate honestly. Discover what to watch next.
        </p>

        {/* Rating tiers preview */}
        <div className="flex justify-center gap-3 mb-12">
          {[
            {
              label: "Skip",
              bg: "bg-red-950",
              text: "text-red-400",
              border: "border-red-900",
            },
            {
              label: "Mid",
              bg: "bg-yellow-950",
              text: "text-yellow-400",
              border: "border-yellow-900",
            },
            {
              label: "Great",
              bg: "bg-green-950",
              text: "text-green-400",
              border: "border-green-900",
            },
            {
              label: "Masterpiece",
              bg: "bg-indigo-950",
              text: "text-indigo-400",
              border: "border-indigo-900",
            },
          ].map((r) => (
            <span
              key={r.label}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${r.bg} ${r.text} ${r.border}`}
            >
              {r.label}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white font-medium text-sm transition"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-xl border border-gray-800 hover:border-gray-700
                       text-gray-300 hover:text-white font-medium text-sm transition"
          >
            Sign in
          </Link>
        </div>

        {/* Subtle feature hint */}
        <p className="text-gray-600 text-xs mt-10">
          Movies · Web series · AI recommendations · No star ratings
        </p>
      </div>
    </main>
  );
}

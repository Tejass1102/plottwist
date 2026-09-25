// supabase/functions/chat/index.ts
// Runs on Supabase Edge (Deno) — never exposes API keys to client

import { createClient } from "npm:@supabase/supabase-js";
/// <reference types="deno.ns" />

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Groq model — fast & free-tier friendly
// Alternatives: "llama3-8b-8192" | "gemma2-9b-it" | "mixtral-8x7b-32768"
const GROQ_MODEL = "llama-3.1-8b-instant";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    // ── 1. Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401, headers: CORS });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response("Unauthorized", { status: 401, headers: CORS });
    }

    // ── 2. Parse request ─────────────────────────────────────
    const { messages, mode } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      mode: "recommend" | "chat";
    };

    // ── 3. Fetch user's diary for context ────────────────────
    const { data: entries } = await supabase
      .from("diary_entries")
      .select("title, rating, media_type, watched_on, review")
      .eq("user_id", user.id)
      .order("watched_on", { ascending: false })
      .limit(100);

    const diary = entries ?? [];

    const byRating = (r: string) =>
      diary.filter((e) => e.rating === r).map((e) => e.title);

    const masterpieces = byRating("Masterpiece");
    const great = byRating("Great");
    const mid = byRating("Mid");
    const skip = byRating("Skip");
    const movies = diary.filter((e) => e.media_type === "movie").length;
    const series = diary.filter((e) => e.media_type === "series").length;

    // ── 4. Build system prompt ───────────────────────────────
    const diarySection =
      diary.length > 0
        ? `
The user's PlotTwist diary (${diary.length} entries — ${movies} movies, ${series} series):

🏆 MASTERPIECE (${masterpieces.length}): ${masterpieces.slice(0, 25).join(", ") || "None yet"}
👍 GREAT (${great.length}): ${great.slice(0, 25).join(", ") || "None yet"}
😐 MID (${mid.length}): ${mid.slice(0, 25).join(", ") || "None yet"}
🗑  SKIP (${skip.length}): ${skip.slice(0, 25).join(", ") || "None yet"}

Use this taste profile to personalise every response. Reference their specific titles when relevant.
Recent watches: ${diary
            .slice(0, 5)
            .map((e) => e.title)
            .join(", ")}`
        : "The user has not logged any entries yet. Encourage them to start logging!";

    const systemPrompt = `You are a friendly, knowledgeable film and TV assistant for PlotTwist — a personal watch tracker.

${diarySection}

Guidelines:
- Be concise and conversational. 2-4 sentences for chat, 3-5 bullets for recommendations.
- When recommending, explain WHY it matches their taste using their specific logged titles.
- Always mention whether something is a movie or a series.
- You can discuss plot, themes, directors, cinematography, awards, hidden details, trivia.
- Be enthusiastic but not over the top. Film-literate, never pretentious.
- Never invent films that don't exist.
- The rating system on PlotTwist is: Skip (bad) · Mid (okay) · Great (good) · Masterpiece (exceptional).
${
  mode === "recommend"
    ? "- The user wants recommendations. Give 3-5 specific tailored suggestions with a one-line reason for each."
    : ""
}`;

    // ── 5. Call Groq API (OpenAI-compatible) with streaming ──
    const groqRes = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Groq uses Bearer auth, unlike Gemini's query-param key
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          stream: true,
          max_tokens: 1024,
          temperature: 0.8,
          // System prompt is just the first message with role "system"
          messages: [
            { role: "system", content: systemPrompt },
            // Then the conversation history from the client
            ...messages.map((m) => ({
              role: m.role, // "user" | "assistant" — already matches OpenAI spec
              content: m.content,
            })),
          ],
        }),
      },
    );

    if (!groqRes.ok) {
      const err = await groqRes.text();
      throw new Error(`Groq API error: ${err}`);
    }

    // ── 6. Pipe the SSE stream straight back to the client ───
    // Groq SSE format is OpenAI-compatible so ChatWidget parses it identically
    return new Response(groqRes.body, {
      headers: {
        ...CORS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("Chat function error:", err);
    return new Response(
      JSON.stringify({ error: "Chat failed. Please try again." }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});

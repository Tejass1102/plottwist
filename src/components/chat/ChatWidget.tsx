// src/components/chat/ChatWidget.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import ChatMessageBubble from "./ChatMessage";
import { PROMPT_STARTERS } from "@/lib/types/chat";
import type { ChatMessage, ChatMode } from "@/lib/types/chat";

let msgIdCounter = 0;
const uid = () => String(++msgIdCounter);

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("chat");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = useCallback(
    async (text: string, overrideMode?: ChatMode) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      const activeMode = overrideMode ?? mode;
      setInput("");

      const userMsg: ChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMsg]);

      const loadingId = uid();
      const loadingMsg: ChatMessage = {
        id: loadingId,
        role: "assistant",
        content: "",
        loading: true,
      };
      setMessages((prev) => [...prev, loadingMsg]);
      setStreaming(true);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ messages: history, mode: activeMode }),
          },
        );

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed: ${res.status}`);
        }

        // ── Parse Groq / OpenAI-compatible SSE stream ────────
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue; // Groq sends [DONE] at end, same as OpenAI

            try {
              const parsed = JSON.parse(data);
              // ✅ Groq / OpenAI SSE format (changed from Gemini)
              const delta = parsed.choices?.[0]?.delta?.content ?? "";
              if (delta) {
                accText += delta;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === loadingId
                      ? { ...m, content: accText, loading: false }
                      : m,
                  ),
                );
              }
            } catch {
              // ignore malformed chunks
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? { ...m, content: accText || "(no response)", loading: false }
              : m,
          ),
        );
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? {
                  ...m,
                  content: "Something went wrong. Please try again.",
                  loading: false,
                }
              : m,
          ),
        );
      } finally {
        setStreaming(false);
      }
    },
    [messages, mode, streaming, supabase],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleStarter(starter: (typeof PROMPT_STARTERS)[0]) {
    setMode(starter.mode);
    sendMessage(starter.text, starter.mode);
  }

  function clearChat() {
    setMessages([]);
    setInput("");
  }

  return (
    <>
      {open && (
        <div
          className="fixed bottom-20 right-4 w-[360px] h-[520px] z-50
                      bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl
                      flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-base">🎬</span>
              <div>
                <p className="text-sm font-semibold text-white">
                   PlotTwist AI
                </p>
                <p className="text-xs text-gray-500">Knows your taste</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-xs text-gray-600 hover:text-gray-400 transition px-2 py-1
                             rounded border border-gray-700 hover:border-gray-600"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="text-gray-600 hover:text-gray-400 transition text-lg w-6 h-6
                           flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-1 px-3 pt-3 pb-0 flex-shrink-0">
            {(["chat", "recommend"] as ChatMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition capitalize ${
                  mode === m
                    ? "bg-indigo-950 text-indigo-400 border border-indigo-800"
                    : "bg-gray-800 text-gray-500 border border-transparent hover:text-gray-300"
                }`}
              >
                {m === "chat" ? "💬 Chat" : "🎯 Recommend"}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center">
                <p className="text-xs text-gray-500 text-center mb-4">
                  Ask anything about movies and series,
                  <br />
                  or get recommendations based on your diary.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PROMPT_STARTERS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleStarter(s)}
                      className="text-xs text-left px-3 py-2.5 rounded-xl
                                 bg-gray-800 border border-gray-700
                                 text-gray-300 hover:border-indigo-700
                                 hover:text-white transition leading-relaxed"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="flex items-end gap-2 px-3 pb-3 pt-2 border-t border-gray-800 flex-shrink-0">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "recommend"
                  ? "Ask for recommendations..."
                  : "Ask about any film or series..."
              }
              rows={1}
              disabled={streaming}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl
                         px-3 py-2 text-sm text-white placeholder-gray-600
                         outline-none focus:border-indigo-600 transition
                         resize-none disabled:opacity-50 leading-relaxed"
              style={{ maxHeight: "96px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = t.scrollHeight + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || streaming}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500
                         flex items-center justify-center flex-shrink-0
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition text-white text-sm"
            >
              {streaming ? (
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "↑"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-2xl
                   flex items-center justify-center z-50 transition-all duration-200
                   ${
                     open
                       ? "bg-gray-700 text-white"
                       : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105"
                   }`}
      >
        {open ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-2xl">💬</span>
        )}
        {!open && messages.length === 0 && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950 animate-pulse" />
        )}
      </button>
    </>
  );
}

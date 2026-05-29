// src/lib/types/chat.ts

export type ChatRole = "user" | "assistant";
export type ChatMode = "chat" | "recommend";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  loading?: boolean; // true while streaming
}

// Shape we send to the Edge Function
export interface ChatRequest {
  messages: { role: ChatRole; content: string }[];
  mode: ChatMode;
}

// Prompt starters shown in empty state
export const PROMPT_STARTERS = [
  {
    label: "🎯 Recommend me something",
    mode: "recommend" as ChatMode,
    text: "Based on my diary, what should I watch next?",
  },
  {
    label: "🎬 Similar to my favourites",
    mode: "recommend" as ChatMode,
    text: "What films are similar to my Masterpieces?",
  },
  {
    label: "📺 Best series to start",
    mode: "recommend" as ChatMode,
    text: "I want to start a new series. What do you suggest based on my taste?",
  },
  {
    label: "💬 Chat about a film",
    mode: "chat" as ChatMode,
    text: "Tell me something interesting about one of my Masterpiece films.",
  },
];

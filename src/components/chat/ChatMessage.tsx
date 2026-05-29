// src/components/chat/ChatMessage.tsx
import type { ChatMessage } from "@/lib/types/chat";

interface Props {
  message: ChatMessage;
}

export default function ChatMessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tr-sm
                        bg-indigo-600 text-white text-sm leading-relaxed"
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 mb-3">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800
                      flex items-center justify-center flex-shrink-0 mt-0.5"
      >
        <span className="text-xs">🎬</span>
      </div>

      {/* Bubble */}
      <div
        className="max-w-[80%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm
                      bg-gray-800 border border-gray-700 text-gray-100
                      text-sm leading-relaxed"
      >
        {message.loading ? (
          <span className="flex gap-1 items-center h-5">
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </span>
        ) : (
          // Render newlines and basic markdown bullets
          message.content.split("\n").map((line, i) => {
            const isBullet =
              line.trim().startsWith("•") || line.trim().startsWith("-");
            return (
              <p
                key={i}
                className={`${i > 0 ? "mt-1.5" : ""} ${isBullet ? "pl-2" : ""}`}
              >
                {line || <br />}
              </p>
            );
          })
        )}
      </div>
    </div>
  );
}

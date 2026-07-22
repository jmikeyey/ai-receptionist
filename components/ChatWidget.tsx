"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Markdown } from "@/components/Markdown";

const suggestions = ["What are your hours?", "Do you take new patients?", "Book a cleaning"];

export default function ChatWidget({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { businessId, conversationId },
    }),
  });

  const busy = status === "submitted" || status === "streaming";
  const initials = businessName.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    void sendMessage({ text: t });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-[100dvh] max-w-2xl flex-col bg-surface">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-tint text-sm font-semibold text-accent-ink">
          {initials || "?"}
        </span>
        <div className="leading-tight">
          <h1 className="text-sm font-semibold text-ink">{businessName}</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-good" />
            Virtual receptionist · online
          </p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="scroll-slim flex-1 overflow-y-auto bg-paper/50 px-4 py-6">
        {messages.length === 0 ? (
          <div className="mx-auto mt-8 max-w-sm text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent-tint text-accent-ink">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
                <path
                  d="M12 3a5 5 0 0 0-5 5c0 3-1 5-2 6h14c-1-1-2-3-2-6a5 5 0 0 0-5-5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm text-muted">
              Hi! Ask me anything about {businessName}, or book an appointment.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-[13px] text-muted transition-colors hover:border-accent hover:text-accent-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const text = m.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("");
              if (!text) return null;
              const mine = m.role === "user";
              return (
                <div key={m.id} className={`msg-in flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={
                      mine
                        ? "max-w-[82%] rounded-2xl rounded-br-md bg-accent px-3.5 py-2 text-sm text-white"
                        : "max-w-[85%] rounded-2xl rounded-bl-md border border-line bg-surface px-3.5 py-2 text-sm text-ink shadow-card"
                    }
                  >
                    {mine ? <p className="whitespace-pre-wrap">{text}</p> : <Markdown text={text} />}
                  </div>
                </div>
              );
            })}

            {busy && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 shadow-card">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <p className="rounded-2xl bg-warn-tint px-3.5 py-2 text-sm text-warn">
                  Something went wrong — please try again, or email us directly.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-line px-4 py-3.5"
      >
        <div className="flex items-end gap-2 rounded-2xl border border-line-strong bg-surface px-2 py-1.5 transition-colors focus-within:border-accent">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            aria-label="Message"
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-ink placeholder:text-faint outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-white transition-colors hover:bg-accent-strong disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden>
              <path
                d="M4 12 20 4l-4 16-4-7-8-1Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}

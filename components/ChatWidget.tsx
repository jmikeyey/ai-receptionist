"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

export default function ChatWidget({
  businessId,
  businessName,
}: {
  businessId: string;
  businessName: string;
}) {
  const [conversationId] = useState(() => crypto.randomUUID());
  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { businessId, conversationId },
    }),
  });

  const busy = status === "submitted" || status === "streaming";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    void sendMessage({ text });
    setInput("");
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="border-b border-neutral-200 bg-white px-5 py-4">
        <h1 className="font-semibold">{businessName}</h1>
        <p className="text-sm text-neutral-500">Virtual receptionist</p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
        {messages.length === 0 && (
          <p className="text-neutral-500">
            Hi! Ask me anything about {businessName}, or book an appointment.
          </p>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("");
          if (!text) return null;
          const mine = m.role === "user";
          return (
            <div key={m.id} className={mine ? "text-right" : "text-left"}>
              <span
                className={`inline-block max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-accent text-white" : "border border-neutral-200 bg-white"
                }`}
              >
                {text}
              </span>
            </div>
          );
        })}

        {busy && <p className="text-sm text-neutral-400">Typing…</p>}
        {error && (
          <p className="text-sm text-red-600">Something went wrong — please try again.</p>
        )}
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t border-neutral-200 bg-white p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

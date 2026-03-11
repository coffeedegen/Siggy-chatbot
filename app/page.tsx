"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Request failed");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "No response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}. Check OPENAI_API_KEY and try again.`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      {/* Header */}
      <header className="flex-shrink-0 py-4 px-4 border-b border-slate-700/50">
        <h1 className="text-xl font-semibold text-white">
          Siggy – Ritual's Wise Resident Cat
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Ask me anything about Ritual.
        </p>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto chat-scroll py-4 px-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="text-center text-slate-500 py-12">
            <p className="text-lg">Gritual, Stranger!</p>
            <p className="text-sm mt-2">
              I am Siggy, the Wise. Speak and let your purpose be known to me.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent text-black rounded-br-md"
                  : "bg-cosmic border border-slate-600/50 text-slate-200 rounded-bl-md"
              }`}
            >
              <p className="text-sm font-medium mb-1">
                {msg.role === "user" ? "You" : "Siggy"}
              </p>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-cosmic border border-slate-600/50 rounded-2xl rounded-bl-md px-4 py-3">
              <p className="text-sm font-medium mb-1 text-slate-400">Siggy</p>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 p-4 border-t border-slate-700/50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Siggy..."
            className="flex-1 rounded-xl bg-cosmic border border-slate-600 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-accent hover:bg-accent-dim disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-medium text-white transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

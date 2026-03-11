"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  { label: "What is Ritual?", emoji: "⛩️" },
  { label: "Explain Infernet", emoji: "🌐" },
  { label: "Ritual vs others", emoji: "🔍" },
  { label: "Build on Ritual", emoji: "🛠️" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
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
      if (!res.ok) throw new Error(data.error || "Request failed");

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply ?? "No response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  return (
    <div className="flex h-screen bg-[#0e0e10] text-white overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#13131a] border-r border-white/5 flex flex-col p-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 py-2">
          <span className="w-2 h-2 rounded-full bg-[#40FFAF]" />
          <span className="font-bold text-lg tracking-tight">
            Ask<span className="text-[#40FFAF]">Siggy</span>
          </span>
        </div>

        {/* Siggy Card */}
        <div className="rounded-xl bg-[#1a1a24] border border-white/5 overflow-hidden">
          <div className="h-24 bg-gradient-to-b from-[#40FFAF]/10 to-transparent flex items-center justify-center pt-3">
            <img
              src="/siggy-avatar.png"
              alt="Siggy"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#40FFAF]/40"
            />
          </div>
          <div className="p-3 text-center">
            <div className="inline-flex items-center gap-1.5 bg-[#40FFAF]/10 text-[#40FFAF] text-xs font-medium px-2.5 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#40FFAF] animate-pulse" />
              SIGGY ONLINE
            </div>
            <p className="text-xs text-white/40 leading-relaxed">
              Your cosmic guide to Ritual Network. Cute but sharp. 🐾
            </p>
          </div>
        </div>

        {/* What Siggy can do */}
        <div>
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-2">
            What Siggy Can Do
          </p>
          <ul className="flex flex-col gap-1">
            {[
              { icon: "⛩️", label: "Explain Ritual & Web3" },
              { icon: "🤖", label: "On-chain AI & Infernet" },
              { icon: "🔍", label: "Research & summarize" },
              { icon: "💡", label: "Brainstorm ideas" },
              { icon: "✍️", label: "Write & edit content" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-default"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer hint */}
        <div className="mt-auto text-[10px] text-white/20 leading-relaxed">
          Press <kbd className="bg-white/10 px-1 rounded">Enter</kbd> to send
          <br />
          <kbd className="bg-white/10 px-1 rounded">Shift+Enter</kbd> for new line
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 min-w-0">
        
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 flex-shrink-0">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/30 font-semibold">Conversation</p>
            <h1 className="text-base font-bold text-white">Chat with Siggy</h1>
          </div>
          <div className="border border-[#40FFAF]/40 text-[#40FFAF] text-xs font-bold px-4 py-1.5 rounded-full tracking-widest">
            READY
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-6 py-6 space-y-4">
          
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#40FFAF]/20 blur-2xl scale-150" />
                <img
                  src="/siggy-avatar.png"
                  alt="Siggy"
                  className="relative w-28 h-28 rounded-2xl object-cover border border-[#40FFAF]/30 shadow-lg shadow-[#40FFAF]/10"
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-1">
                  Hey there! I'm <span className="text-[#40FFAF]">Siggy</span>
                </h2>
                <p className="text-sm text-white/40 max-w-xs">
                  Ask me anything about Ritual, Web3, or anything else — I'm here to help you explore, build, and understand.
                </p>
              </div>
              {/* Quick prompt buttons */}
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => sendMessage(p.label)}
                    className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#40FFAF]/30 px-3 py-2 rounded-full transition-all"
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <img src="/siggy-avatar.png" alt="Siggy" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30" />
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-[#40FFAF] text-black rounded-br-sm"
                    : "bg-[#1a1a24] border border-white/5 text-white/85 rounded-bl-sm"
                }`}
              >
                <p className="text-xs font-bold mb-1 opacity-60">
                  {msg.role === "user" ? "You" : "Siggy"}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <img src="/user-avatar.png" alt="You" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/20" />
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex items-end gap-2.5 justify-start">
              <img src="/siggy-avatar.png" alt="Siggy" className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30" />
              <div className="bg-[#1a1a24] border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                <p className="text-xs font-bold mb-2 opacity-40">Siggy</p>
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#40FFAF]/50 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-[#40FFAF]/50 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-[#40FFAF]/50 animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/5">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 bg-[#1a1a24] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#40FFAF]/40 transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
                placeholder="Ask Siggy anything..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-xl bg-[#40FFAF] hover:bg-[#2EDEA0] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
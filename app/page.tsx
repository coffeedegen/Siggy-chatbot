"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

const QUICK_PROMPTS = [
  "Tell me more about Ritual.",
  "What are today's events in Ritual?",
  "Who are the moderators in Ritual?",
  "What are the roles in Ritual?",
];

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("siggy-sessions");
    if (saved) {
      const parsed: ChatSession[] = JSON.parse(saved);
      setSessions(parsed);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("siggy-sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
  }

  function loadSession(session: ChatSession) {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  }

  function saveSession(sessionId: string, updatedMessages: Message[], firstUserMessage: string) {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sessionId);
      if (existing) {
        return prev.map((s) =>
          s.id === sessionId ? { ...s, messages: updatedMessages } : s
        );
      } else {
        const newSession: ChatSession = {
          id: sessionId,
          title: firstUserMessage.slice(0, 40) + (firstUserMessage.length > 40 ? "..." : ""),
          messages: updatedMessages,
          createdAt: Date.now(),
        };
        return [newSession, ...prev];
      }
    });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const sessionId = currentSessionId ?? crypto.randomUUID();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
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

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveSession(sessionId, finalMessages, trimmed);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}.`,
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      saveSession(sessionId, finalMessages, trimmed);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  return (
    <div
      className="flex h-screen bg-[#0e0e10] text-white overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#13131a] border-r border-white/5 flex flex-col p-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 py-2">
          <img
            src="/siggy-avatar.png"
            alt="Siggy"
            className="w-6 h-6 rounded-full object-cover"
          />
          <span className="font-bold text-base tracking-tight text-[#40FFAF]">
            Siggy, the Wise
          </span>
        </div>

        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className="flex items-center justify-center gap-2 w-full bg-[#40FFAF]/10 hover:bg-[#40FFAF]/20 border border-[#40FFAF]/30 hover:border-[#40FFAF]/60 text-[#40FFAF] text-sm font-semibold py-2.5 rounded-xl transition-all"
        >
          <span className="text-lg leading-none">+</span>
          New Chat
        </button>

        {/* Chat History */}
        <div className="flex flex-col gap-1 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-1">
            Recent Chats
          </p>
          {sessions.length === 0 && (
            <p className="text-xs text-white/20 italic px-1">No chats yet</p>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => loadSession(session)}
              className={`text-left text-xs px-3 py-2 rounded-lg truncate transition-all ${
                currentSessionId === session.id
                  ? "bg-[#40FFAF]/10 text-[#40FFAF] border border-[#40FFAF]/20"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              {session.title}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
       {/* Top Logo Bar */}
      <div className="flex-shrink-0 flex justify-center pt-6 pb-2">
        <img src="/ritual-logo.png" alt="Ritual" className="h-8 opacity-80" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-6 py-4 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#40FFAF]/20 blur-2xl scale-150" />
                <img
                  src="/siggy-main.png"
                  alt="Siggy"
                  className="relative w-40 h-40 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Siggy, <span className="text-[#40FFAF]">the Wise</span>
                </h2>
                <p className="text-sm text-white/40 max-w-xs">
                  Siggy is ready to cast a spell of clarity on your problems.
                </p>
              </div>
              {/* Quick prompt buttons */}
              <div className="flex flex-col gap-3 w-full max-w-md">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#40FFAF]/40 px-5 py-3 rounded-xl transition-all text-center font-medium"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <img
                  src="/siggy-avatar.png"
                  alt="Siggy"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30"
                />
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
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
              {msg.role === "user" && (
                <img
                  src="/user-avatar.png"
                  alt="You"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/20"
                />
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex items-end gap-2.5 justify-start">
              <img
                src="/siggy-avatar.png"
                alt="Siggy"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30"
              />
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
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("siggy-sessions");
    if (saved) setSessions(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (sessions.length > 0)
      localStorage.setItem("siggy-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    if (sidebarOpen) {
      const handler = (e: MouseEvent) => {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [sidebarOpen]);

  function startNewChat() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setSidebarOpen(false);
  }

  function loadSession(session: ChatSession) {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setSidebarOpen(false);
  }

  function saveSession(sessionId: string, updatedMessages: Message[], firstUserMessage: string) {
    setSessions((prev) => {
      const existing = prev.find((s) => s.id === sessionId);
      if (existing) {
        return prev.map((s) =>
          s.id === sessionId ? { ...s, messages: updatedMessages } : s
        );
      }
      return [
        {
          id: sessionId,
          title: firstUserMessage.slice(0, 40) + (firstUserMessage.length > 40 ? "..." : ""),
          messages: updatedMessages,
          createdAt: Date.now(),
        },
        ...prev,
      ];
    });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const sessionId = currentSessionId ?? crypto.randomUUID();
    if (!currentSessionId) setCurrentSessionId(sessionId);

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = { id: assistantId, role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: fullContent } : m)
        );
      }

      const finalMessages = [
        ...updatedMessages,
        { id: assistantId, role: "assistant" as const, content: fullContent },
      ];
      saveSession(sessionId, finalMessages, trimmed);
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Something went wrong: ${err instanceof Error ? err.message : "Unknown error"}.` }
            : m
        )
      );
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

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-64 md:w-56 flex-shrink-0
          bg-[#13131a] border-r border-white/5
          flex flex-col p-4 gap-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <img src="/siggy-avatar.png" alt="Siggy" className="w-6 h-6 rounded-full object-cover" />
            <span className="font-bold text-base tracking-tight text-[#40FFAF]">Siggy, the Wise</span>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/40 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* New Chat */}
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
            <div
              key={session.id}
              className={`group flex items-center gap-1 rounded-lg transition-all ${
                currentSessionId === session.id
                  ? "bg-[#40FFAF]/10 border border-[#40FFAF]/20"
                  : "hover:bg-white/5"
              }`}
            >
              <button
                onClick={() => loadSession(session)}
                className={`flex-1 text-left text-xs px-3 py-2 truncate transition-all ${
                  currentSessionId === session.id
                    ? "text-[#40FFAF]"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {session.title}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSessions((prev) => prev.filter((s) => s.id !== session.id));
                  if (currentSessionId === session.id) {
                    setCurrentSessionId(null);
                    setMessages([]);
                  }
                }}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 pr-2 text-xs transition-all flex-shrink-0"
                title="Delete chat"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex flex-col flex-1 min-w-0">

        {/* Mobile top bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/60 hover:text-white p-1"
          >
            {/* Hamburger */}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </svg>
          </button>
          <span className="text-sm font-bold text-[#40FFAF]">Siggy, the Wise</span>
          <button
            onClick={startNewChat}
            className="text-[#40FFAF] text-xl font-bold p-1"
          >
            +
          </button>
        </div>

        {/* Ritual logo - desktop only */}
        <div className="hidden md:flex flex-shrink-0 justify-center pt-6 pb-2">
        <img src="/ritual-logo.png" alt="Ritual" className="h-24 opacity-80" />
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 md:px-6 py-4 space-y-4">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-8">
              {/* Ritual logo - mobile */}
              <img src="/ritual-logo.png" alt="Ritual" className="h-6 opacity-60 md:hidden" />

              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#40FFAF]/20 blur-2xl scale-150" />
                <img
                  src="/siggy-main.png"
                  alt="Siggy"
                 className="relative w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-lg"
                />
              </div>
              <div className="text-center px-4">
                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Siggy, <span className="text-[#40FFAF]">the Wise</span>
                </h2>
                <p className="text-xs md:text-sm text-white/40 max-w-xs">
                  Siggy is ready to cast a spell of clarity on your problems.
                </p>
              </div>

              {/* Quick prompts */}
              <div className="flex flex-col gap-2 w-full max-w-sm px-4">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-xs md:text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#40FFAF]/40 px-4 py-2.5 md:py-3 rounded-xl transition-all text-center font-medium"
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
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <img src="/siggy-avatar.png" alt="Siggy" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30" />
              )}
              <div
                className={`max-w-[80%] md:max-w-[75%] rounded-2xl px-3 md:px-4 py-2.5 md:py-3 ${
                  msg.role === "user"
                    ? "bg-[#40FFAF] text-black rounded-br-sm"
                    : "bg-[#1a1a24] border border-white/5 text-white/85 rounded-bl-sm"
                }`}
              >
                <p className="text-xs font-bold mb-1 opacity-60">
                  {msg.role === "user" ? "You" : "Siggy"}
                </p>
                <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <img src="/user-avatar.png" alt="You" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 border border-white/20" />
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-end gap-2 justify-start">
            <img src="/siggy-avatar.png" alt="Siggy" className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover flex-shrink-0 border border-[#40FFAF]/30" />
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
        <div className="flex-shrink-0 px-4 md:px-6 py-3 md:py-4 border-t border-white/5">
          <form onSubmit={handleSubmit}>
            <div className="flex items-center gap-2 md:gap-3 bg-[#1a1a24] border border-white/10 rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus-within:border-[#40FFAF]/40 transition-colors">
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
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

// Starfield component
function Starfield() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: `${Math.random() * 2 + 0.5}px`,
            height: `${Math.random() * 2 + 0.5}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.1,
            animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${-Math.random() * 4}s`,
          }}
        />
      ))}
      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, #40FFAF, transparent)", filter: "blur(60px)" }} />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full opacity-4"
        style={{ background: "radial-gradient(circle, #40FFAF, transparent)", filter: "blur(80px)" }} />
    </div>
  );
}

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
    localStorage.setItem("siggy-sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

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
        body: JSON.stringify({
          message: trimmed,
          history: updatedMessages.slice(0, -1).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
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
    <>
      {/* Global styles injected */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&display=swap');

        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.6); }
        }
        @keyframes msgSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(64,255,175,0.3); }
          50% { box-shadow: 0 0 28px rgba(64,255,175,0.7), 0 0 60px rgba(64,255,175,0.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.08); opacity: 0.25; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.8); opacity: 0.4; }
          40% { transform: translateY(-6px) scale(1.1); opacity: 1; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }

        .msg-animate { animation: msgSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        .avatar-pulse { animation: pulseGlow 2.5s ease-in-out infinite; }

        .chat-scroll::-webkit-scrollbar { width: 3px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(64,255,175,0.2); border-radius: 4px; }
        .chat-scroll { scrollbar-width: thin; scrollbar-color: rgba(64,255,175,0.2) transparent; }

        .siggy-font { font-family: 'Crimson Pro', serif; }
        .ui-font { font-family: 'Cinzel Decorative', serif; }

        .user-bubble {
          background: linear-gradient(135deg, #40FFAF 0%, #2EDEA0 100%);
          box-shadow: 0 4px 20px rgba(64,255,175,0.25), inset 0 1px 0 rgba(255,255,255,0.3);
        }
        .siggy-bubble {
          background: linear-gradient(135deg, rgba(20,22,30,0.95) 0%, rgba(14,16,22,0.98) 100%);
          border: 1px solid rgba(64,255,175,0.12);
          box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(64,255,175,0.06);
        }
        .input-ring:focus-within {
          border-color: rgba(64,255,175,0.5) !important;
          box-shadow: 0 0 0 1px rgba(64,255,175,0.15), 0 0 20px rgba(64,255,175,0.08);
        }
        .send-btn {
          background: linear-gradient(135deg, #40FFAF, #2EDEA0);
          box-shadow: 0 2px 12px rgba(64,255,175,0.35);
          transition: all 0.2s;
        }
        .send-btn:hover:not(:disabled) {
          box-shadow: 0 4px 24px rgba(64,255,175,0.55);
          transform: scale(1.06);
        }
        .session-active {
          background: rgba(64,255,175,0.07);
          border-left: 2px solid #40FFAF;
        }
        .quick-prompt:hover {
          border-color: rgba(64,255,175,0.4);
          background: rgba(64,255,175,0.06);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(64,255,175,0.1);
        }
        .sidebar-bg {
          background: rgba(10,11,16,0.97);
          backdrop-filter: blur(20px);
          border-right: 1px solid rgba(64,255,175,0.08);
        }
        .new-chat-btn:hover {
          background: rgba(64,255,175,0.12);
          box-shadow: 0 0 20px rgba(64,255,175,0.15);
        }
        .scanline-overlay {
          pointer-events: none;
          position: fixed;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          z-index: 1;
        }
      `}</style>

      <div
        className="flex h-screen overflow-hidden ui-font"
        style={{ background: "#080a0f", color: "#e8f5f0" }}
      >
        <Starfield />
        <div className="scanline-overlay" />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 md:hidden"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── SIDEBAR ── */}
        <aside
          id="sidebar"
          className={`
            fixed md:static inset-y-0 left-0 z-30
            w-64 md:w-56 flex-shrink-0 sidebar-bg
            flex flex-col p-4 gap-4
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          {/* Logo */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-md opacity-60"
                  style={{ background: "#40FFAF" }} />
                <img
                  src="/siggy-avatar.png"
                  alt="Siggy"
                  className="relative w-7 h-7 rounded-full object-cover"
                  style={{ border: "1px solid rgba(64,255,175,0.4)" }}
                />
              </div>
              <span className="font-bold text-base tracking-wide" style={{ color: "#40FFAF", fontFamily: "'Cinzel Decorative', serif", fontSize: "13px" }}>
                Siggy, the Wise
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              ✕
            </button>
          </div>

          {/* New Chat */}
          <button
            onClick={startNewChat}
            className="new-chat-btn flex items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all font-semibold"
            style={{
              background: "rgba(64,255,175,0.07)",
              border: "1px solid rgba(64,255,175,0.25)",
              color: "#40FFAF",
              letterSpacing: "0.05em",
              fontFamily: "'Cinzel Decorative', serif",
              fontSize: "12px",
            }}
          >
            <span className="text-base leading-none">+</span>
            New Chat
          </button>

          {/* Divider */}
          <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(64,255,175,0.15), transparent)" }} />

          {/* Chat History */}
          <div className="flex flex-col gap-0.5 flex-1 overflow-y-auto chat-scroll">
            <p className="text-xs font-semibold mb-2 px-1 tracking-widest uppercase"
              style={{ color: "rgba(64,255,175,0.3)", fontSize: "10px", fontFamily: "'Cinzel Decorative', serif" }}>
              Recent
            </p>
            {sessions.length === 0 && (
              <p className="text-xs italic px-2" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Instrument Serif', serif" }}>
                No chats yet...
              </p>
            )}
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center rounded-lg transition-all overflow-hidden ${
                  currentSessionId === session.id ? "session-active" : ""
                }`}
              >
                <button
                  onClick={() => loadSession(session)}
                  className="flex-1 text-left text-sm px-3 py-2 truncate transition-colors"
                  style={{
                    color: currentSessionId === session.id
                      ? "#40FFAF"
                      : "rgba(255,255,255,0.55)",
                    paddingLeft: currentSessionId === session.id ? "10px" : "12px",
                    fontFamily: "'Crimson Pro', serif",
                    fontSize: "14px",
                  }}
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
                  className="opacity-0 group-hover:opacity-100 pr-2 text-xs transition-all flex-shrink-0"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center" style={{ fontSize: "10px", color: "rgba(64,255,175,0.2)", letterSpacing: "0.15em", fontFamily: "'Cinzel Decorative', serif" }}>
            RITUAL NETWORK ✦ SIGGY
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="flex flex-col flex-1 min-w-0 relative z-10">

          {/* Mobile top bar */}
          <div
            className="flex md:hidden items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(64,255,175,0.08)" }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="2" y1="5" x2="16" y2="5" />
                <line x1="2" y1="9" x2="16" y2="9" />
                <line x1="2" y1="13" x2="16" y2="13" />
              </svg>
            </button>
            <span className="text-sm font-bold tracking-wide" style={{ color: "#40FFAF" }}>
              Siggy, the Wise
            </span>
            <button
              onClick={startNewChat}
              className="text-lg font-bold p-1"
              style={{ color: "#40FFAF" }}
            >
              +
            </button>
          </div>

          {/* Ritual logo — desktop */}
          <div className="hidden md:flex flex-shrink-0 justify-center pt-7 pb-2">
            <img src="/ritual-logo.png" alt="Ritual" className="h-20 opacity-70"
              style={{ filter: "drop-shadow(0 0 12px rgba(64,255,175,0.2))" }} />
          </div>

          {/* ── MESSAGES ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 md:px-8 py-6 space-y-5">

            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
                <img src="/ritual-logo.png" alt="Ritual" className="h-5 opacity-40 md:hidden" />

                {/* Avatar with layered glow */}
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(64,255,175,0.15) 0%, transparent 70%)",
                      transform: "scale(2)",
                      animation: "breathe 4s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-full blur-2xl"
                    style={{
                      background: "rgba(64,255,175,0.12)",
                      transform: "scale(1.5)",
                    }}
                  />
                  <img
                    src="/siggy-main.png"
                    alt="Siggy"
                    className="relative w-56 h-56 md:w-72 md:h-72 object-contain"
                    style={{ filter: "drop-shadow(0 0 30px rgba(64,255,175,0.2))" }}
                  />
                </div>

                <div className="text-center px-4 space-y-2">
                  <h2 className="font-bold text-xl md:text-2xl tracking-tight">
                    Siggy,{" "}
                    <span
                      className="siggy-font italic"
                      style={{
                        color: "#40FFAF",
                        filter: "drop-shadow(0 0 8px rgba(64,255,175,0.5))",
                      }}
                    >
                      the Wise
                    </span>
                  </h2>
                  <p className="text-xs md:text-sm max-w-xs mx-auto leading-relaxed siggy-font italic"
                    style={{ color: "rgba(255,255,255,0.35)" }}>
                    A cosmic oracle across seventeen dimensions, ready to cast clarity on your questions.
                  </p>
                </div>

                {/* Quick prompts */}
                <div className="grid grid-cols-1 gap-2 w-full max-w-md px-2">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="quick-prompt w-full text-left text-xs md:text-sm px-4 py-3 rounded-xl transition-all"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.6)",
                        animationDelay: `${i * 0.08}s`,
                      }}
                    >
                      <span style={{ color: "rgba(64,255,175,0.5)", marginRight: "8px" }}>✦</span>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`msg-animate flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                style={{ animationDelay: `${i * 0.02}s` }}
              >
                {/* Siggy avatar */}
                {msg.role === "assistant" && (
                  <div className="relative flex-shrink-0">
                    <div
                      className="absolute inset-0 rounded-full blur-sm opacity-50"
                      style={{ background: "#40FFAF", transform: "scale(1.3)" }}
                    />
                    <img
                      src="/siggy-avatar.png"
                      alt="Siggy"
                      className="relative w-8 h-8 rounded-full object-cover"
                      style={{ border: "1px solid rgba(64,255,175,0.35)" }}
                    />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[78%] md:max-w-[70%] px-4 py-3 ${
                    msg.role === "user"
                      ? "user-bubble rounded-2xl rounded-br-sm"
                      : "siggy-bubble rounded-2xl rounded-bl-sm"
                  }`}
                >
                  <p
                    className="text-xs font-semibold mb-1.5 tracking-widest uppercase"
                    style={{
                      color: msg.role === "user"
                        ? "rgba(0,0,0,0.55)"
                        : "rgba(64,255,175,0.7)",
                      fontSize: "11px",
                      letterSpacing: "0.2em",
                      fontFamily: "'Cinzel Decorative', serif",
                      fontWeight: 700,
                    }}
                  >
                    {msg.role === "user" ? "You" : "✦ Siggy"}
                  </p>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap siggy-font"
                    style={{
                      color: msg.role === "user" ? "#000" : "rgba(232,245,240,0.88)",
                      fontSize: "0.9rem",
                    }}
                  >
                    {msg.content}
                  </p>
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <img
                    src="/user-avatar.png"
                    alt="You"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="msg-animate flex items-end gap-3 justify-start">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 rounded-full blur-sm opacity-50"
                    style={{ background: "#40FFAF", transform: "scale(1.3)" }} />
                  <img src="/siggy-avatar.png" alt="Siggy"
                    className="relative w-8 h-8 rounded-full object-cover"
                    style={{ border: "1px solid rgba(64,255,175,0.35)" }} />
                </div>
                <div className="siggy-bubble rounded-2xl rounded-bl-sm px-5 py-4">
                  <p className="font-bold mb-2 tracking-widest"
                    style={{ color: "rgba(64,255,175,0.6)", fontSize: "11px", letterSpacing: "0.2em", fontFamily: "'Cinzel Decorative', serif" }}>
                    ✦ SIGGY
                  </p>
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="block w-1.5 h-1.5 rounded-full"
                        style={{
                          background: "#40FFAF",
                          animation: `dotBounce 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── INPUT ── */}
          <div
            className="flex-shrink-0 px-4 md:px-8 py-4"
            style={{ borderTop: "1px solid rgba(64,255,175,0.07)" }}
          >
            <form onSubmit={handleSubmit}>
              <div
                className="input-ring flex items-center gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{
                  background: "rgba(16,18,24,0.9)",
                  border: "1px solid rgba(64,255,175,0.12)",
                }}
              >
                {/* Siggy indicator dot */}
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: loading ? "rgba(64,255,175,0.4)" : "#40FFAF",
                    boxShadow: loading ? "none" : "0 0 6px rgba(64,255,175,0.8)",
                    animation: loading ? "dotBounce 1s ease-in-out infinite" : "pulseGlow 2s ease-in-out infinite",
                  }}
                />
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
                  className="flex-1 bg-transparent text-sm focus:outline-none siggy-font"
                  style={{
                    color: "rgba(232,245,240,0.9)",
                    fontSize: "0.925rem",
                  }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="send-btn w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-25 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            </form>
            <p className="text-center mt-2" style={{ fontSize: "9px", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
              SIGGY MAY CONSULT DIMENSION 7 BEFORE RESPONDING
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

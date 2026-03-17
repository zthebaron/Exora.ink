"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GREETING =
  "Hi! I'm the Exora.ink AI assistant. I can help with DTF printing, gang sheets, pricing, equipment specs, and more. What can I help you with?";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Auto-prompt after 5 seconds on first visit
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasOpened) {
        setShowPulse(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [hasOpened]);

  const handleOpen = () => {
    setOpen(true);
    setHasOpened(true);
    setShowPulse(false);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.filter((m) => m.content !== GREETING),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            err instanceof Error && err.message.includes("not configured")
              ? "Chat is currently unavailable. Please check back later!"
              : "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:bottom-24 sm:right-6">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Exora.ink AI
                </p>
                <p className="text-xs text-teal-100">DTF Printing Expert</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: "360px", minHeight: "200px" }}>
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <MessageContent content={msg.content} />
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about DTF printing..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                style={{ maxHeight: "80px" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
              Powered by Claude AI
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl sm:bottom-6 sm:right-6"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <MessageCircle className="h-6 w-6" />
            {showPulse && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
              </span>
            )}
          </>
        )}
      </button>

      {/* Tooltip bubble */}
      {showPulse && !open && !hasOpened && (
        <div className="fixed bottom-20 right-4 z-50 sm:bottom-[5.5rem] sm:right-6">
          <div className="rounded-xl bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-lg border border-border">
            Have questions about DTF printing?
            <div className="absolute -bottom-1.5 right-6 h-3 w-3 rotate-45 border-b border-r border-border bg-card" />
          </div>
        </div>
      )}
    </>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown: bold, links, line breaks
  const parts = content.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Check for /route references and make them clickable
        const routeParts = part.split(/(\/\w[\w-/]*)/g);
        return routeParts.map((rp, ri) => {
          if (rp.match(/^\/[a-z][\w-/]*$/)) {
            return (
              <a
                key={`${i}-${ri}`}
                href={rp}
                className="font-medium text-primary underline underline-offset-2"
              >
                {rp}
              </a>
            );
          }
          return <span key={`${i}-${ri}`}>{rp}</span>;
        });
      })}
    </>
  );
}

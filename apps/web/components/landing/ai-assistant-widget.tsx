"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Minimize2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { useLandingInteractions } from "./landing-interactions";

const SUGGESTIONS = [
  "Summarize my inbox",
  "Draft a launch plan",
  "What's in my pipeline?",
  "Schedule follow-ups",
];

const DEMO_REPLIES: Record<string, string> = {
  default:
    "I can help across CRM, Inbox, Content, and Calendar. This is a demo assistant—connect your workspace for live actions.",
  "Summarize my inbox":
    "Demo: 8 threads need replies, 2 invoices detected, 1 meeting request queued for Calendar.",
  "Draft a launch plan":
    "Demo: Week 1 positioning, Week 2 content batch, Week 3 outreach sequence, Week 4 launch day checklist.",
  "What's in my pipeline?":
    "Demo: $142k open pipeline — 3 deals in Negotiation, 2 at risk without follow-up this week.",
  "Schedule follow-ups":
    "Demo: Drafted 4 follow-ups for Acme, Northwind, Harbor, and Lumen with CRM context.",
};

export function AiAssistantWidget() {
  const { assistantMinimized, toggleAssistant, minimizeAssistant, isOverlayOpen } = useLandingInteractions();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    {
      role: "assistant",
      text: "Hi — I'm your Business OS assistant. Ask about pipeline, inbox, content, or launches.",
    },
  ]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (assistantMinimized) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") minimizeAssistant();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assistantMinimized, minimizeAssistant]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: DEMO_REPLIES[trimmed] ?? DEMO_REPLIES.default!,
        },
      ]);
      setTyping(false);
    }, 700);
  }

  return (
    <>
      <AnimatePresence>
        {!assistantMinimized && !isOverlayOpen ? (
          <motion.aside
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="landing-glass-strong fixed bottom-24 right-5 z-[75] flex w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:bottom-28"
            role="complementary"
            aria-label="AI assistant"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                AI Assistant
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={minimizeAssistant}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                  aria-label="Minimize assistant"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={minimizeAssistant}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                  aria-label="Close assistant"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto px-4 py-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-2xl px-3 py-2 text-sm leading-6 ${
                    message.role === "user"
                      ? "ml-8 bg-primary/15 text-foreground"
                      : "mr-4 bg-white/[0.03] text-secondary"
                  }`}
                >
                  {message.text}
                </div>
              ))}
              {typing ? (
                <p className="text-xs text-muted">Assistant is typing…</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-4 py-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-secondary transition hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-white/5 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask anything…"
                className="flex-1 rounded-xl bg-white/[0.03] px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-primary/30"
              />
              <Button type="submit" size="sm" className="px-3">
                <Send className="h-4 w-4" aria-hidden />
              </Button>
            </form>
            <p className="border-t border-white/5 px-4 py-2 text-[10px] text-muted">
              Demo assistant · responses are simulated until you connect a workspace.
            </p>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="landing-assistant-fab fixed bottom-5 right-5 z-[74] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(249,115,22,0.35)]"
        aria-label={assistantMinimized ? "Open AI assistant" : "Toggle AI assistant"}
      >
        <MessageSquare className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Ask AI</span>
      </motion.button>
    </>
  );
}

export function StartFreeLink({
  children,
  className = "",
  href = "/signup",
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const { fireStartFreeConfetti } = useLandingInteractions();
  return (
    <Link href={href} className={className} onClick={() => fireStartFreeConfetti()}>
      {children}
    </Link>
  );
}

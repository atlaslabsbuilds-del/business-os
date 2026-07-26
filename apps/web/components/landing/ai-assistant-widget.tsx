"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minimize2, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@repo/ui/button";
import { KAIROS_WELCOME } from "../../lib/kairos";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { KairosThinkingMessage } from "../kairos/kairos-avatar";
import { deriveKairosChatState } from "../kairos/use-kairos-state";
import { useLandingInteractions } from "./landing-interactions";

const SUGGESTIONS = [
  "Summarize my inbox",
  "Draft a launch plan",
  "What's in my pipeline?",
  "Schedule follow-ups",
];

const DEMO_REPLIES: Record<string, string> = {
  default:
    "I'm Kairos — your AI Business Copilot. This is a demo on the marketing site. Connect your workspace for live CRM, Inbox, and Content actions.",
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
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const [opened, setOpened] = useState(false);

  const kairosState = deriveKairosChatState({
    isStreaming: typing,
    streamingContent: typing ? "…" : "",
    draft: input,
    error: null,
    phase: null,
  });

  useEffect(() => {
    if (assistantMinimized) return;
    setOpened(true);
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
    }, 1400);
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
            className="landing-glass-strong fixed bottom-24 right-5 z-[75] flex w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-[24px] shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:bottom-28"
            role="complementary"
            aria-label="Ask Kairos"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <KairosAvatar size="sm" state={kairosState} interactive aria-label="" />
                <div>
                  <p className="text-sm font-semibold">Kairos</p>
                  <p className="text-[11px] text-muted">AI Business Copilot</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={minimizeAssistant}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                  aria-label="Minimize Kairos"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={minimizeAssistant}
                  className="rounded-lg p-1.5 text-muted transition hover:bg-white/5 hover:text-foreground"
                  aria-label="Close Kairos"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {messages.length === 0 && opened ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-white/5 px-4 py-4 text-center"
              >
                <p className="text-sm font-semibold">{KAIROS_WELCOME.greeting}</p>
                <p className="mt-1 text-xs text-primary">{KAIROS_WELCOME.subtitle}</p>
                <p className="mt-2 text-xs leading-5 text-secondary">{KAIROS_WELCOME.body}</p>
              </motion.div>
            ) : null}

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
              <KairosThinkingMessage state={kairosState} />
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
                placeholder="Ask Kairos anything…"
                className="flex-1 rounded-xl bg-white/[0.03] px-3 py-2 text-sm outline-none ring-1 ring-white/5 focus:ring-primary/30"
              />
              <Button type="submit" size="sm" className="px-3">
                <Send className="h-4 w-4" aria-hidden />
              </Button>
            </form>
            <p className="border-t border-white/5 px-4 py-2 text-[10px] text-muted">
              Demo · simulated responses on the marketing site
            </p>
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleAssistant}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        className="landing-assistant-fab fixed bottom-5 right-5 z-[74] flex items-center gap-2.5 rounded-full bg-primary py-2 pl-2 pr-4 text-sm font-semibold text-white shadow-[0_12px_40px_rgba(249,115,22,0.35)]"
        aria-label={assistantMinimized ? "Ask Kairos" : "Toggle Kairos"}
      >
        <KairosAvatar size="xs" state="idle" aria-label="" />
        <span className="hidden sm:inline">Ask Kairos</span>
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

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_ACTIVITY_EVENTS } from "../../lib/landing-interactions";
import { useLandingInteractions } from "./landing-interactions";

type ActivityEvent = {
  id: string;
  actor: string;
  action: string;
  module: string;
  ago: string;
};

export function LiveActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([...DEMO_ACTIVITY_EVENTS]);
  const [expanded, setExpanded] = useState(false);
  const { isOverlayOpen } = useLandingInteractions();

  useEffect(() => {
    const timer = window.setInterval(() => {
      const template = DEMO_ACTIVITY_EVENTS[Math.floor(Math.random() * DEMO_ACTIVITY_EVENTS.length)]!;
      setEvents((prev) => [
        { ...template, id: `${Date.now()}`, ago: "just now" },
        ...prev.slice(0, 7),
      ]);
    }, 9000);
    return () => window.clearInterval(timer);
  }, []);

  if (isOverlayOpen) return null;

  return (
    <div className="fixed bottom-24 left-4 z-[64] hidden w-[min(280px,calc(100vw-2rem))] lg:block sm:bottom-28">
      <motion.div layout className="landing-glass overflow-hidden rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Live activity
          </span>
          <ChevronUp
            className={`h-4 w-4 text-muted transition ${expanded ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="max-h-64 overflow-y-auto border-t border-white/5"
            >
              {events.map((event) => (
                <li key={event.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                  <p className="text-xs leading-5 text-foreground">
                    <span className="font-semibold">{event.actor}</span> {event.action}
                  </p>
                  <p className="mt-1 flex items-center justify-between text-[10px] text-muted">
                    <span>{event.module}</span>
                    <span>{event.ago}</span>
                  </p>
                </li>
              ))}
            </motion.ul>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 border-t border-white/5 px-4 py-3"
            >
              <Activity className="h-3.5 w-3.5 text-primary" aria-hidden />
              <p className="truncate text-xs text-secondary">
                {events[0]!.actor} {events[0]!.action}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="border-t border-white/5 px-4 py-2 text-[10px] text-muted">Demo feed · simulated activity</p>
      </motion.div>
    </div>
  );
}

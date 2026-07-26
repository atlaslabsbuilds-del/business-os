"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Quote, X } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_TESTIMONIAL_TOASTS } from "../../lib/landing-interactions";
import { useLandingInteractions } from "./landing-interactions";

export function TestimonialToasts() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const { isOverlayOpen, assistantMinimized } = useLandingInteractions();

  useEffect(() => {
    const showTimer = window.setTimeout(() => setVisible(true), 8000);
    let rotateTimer: number | undefined;

    const scheduleNext = () => {
      rotateTimer = window.setInterval(() => {
        setVisible(false);
        window.setTimeout(() => {
          setIndex((value) => (value + 1) % DEMO_TESTIMONIAL_TOASTS.length);
          setVisible(true);
        }, 400);
      }, 14000);
    };

    scheduleNext();

    return () => {
      window.clearTimeout(showTimer);
      if (rotateTimer) window.clearInterval(rotateTimer);
    };
  }, []);

  const toast = DEMO_TESTIMONIAL_TOASTS[index]!;
  const hidden = isOverlayOpen || !assistantMinimized;

  return (
    <div className="pointer-events-none fixed left-4 top-24 z-[65] w-[min(320px,calc(100vw-2rem))] sm:left-6">
      <AnimatePresence mode="wait">
        {visible && !hidden ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -16, y: -8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -12, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="landing-glass pointer-events-auto rounded-2xl border border-white/10 p-4 shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="rounded-md p-1 text-muted transition hover:text-foreground"
                aria-label="Dismiss testimonial"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-6 text-foreground">“{toast.quote}”</p>
            <p className="mt-3 text-xs font-semibold">{toast.name}</p>
            <p className="text-[11px] text-muted">{toast.role}</p>
            <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-primary/80">
              Demo testimonial
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

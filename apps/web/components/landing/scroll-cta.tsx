"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Calculator, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { useLandingInteractions } from "./landing-interactions";
import { JoinWaitlistButton } from "./ai-assistant-widget";

export function ScrollCta() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [600, 900, 1200], [0, 1, 1]);
  const y = useTransform(scrollY, [600, 900], [24, 0]);
  const [dismissed, setDismissed] = useState(false);
  const { openOverlay, isOverlayOpen, assistantMinimized } = useLandingInteractions();

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={{ opacity, y }}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6"
      >
        <div
          className={`landing-glass-strong mx-auto flex max-w-3xl flex-col gap-3 rounded-[24px] border border-primary/20 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:flex-row sm:items-center sm:justify-between ${
            isOverlayOpen || !assistantMinimized ? "pointer-events-none opacity-0" : "pointer-events-auto"
          }`}
        >
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Ready to run the whole business from one OS?
            </p>
            <p className="mt-1 text-xs text-secondary">Early access · Q4 2026 · no card required</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <JoinWaitlistButton>
              <Button size="sm" className="gap-1.5">
                Join the Waitlist
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </JoinWaitlistButton>
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => openOverlay("roi-calculator")}
            >
              <Calculator className="h-3.5 w-3.5" aria-hidden />
              ROI
            </Button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-lg p-1.5 text-muted transition hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

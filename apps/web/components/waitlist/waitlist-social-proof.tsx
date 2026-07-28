"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { WaitlistPublicSignup } from "@repo/database/waitlist";

export function WaitlistSocialProof({
  recent,
  count,
}: {
  recent: WaitlistPublicSignup[];
  count: number;
}) {
  if (count <= 0 && recent.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <p className="flex items-center justify-center gap-2 text-center text-sm font-medium text-foreground">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        Join founders building the future with AI.
      </p>
      {recent.length > 0 ? (
        <div className="mx-auto mt-5 max-w-xl">
          <ul className="space-y-2">
            <AnimatePresence initial={false} mode="popLayout">
              {recent.slice(0, 5).map((signup) => (
                <motion.li
                  key={signup.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="landing-glass rounded-2xl px-4 py-3 text-center text-sm text-secondary"
                >
                  {signup.message}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ) : null}
    </div>
  );
}

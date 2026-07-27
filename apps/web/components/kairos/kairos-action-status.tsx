"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function KairosActionStatus({
  message,
  open,
}: {
  message: string | null;
  open: boolean;
}) {
  return (
    <AnimatePresence>
      {open && message ? (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="bos-glass-strong bos-noise w-full max-w-sm rounded-[22px] p-8 text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Sparkles className="h-5 w-5 animate-pulse" aria-hidden />
            </div>
            <p className="text-sm font-semibold tracking-tight text-white">
              {message}
            </p>
            <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-elevated">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: "8%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.85, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

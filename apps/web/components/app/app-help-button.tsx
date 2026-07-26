"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { HelpCircle, Keyboard, X } from "lucide-react";
import { useState } from "react";
import { KAIROS_TAGLINE } from "../../lib/kairos";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { useAppChrome } from "./app-chrome-provider";

export function AppHelpButton() {
  const [open, setOpen] = useState(false);
  const { openCommand } = useAppChrome();

  return (
    <>
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="bos-glass fixed bottom-5 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full text-primary shadow-elevated"
        aria-label="Help and shortcuts"
      >
        <HelpCircle className="h-5 w-5" aria-hidden />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[115] flex items-end justify-center bg-black/55 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="bos-glass-strong bos-noise w-full max-w-md rounded-[20px] p-6"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Help"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <KairosAvatar size="sm" state="idle" interactive aria-label="" />
                  <div>
                    <p className="text-lg font-semibold">Help & shortcuts</p>
                    <p className="mt-1 text-sm text-secondary">
                      Premium workspace navigation without leaving your flow.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-border/60 p-2 text-muted"
                  aria-label="Close help"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-5 space-y-2 text-sm">
                <li className="flex items-center justify-between rounded-xl bg-elevated/50 px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <Keyboard className="h-4 w-4 text-primary" aria-hidden />
                    Command palette
                  </span>
                  <kbd className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
                </li>
                <li className="flex items-center justify-between rounded-xl bg-elevated/50 px-3 py-2.5">
                  <span className="flex items-center gap-2">
                    <KairosAvatar size="xs" state="idle" aria-label="" />
                    Ask Kairos
                  </span>
                  <Link href="/chat" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
                    Open chat
                  </Link>
                </li>
                <li className="rounded-xl bg-elevated/50 px-3 py-2.5 text-xs text-muted">
                  {KAIROS_TAGLINE}
                </li>
              </ul>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white"
                onClick={() => {
                  setOpen(false);
                  openCommand();
                }}
              >
                Open command palette
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

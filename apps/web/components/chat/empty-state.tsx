"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { KairosState } from "../../lib/kairos";
import { KAIROS_SUGGESTED_PROMPTS } from "../../lib/kairos-chat-prompts";
import { KairosWelcome } from "../kairos/kairos-companion";

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
  kairosState?: KairosState;
};

export function EmptyState({ onSuggestion, kairosState = "idle" }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-6 flex h-24 w-24 items-center justify-center"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
        <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/25 bg-primary/10 shadow-[0_0_40px_rgba(255,122,0,0.18)]">
          <Sparkles className="h-9 w-9 text-primary" />
        </span>
      </motion.div>

      <KairosWelcome state={kairosState} compact />

      <div className="pbos-stagger mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {KAIROS_SUGGESTED_PROMPTS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="bos-glass rounded-2xl px-4 py-3 text-left text-sm text-secondary transition duration-200 hover:border-primary/35 hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

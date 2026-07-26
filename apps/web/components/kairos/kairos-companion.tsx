"use client";

import { motion } from "framer-motion";
import { KAIROS_WELCOME, kairosStateLabel, type KairosState } from "../../lib/kairos";
import { KairosAvatar, KairosThinkingMessage } from "./kairos-avatar";

export function KairosWelcome({
  state = "idle",
  compact = false,
}: {
  state?: KairosState;
  compact?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center"
    >
      <KairosAvatar state={state} size={compact ? "md" : "lg"} interactive />
      <div className="mt-5 space-y-1">
        <p className="text-lg font-semibold tracking-tight text-foreground">{KAIROS_WELCOME.greeting}</p>
        <p className="text-sm font-medium text-primary">{KAIROS_WELCOME.subtitle}</p>
        {!compact ? (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-secondary">{KAIROS_WELCOME.body}</p>
        ) : null}
      </div>
      <KairosThinkingMessage state={state} />
      {kairosStateLabel(state) ? (
        <p className="mt-2 text-xs text-muted">{kairosStateLabel(state)}</p>
      ) : null}
    </motion.div>
  );
}

export function KairosCompanion({
  state = "idle",
  showWelcome = false,
  compact = false,
  className = "",
}: {
  state?: KairosState;
  showWelcome?: boolean;
  compact?: boolean;
  className?: string;
}) {
  if (showWelcome) {
    return (
      <div className={className}>
        <KairosWelcome state={state} compact={compact} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <KairosAvatar state={state} size={compact ? "sm" : "md"} interactive />
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Kairos</p>
        <KairosThinkingMessage state={state} />
        {kairosStateLabel(state) ? (
          <p className="mt-1 text-[11px] text-muted">{kairosStateLabel(state)}</p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { KairosAvatar, KairosThinkingMessage } from "../kairos/kairos-avatar";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-1 py-2">
      <KairosAvatar size="sm" state="thinking" aria-label="Kairos is thinking" />
      <KairosThinkingMessage state="thinking" />
    </div>
  );
}

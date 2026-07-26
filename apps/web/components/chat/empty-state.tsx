"use client";

import type { KairosState } from "../../lib/kairos";
import { KairosWelcome } from "../kairos/kairos-companion";

const suggestions = [
  "Summarize our workspace goals in three bullet points",
  "Draft a professional email to a new client",
  "Explain a complex topic in simple terms",
  "Help me brainstorm product ideas",
];

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
  kairosState?: KairosState;
};

export function EmptyState({ onSuggestion, kairosState = "idle" }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <div className="lg:hidden">
        <KairosWelcome state={kairosState} />
      </div>
      <div className={`pbos-stagger grid w-full max-w-2xl gap-3 sm:grid-cols-2 ${kairosState ? "mt-10" : ""} lg:mt-0`}>
        {suggestions.map((suggestion) => (
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

"use client";

import { IconSparkles } from "@repo/ui/icons";

const suggestions = [
  "Summarize our workspace goals in three bullet points",
  "Draft a professional email to a new client",
  "Explain a complex topic in simple terms",
  "Help me brainstorm product ideas",
];

type EmptyStateProps = {
  onSuggestion: (text: string) => void;
};

export function EmptyState({ onSuggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-elevated shadow-soft">
        <IconSparkles className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        How can I help you today?
      </h2>
      <p className="mt-2 max-w-md text-center text-sm text-secondary">
        Business OS AI is workspace-aware, multi-model, and ready for enterprise workflows.
      </p>
      <div className="pbos-stagger mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-left text-sm text-secondary transition duration-200 hover:border-primary/40 hover:bg-elevated hover:text-foreground"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

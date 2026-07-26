"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import type { WorkspaceAiSuggestion } from "@repo/types";
import {
  dismissKairosSuggestionAction,
  listKairosSuggestionsAction,
} from "../../app/(protected)/actions/platform";

export function KairosSuggestions({
  initialSuggestions = [],
  compact = false,
}: {
  initialSuggestions?: WorkspaceAiSuggestion[];
  compact?: boolean;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (initialSuggestions.length > 0) return;
    startTransition(async () => {
      const result = await listKairosSuggestionsAction();
      if (result.ok) setSuggestions(result.data.suggestions);
    });
  }, [initialSuggestions.length]);

  function dismiss(id: string) {
    startTransition(async () => {
      const result = await dismissKairosSuggestionAction({ suggestionId: id });
      if (result.ok) {
        setSuggestions((prev) => prev.filter((item) => item.id !== id));
      }
    });
  }

  if (suggestions.length === 0 && !pending) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
        <h3 className="text-sm font-semibold">Kairos suggestions</h3>
      </div>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {suggestions.map((suggestion, index) => (
          <motion.article
            key={suggestion.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bos-glass relative rounded-2xl p-4"
          >
            <button
              type="button"
              onClick={() => dismiss(suggestion.id)}
              className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-elevated hover:text-foreground"
              aria-label="Dismiss suggestion"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <p className="pr-8 text-sm font-medium">{suggestion.title}</p>
            <p className="mt-1 text-xs leading-5 text-secondary">{suggestion.body}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted">
                {suggestion.module}
              </span>
              {suggestion.actionUrl ? (
                <Link
                  href={suggestion.actionUrl}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {suggestion.actionLabel ?? "Open"}
                </Link>
              ) : null}
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

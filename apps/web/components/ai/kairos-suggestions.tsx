"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Play, X } from "lucide-react";
import type { WorkspaceAiSuggestion } from "@repo/types";
import {
  dismissKairosSuggestionAction,
  listKairosSuggestionsAction,
} from "../../app/(protected)/actions/platform";
import { getKairosActionById } from "../../lib/kairos-agent";
import { useAppChrome } from "../app/app-chrome-provider";

function actionIdFromSuggestion(suggestion: WorkspaceAiSuggestion): string | null {
  const meta = suggestion.metadata?.actionId;
  if (typeof meta === "string" && meta) return meta;
  const url = suggestion.actionUrl ?? "";
  if (url.startsWith("kairos://")) return url.slice("kairos://".length);
  if (url.startsWith("/inbox")) return "open-inbox";
  if (url.startsWith("/crm/deals") || url === "/deals") return "open-deals";
  if (url.startsWith("/crm")) return "open-crm";
  if (url.startsWith("/customers")) return "open-customers";
  if (url.startsWith("/analytics")) return "today-revenue";
  if (url.startsWith("/calendar")) return "open-calendar";
  if (url.startsWith("/marketing") || url.includes("advora")) return "open-marketing";
  if (url.startsWith("/chat")) return "ask-kairos";
  return null;
}

export function KairosSuggestions({
  initialSuggestions = [],
  compact = false,
}: {
  initialSuggestions?: WorkspaceAiSuggestion[];
  compact?: boolean;
}) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [pending, startTransition] = useTransition();
  const { openCommand, openQuickCreate, startWorkflow, showActionStatus } =
    useAppChrome();

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

  async function runSuggestion(suggestion: WorkspaceAiSuggestion) {
    const actionId = actionIdFromSuggestion(suggestion);
    const action = actionId ? getKairosActionById(actionId) : null;

    if (action?.kind === "create" && action.createEntity) {
      await showActionStatus(action.confirmation, 600);
      openQuickCreate(action.createEntity, action.draft ?? {});
      return;
    }
    if (action?.kind === "workflow" && action.workflowId) {
      await showActionStatus(action.confirmation, 600);
      startWorkflow(action.workflowId);
      return;
    }
    if (action?.kind === "external") {
      openCommand("/advora");
      return;
    }
    if (action?.href) {
      await showActionStatus(action.confirmation, 700);
      window.location.assign(action.href);
      return;
    }
    if (suggestion.actionUrl) {
      window.location.assign(suggestion.actionUrl);
    }
  }

  if (suggestions.length === 0 && !pending) return null;

  return (
    <section className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold">Kairos suggestions</h3>
        </div>
        <button
          type="button"
          onClick={() => openCommand()}
          className="text-xs font-medium text-primary hover:underline"
        >
          ⌘K Actions
        </button>
      </div>
      <div className={`grid gap-3 ${compact ? "" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {suggestions.map((suggestion, index) => {
          const actionId = actionIdFromSuggestion(suggestion);
          return (
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
                <div className="flex items-center gap-2">
                  {actionId ? (
                    <button
                      type="button"
                      onClick={() => void runSuggestion(suggestion)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Play className="h-3 w-3" aria-hidden />
                      {suggestion.actionLabel ?? "Run"}
                    </button>
                  ) : suggestion.actionUrl ? (
                    <Link
                      href={suggestion.actionUrl}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      {suggestion.actionLabel ?? "Open"}
                    </Link>
                  ) : null}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

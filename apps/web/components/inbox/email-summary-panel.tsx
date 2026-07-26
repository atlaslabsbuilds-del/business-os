"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { EmailThreadSummary } from "@repo/types";
import { getEmailThreadSummaryAction } from "../../app/(protected)/actions/inbox";
import { KairosAvatar, KairosThinkingMessage } from "../kairos/kairos-avatar";

function priorityVariant(
  priority: EmailThreadSummary["priority"],
): "default" | "accent" | "warning" | "error" {
  if (priority === "high") return "error";
  if (priority === "medium") return "warning";
  return "default";
}

function priorityLabel(priority: EmailThreadSummary["priority"]): string {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function SummarySkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-elevated" />
      <div className="h-16 rounded-xl bg-elevated/80" />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="h-20 rounded-xl bg-elevated/60" />
        <div className="h-20 rounded-xl bg-elevated/60" />
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      {empty ? (
        <p className="text-sm text-secondary">None detected</p>
      ) : (
        children
      )}
    </div>
  );
}

export function EmailSummaryPanel({
  threadId,
  initialSummary = null,
}: {
  threadId: string;
  initialSummary?: EmailThreadSummary | null;
}) {
  const [summary, setSummary] = useState<EmailThreadSummary | null>(
    initialSummary,
  );
  const [cached, setCached] = useState(Boolean(initialSummary));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [booting, setBooting] = useState(!initialSummary);
  const requestedRef = useRef(false);

  function load(force: boolean) {
    startTransition(async () => {
      setError(null);
      if (!force) setBooting(true);
      try {
        const result = await getEmailThreadSummaryAction({
          threadId,
          force,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setSummary(result.data.summary);
        setCached(result.data.cached);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate summary",
        );
      } finally {
        setBooting(false);
      }
    });
  }

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    // Generate on open when cache is missing; reuse stored summary when present.
    if (!initialSummary) {
      load(false);
    } else {
      setBooting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, [threadId]);

  const loading = booting || (pending && !summary);

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-3">
          <KairosAvatar
            size="sm"
            state={loading ? "thinking" : error ? "error" : summary ? "success" : "idle"}
            aria-label="Kairos"
          />
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-secondary">
              Kairos email summary
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {summary ? (
                <Badge variant={priorityVariant(summary.priority)}>
                  Priority · {priorityLabel(summary.priority)}
                </Badge>
              ) : null}
              {summary ? (
                <Badge variant="default">
                  {cached ? "Cached" : "Fresh"}
                </Badge>
              ) : null}
            </div>
            {loading ? <KairosThinkingMessage state="thinking" /> : null}
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          disabled={loading}
          onClick={() => load(true)}
        >
          Regenerate Summary
        </Button>
      </div>

      {loading ? <SummarySkeleton /> : null}

      {!loading && error ? (
        <div className="space-y-3 rounded-xl border border-error/20 bg-error/5 px-3 py-3">
          <p className="text-sm text-error">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => load(true)}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {!loading && !error && summary ? (
        <div className="space-y-4">
          <Section title="Short summary">
            <p className="text-sm leading-relaxed text-foreground">
              {summary.shortSummary}
            </p>
          </Section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Section
              title="Action items"
              empty={summary.actionItems.length === 0}
            >
              <ul className="space-y-1.5">
                {summary.actionItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-elevated/50 px-2.5 py-1.5 text-sm text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title="Deadlines"
              empty={summary.deadlines.length === 0}
            >
              <ul className="space-y-1.5">
                {summary.deadlines.map((item) => (
                  <li
                    key={`${item.label}-${item.date ?? "na"}`}
                    className="rounded-lg bg-elevated/50 px-2.5 py-1.5 text-sm text-foreground"
                  >
                    <span>{item.label}</span>
                    {item.date ? (
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.date}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>

            <Section
              title="People mentioned"
              empty={summary.peopleMentioned.length === 0}
            >
              <div className="flex flex-wrap gap-1.5">
                {summary.peopleMentioned.map((person) => (
                  <Badge
                    key={`${person.email ?? ""}-${person.name ?? ""}`}
                    variant="default"
                  >
                    {person.name || person.email}
                    {person.name && person.email ? ` · ${person.email}` : ""}
                  </Badge>
                ))}
              </div>
            </Section>

            <Section
              title="Money / invoices"
              empty={summary.moneyMentions.length === 0}
            >
              <ul className="space-y-1.5">
                {summary.moneyMentions.map((item) => (
                  <li
                    key={`${item.text}-${item.amount ?? ""}`}
                    className="rounded-lg bg-elevated/50 px-2.5 py-1.5 text-sm text-foreground"
                  >
                    <span>{item.text}</span>
                    {item.amount ? (
                      <span className="mt-0.5 block text-xs text-accent">
                        {item.amount}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <p className="text-[11px] text-muted">
            Based on {summary.sourceMessageCount} message
            {summary.sourceMessageCount === 1 ? "" : "s"} ·{" "}
            {new Date(summary.generatedAt).toLocaleString()}
          </p>
        </div>
      ) : null}
    </div>
  );
}

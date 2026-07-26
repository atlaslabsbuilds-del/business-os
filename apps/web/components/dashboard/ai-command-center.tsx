import Link from "next/link";
import { ArrowRight, Lightbulb, Sparkles } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { DashboardSnapshot } from "@repo/types";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { EmptyState, SectionShell } from "./section-shell";

export function AiCommandCenter({ snapshot }: { snapshot: DashboardSnapshot }) {
  return (
    <SectionShell
      title="Kairos Command Center"
      description="Workspace-aware insights from CRM, Inbox, and AI memory."
      elevated
      actionHref="/chat"
      actionLabel="Ask Kairos"
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-elevated/40 p-4 sm:flex-row sm:items-center">
          <KairosAvatar size="sm" state="idle" interactive />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Kairos is ready</p>
            <p className="text-xs text-secondary">Your AI Business Copilot across every module.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{snapshot.kpis.aiCredits.toLocaleString()} credits</Badge>
            <Badge variant="default">{snapshot.chat.conversations} conversations</Badge>
            <Badge variant="default">{snapshot.memory.length} memories</Badge>
          </div>
        </div>

        <div className="space-y-2">
          {snapshot.insights.length === 0 ? (
            <EmptyState
              title="No insights yet"
              body="Connect Inbox or CRM activity to generate AI recommendations."
              href="/chat"
              cta="Ask Kairos"
            />
          ) : (
            snapshot.insights.map((insight) => (
              <Link
                key={`${insight.module}-${insight.title}`}
                href={insight.actionUrl}
                className="group flex gap-3 rounded-2xl border border-border bg-surface p-3 transition duration-200 hover:border-primary/40 hover:bg-elevated"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <Lightbulb className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{insight.title}</span>
                    <Badge
                      variant={
                        insight.severity === "warning"
                          ? "warning"
                          : insight.severity === "success"
                            ? "success"
                            : "info"
                      }
                    >
                      {insight.module}
                    </Badge>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-secondary">{insight.body}</span>
                </span>
                <ArrowRight className="mt-2 h-4 w-4 text-muted transition group-hover:text-primary" />
              </Link>
            ))
          )}
        </div>

        {snapshot.memory.length > 0 ? (
          <div className="rounded-2xl border border-border bg-elevated p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <Sparkles className="h-3 w-3 text-primary" aria-hidden />
              Shared AI memory
            </p>
            <ul className="space-y-2">
              {snapshot.memory.slice(0, 3).map((item) => (
                <li key={item.id} className="text-sm text-secondary">
                  {item.summary ?? item.fact}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Link href="/chat">
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Ask Kairos
            </Button>
          </Link>
          <Link href="/inbox">
            <Button size="sm" variant="secondary">
              Summarize inbox
            </Button>
          </Link>
          <Link href="/crm/leads">
            <Button size="sm" variant="ghost">
              Review leads
            </Button>
          </Link>
        </div>
      </div>
    </SectionShell>
  );
}

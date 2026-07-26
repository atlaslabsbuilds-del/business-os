"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  Megaphone,
  MessageCircle,
  PenLine,
  Settings2,
  Users,
  Wallet,
} from "lucide-react";
import type { KairosAgentRun } from "@repo/types";
import { Button } from "@repo/ui/button";
import { runKairosAgentAction } from "../../app/(protected)/actions/platform";
import { KAIROS_AGENTS, type KairosAgentDefinition } from "../../lib/kairos-agents";
import { useAppChrome } from "../app/app-chrome-provider";
import { KairosAvatar } from "../kairos/kairos-avatar";

const ICONS = {
  Briefcase,
  Megaphone,
  PenLine,
  MessageCircle,
  Wallet,
  Settings2,
  BarChart3,
  Users,
} as const;

function AgentIcon({ name }: { name: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Briefcase;
  return <Icon className="h-5 w-5" aria-hidden />;
}

export function KairosAgentsShell({
  initialRuns,
  initialAgentId,
}: {
  initialRuns: KairosAgentRun[];
  initialAgentId?: string;
}) {
  const { pushToast } = useAppChrome();
  const [selectedId, setSelectedId] = useState(
    initialAgentId && KAIROS_AGENTS.some((agent) => agent.id === initialAgentId)
      ? initialAgentId
      : KAIROS_AGENTS[0]!.id,
  );
  const [runs, setRuns] = useState(initialRuns);
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => KAIROS_AGENTS.find((agent) => agent.id === selectedId) ?? KAIROS_AGENTS[0]!,
    [selectedId],
  );
  const agentRuns = runs.filter((run) => run.agentId === selected.id);

  function runAgent(agent: KairosAgentDefinition, nextPrompt: string) {
    if (!nextPrompt.trim()) return;
    startTransition(async () => {
      const result = await runKairosAgentAction({
        agentId: agent.id,
        prompt: nextPrompt,
      });
      if (!result.ok) {
        pushToast({ title: "Agent failed", description: result.error, variant: "error" });
        return;
      }
      setRuns((prev) => [
        {
          id: result.data.runId,
          workspaceId: "",
          agentId: agent.id,
          title: `${agent.name} task`,
          prompt: nextPrompt,
          status: "completed",
          resultSummary: result.data.summary,
          createdBy: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setPrompt("");
      pushToast({
        title: `${agent.name} ready`,
        description: "Opening chat with your brief.",
        variant: "success",
      });
      window.location.assign(result.data.chatHref);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="bos-glass space-y-2 rounded-2xl p-3">
        {KAIROS_AGENTS.map((agent) => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setSelectedId(agent.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
              selected.id === agent.id
                ? "bg-primary/15 text-foreground"
                : "text-secondary hover:bg-elevated/60 hover:text-foreground"
            }`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: `${agent.color}22`, color: agent.color }}
            >
              <AgentIcon name={agent.icon} />
            </span>
            <span>
              <span className="block text-sm font-medium">{agent.name}</span>
              <span className="block text-[11px] text-muted line-clamp-1">
                {agent.description}
              </span>
            </span>
          </button>
        ))}
      </aside>

      <section className="space-y-4">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bos-glass-strong bos-gradient-border relative overflow-hidden rounded-[24px] p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_50%)]" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <KairosAvatar size="md" state="idle" interactive />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Specialized agent
                </p>
                <h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2>
                <p className="mt-2 max-w-xl text-sm text-secondary">{selected.description}</p>
              </div>
            </div>
            <Link
              href={selected.chatHref}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open in chat
            </Link>
          </div>
        </motion.div>

        <div className="bos-glass rounded-2xl p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Suggested prompts
          </p>
          <div className="flex flex-wrap gap-2">
            {selected.suggestedPrompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => runAgent(selected, item)}
                className="rounded-full border border-border/70 bg-elevated/40 px-3 py-1.5 text-xs text-secondary transition hover:border-primary/40 hover:text-foreground"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={`Ask ${selected.name}…`}
              className="h-11 rounded-xl border border-border/70 bg-elevated/50 px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <Button loading={pending} onClick={() => runAgent(selected, prompt)} disabled={!prompt.trim()}>
              Run agent
            </Button>
          </div>
        </div>

        <div className="bos-glass rounded-2xl p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Recent tasks & activity
          </p>
          {agentRuns.length === 0 ? (
            <p className="text-sm text-secondary">No tasks yet for this agent.</p>
          ) : (
            <ul className="space-y-2">
              {agentRuns.map((run) => (
                <li
                  key={run.id}
                  className="rounded-xl border border-border/60 bg-elevated/40 px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{run.title}</p>
                    <span className="text-[10px] uppercase text-muted">{run.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-secondary line-clamp-2">{run.prompt}</p>
                  {run.resultSummary ? (
                    <p className="mt-2 text-xs text-primary">{run.resultSummary}</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-muted">
                    {new Date(run.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

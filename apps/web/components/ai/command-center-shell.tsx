"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Terminal } from "lucide-react";
import { KAIROS_COMMANDS, matchKairosCommands } from "../../lib/kairos-commands";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { useAppChrome } from "../app/app-chrome-provider";

export function CommandCenterShell() {
  const router = useRouter();
  const { openCommand } = useAppChrome();
  const [query, setQuery] = useState("");
  const commands = query.trim() ? matchKairosCommands(query, 8) : KAIROS_COMMANDS;

  return (
    <div className="space-y-5">
      <div className="bos-glass-strong bos-gradient-border relative overflow-hidden rounded-[24px] p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.18),transparent_45%)]" />
        <div className="relative flex flex-wrap items-center gap-4">
          <KairosAvatar size="lg" state="listening" interactive />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              AI Workspace Command Center
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              Tell Kairos what to do next
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-secondary">
              Run workspace commands, jump into agents, or open Spotlight with ⌘K.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <div className="relative min-w-[260px] flex-1">
                <Terminal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try: Summarize todays emails"
                  className="h-12 w-full rounded-2xl border border-border/70 bg-elevated/50 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={openCommand}
                className="inline-flex h-12 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Open Spotlight
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {commands.map((command, index) => (
          <motion.button
            key={command.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={() => router.push(command.href)}
            className="bos-glass group rounded-2xl p-4 text-left transition hover:border-primary/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{command.label}</p>
                <p className="mt-1 text-xs leading-5 text-secondary">
                  {command.description}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.16em] text-muted">
              {command.module}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

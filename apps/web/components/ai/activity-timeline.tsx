"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { WorkspaceActivityEvent } from "@repo/types";
import { listWorkspaceActivityAction } from "../../app/(protected)/actions/platform";

const RANGES = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
] as const;

const MODULES = [
  "all",
  "crm",
  "inbox",
  "content",
  "social",
  "calendar",
  "chat",
  "workspace",
  "assistant",
] as const;

export function ActivityTimeline({
  initialEvents,
}: {
  initialEvents: WorkspaceActivityEvent[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("week");
  const [module, setModule] = useState<(typeof MODULES)[number]>("all");
  const [pending, startTransition] = useTransition();

  const modules = useMemo(() => {
    const fromData = Array.from(new Set(events.map((event) => String(event.module))));
    return Array.from(new Set([...MODULES, ...fromData]));
  }, [events]);

  function reload(nextRange = range, nextModule = module) {
    startTransition(async () => {
      const result = await listWorkspaceActivityAction({
        range: nextRange,
        module: nextModule === "all" ? undefined : nextModule,
      });
      if (result.ok) setEvents(result.data.events);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setRange(item.id);
              reload(item.id, module);
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              range === item.id
                ? "bg-primary text-white"
                : "bos-glass text-secondary hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {modules.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              const next = item as (typeof MODULES)[number];
              setModule(next);
              reload(range, next);
            }}
            className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
              module === item
                ? "border border-primary/40 bg-primary/15 text-foreground"
                : "border border-border/60 text-muted hover:text-secondary"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <ol className="relative space-y-3 border-l border-border/60 pl-5">
        {pending ? (
          <li className="text-sm text-muted">Refreshing timeline…</li>
        ) : null}
        {events.length === 0 ? (
          <li className="bos-glass rounded-2xl p-5 text-sm text-secondary">
            No activity in this range yet. Actions across CRM, Inbox, Content, and AI
            will appear here.
          </li>
        ) : (
          events.map((event, index) => (
            <motion.li
              key={event.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="relative"
            >
              <span className="absolute -left-[27px] top-3 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px_rgba(249,115,22,0.7)]" />
              <div className="bos-glass rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  <span className="text-[11px] text-muted">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
                {event.body ? (
                  <p className="mt-1 text-sm text-secondary">{event.body}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                  <span>{event.module}</span>
                  <span>{event.eventType}</span>
                  {event.actorId ? <span>User · {event.actorId.slice(0, 8)}</span> : null}
                </div>
              </div>
            </motion.li>
          ))
        )}
      </ol>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  Mail,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useTilt } from "./atmosphere";
import { KairosAvatar } from "../kairos/kairos-avatar";

const feeds = [
  { id: "crm", label: "CRM", text: "Acme Corp moved to Negotiation · $42,000" },
  { id: "inbox", label: "Inbox", text: "AI drafted a reply for Northwind follow-up" },
  { id: "lead", label: "Leads", text: "New lead captured from launch landing page" },
  { id: "content", label: "Content", text: "LinkedIn post scheduled for 9:00 AM" },
  { id: "calendar", label: "Calendar", text: "Strategy call synced with Google Calendar" },
  { id: "finance", label: "Finance", text: "Invoice #1842 marked as paid · +$8,400" },
];

export function ProductMockup({ module = "dashboard" }: { module?: string }) {
  const tilt = useTilt(10);
  const [revenue, setRevenue] = useState(128400);
  const [feedIndex, setFeedIndex] = useState(0);
  const [aiLine, setAiLine] = useState("");
  const fullAi = "I summarized 12 unread threads and queued 3 follow-ups.";

  useEffect(() => {
    const revenueTimer = window.setInterval(() => {
      setRevenue((value) => value + Math.floor(Math.random() * 180) + 40);
    }, 1800);
    const feedTimer = window.setInterval(() => {
      setFeedIndex((value) => (value + 1) % feeds.length);
    }, 2200);
    return () => {
      window.clearInterval(revenueTimer);
      window.clearInterval(feedTimer);
    };
  }, []);

  useEffect(() => {
    let i = 0;
    setAiLine("");
    const timer = window.setInterval(() => {
      i += 1;
      setAiLine(fullAi.slice(0, i));
      if (i >= fullAi.length) window.clearInterval(timer);
    }, 28);
    return () => window.clearInterval(timer);
  }, [feedIndex]);

  const active = feeds[feedIndex]!;
  const kairosState =
    aiLine.length === 0 ? "idle" : aiLine.length < fullAi.length ? "speaking" : "success";

  return (
    <motion.div
      className="relative mx-auto w-full max-w-5xl [perspective:1400px]"
      onPointerMove={tilt.onMove}
      onPointerLeave={tilt.onLeave}
      style={tilt.style}
    >
      <motion.div
        animate={{ rotateZ: [-1.2, 1.2, -1.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="landing-glass-strong landing-gradient-border relative overflow-hidden rounded-[28px] p-3 sm:p-4"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.16),transparent_40%)]" />
        <div className="relative grid gap-3 rounded-2xl border border-white/5 bg-[#0d0d12] p-3 sm:grid-cols-[200px_1fr] sm:p-4">
          <aside className="hidden space-y-2 rounded-2xl border border-white/5 bg-white/[0.02] p-3 sm:block">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Workspace
            </p>
            {["Dashboard", "CRM", "Inbox", "Content", "Social", "Calendar", "Finance", "AI Studio"].map(
              (item) => (
                <div
                  key={item}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    item.toLowerCase().includes(module) || (module === "dashboard" && item === "Dashboard")
                      ? "bg-primary/15 text-foreground"
                      : "text-secondary"
                  }`}
                >
                  {item}
                </div>
              ),
            )}
          </aside>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Live command center</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">Northstar Studio</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-secondary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                Syncing
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Metric
                icon={<TrendingUp className="h-4 w-4 text-primary" aria-hidden />}
                label="Revenue"
                value={`$${revenue.toLocaleString()}`}
              />
              <Metric
                icon={<Users className="h-4 w-4 text-primary" aria-hidden />}
                label="Pipeline"
                value="38 deals"
              />
              <Metric
                icon={<Sparkles className="h-4 w-4 text-primary" aria-hidden />}
                label="AI credits"
                value="482 left"
              />
            </div>

            <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium">Growth pulse</p>
                  <p className="text-xs text-success">+18.4%</p>
                </div>
                <div className="flex h-28 items-end gap-1.5">
                  {[40, 55, 38, 72, 64, 88, 70, 96, 78, 90, 84, 100].map((height, index) => (
                    <div
                      key={index}
                      className="landing-chart-bar flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-primary"
                      style={{ height: `${height}%`, animationDelay: `${index * 0.12}s` }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="mb-3 flex items-center gap-2.5 text-sm font-medium">
                    <KairosAvatar size="xs" state={kairosState} aria-label="Kairos" />
                    Kairos
                  </div>
                  <p className="min-h-12 text-sm leading-6 text-secondary">
                    {aiLine}
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-2xl border border-primary/25 bg-primary/10 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Bell className="h-3.5 w-3.5" aria-hidden />
                      {active.label}
                    </div>
                    <p className="text-sm text-foreground">{active.text}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <MiniRow icon={<Mail className="h-3.5 w-3.5" aria-hidden />} label="Inbox" value="Smart reply ready" />
              <MiniRow icon={<CalendarDays className="h-3.5 w-3.5" aria-hidden />} label="Calendar" value="2 meetings today" />
              <MiniRow icon={<Users className="h-3.5 w-3.5" aria-hidden />} label="CRM" value="Lead scored 92" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">{label}</p>
        {icon}
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function MiniRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-xs text-secondary">
      <span className="text-primary">{icon}</span>
      <span className="font-medium text-foreground">{label}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

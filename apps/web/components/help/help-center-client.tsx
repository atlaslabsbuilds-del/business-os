"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, LifeBuoy, PlayCircle, Search } from "lucide-react";

export const HELP_DOCS = [
  {
    category: "Getting Started",
    title: "Launch your workspace",
    body: "Create a workspace, choose a template, invite your team, and generate demo data.",
    href: "/onboarding",
  },
  {
    category: "Tutorials",
    title: "Create your first project",
    body: "Use Projects to plan tasks, Kanban, timelines, owners, and reports.",
    href: "/projects",
  },
  {
    category: "Tutorials",
    title: "Create your first document",
    body: "Build a knowledge base, draft launch docs, and share documents with teammates.",
    href: "/documents",
  },
  {
    category: "Kairos AI",
    title: "Talk to Kairos",
    body: "Ask Kairos to summarize activity, review security, optimize productivity, and find unread notifications.",
    href: "/chat",
  },
  {
    category: "Security",
    title: "Review security dashboard",
    body: "Audit sessions, login history, API keys, rate limits, and MFA-ready workspace settings.",
    href: "/settings/security",
  },
  {
    category: "Videos",
    title: "Public beta product tour",
    body: "Follow the built-in tour to understand modules, Kairos, notifications, PWA, and settings.",
    href: "/onboarding",
  },
  {
    category: "FAQs",
    title: "How billing works",
    body: "Review one-time purchases, credits, early access, and beta pricing.",
    href: "/pricing",
  },
  {
    category: "Release Notes",
    title: "Public beta changelog",
    body: "See what shipped in the latest VanderBase public beta release.",
    href: "/help/changelog",
  },
];

export function HelpCenterClient() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_DOCS;
    return HELP_DOCS.filter((doc) =>
      `${doc.category} ${doc.title} ${doc.body}`.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="space-y-8">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search documentation, tutorials, videos, and FAQs..."
          className="h-12 w-full rounded-2xl border border-border bg-elevated pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((doc) => (
          <Link
            key={`${doc.category}-${doc.title}`}
            href={doc.href}
            className="group rounded-3xl border border-border bg-surface p-5 transition hover:-translate-y-0.5 hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-2xl bg-primary/15 p-2.5 text-primary">
                {doc.category === "Videos" ? (
                  <PlayCircle className="h-5 w-5" aria-hidden />
                ) : doc.category === "Support" ? (
                  <LifeBuoy className="h-5 w-5" aria-hidden />
                ) : (
                  <BookOpen className="h-5 w-5" aria-hidden />
                )}
              </span>
              <span className="text-xs text-primary opacity-0 transition group-hover:opacity-100">
                Open
              </span>
            </div>
            <p className="mt-4 text-xs uppercase tracking-[0.14em] text-muted">
              {doc.category}
            </p>
            <h2 className="mt-2 text-base font-semibold">{doc.title}</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">{doc.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Read more <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

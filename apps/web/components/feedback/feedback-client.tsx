"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bug, Lightbulb, MessageSquare, Sparkles, ThumbsUp } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackStatus,
} from "@repo/types";
import {
  createFeedbackAction,
  updateFeedbackStatusAction,
  voteFeedbackAction,
} from "../../app/(protected)/actions/feedback";
import { EmptyState } from "../ui/empty-state";
import { formatRelative } from "../dashboard/format";
import { cn } from "@repo/ui/utils";

const CATEGORY_ICONS: Record<FeedbackCategory, typeof Lightbulb> = {
  feature_request: Lightbulb,
  bug_report: Bug,
  improvement: Sparkles,
  general: MessageSquare,
};

const STATUS_VARIANT: Record<FeedbackStatus, "default" | "accent" | "success" | "warning"> = {
  submitted: "default",
  in_review: "accent",
  planned: "accent",
  in_progress: "warning",
  completed: "success",
  rejected: "default",
};

export function FeedbackSubmitForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("feature_request");
  const [priority, setPriority] = useState<FeedbackPriority>("normal");
  const [screenshot, setScreenshot] = useState<File | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const response = await createFeedbackAction({
        title,
        description,
        category,
        priority,
        screenshot,
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setTitle("");
      setDescription("");
      setScreenshot(null);
      router.push("/feedback/mine");
      router.refresh();
    });
  }

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>Submit feedback</CardTitle>
        <CardDescription>
          Tell us what to build, fix, or improve. We review every submission.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} className="space-y-4 px-5 pb-5">
        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-muted">Title</span>
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short summary of your feedback"
            className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
              className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {(Object.keys(FEEDBACK_CATEGORY_LABELS) as FeedbackCategory[]).map((key) => (
                <option key={key} value={key}>
                  {FEEDBACK_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs uppercase tracking-wide text-muted">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as FeedbackPriority)}
              className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {(Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]).map((key) => (
                <option key={key} value={key}>
                  {FEEDBACK_PRIORITY_LABELS[key]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-muted">Description</span>
          <textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={6}
            placeholder="What happened, what you expected, or the feature you need…"
            className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-wide text-muted">
            Screenshot <span className="normal-case text-muted">(optional)</span>
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => setScreenshot(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
          />
        </label>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Submitting…" : "Submit feedback"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

export function FeedbackList({
  items,
  canManage = false,
  emptyTitle = "No feedback yet",
  emptyBody = "Submit your first idea, bug report, or improvement.",
}: {
  items: FeedbackItem[];
  canManage?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [category, items, query, status]);

  function updateStatus(feedbackId: string, next: FeedbackStatus) {
    startTransition(async () => {
      await updateFeedbackStatusAction({ feedbackId, status: next });
      router.refresh();
    });
  }

  function toggleVote(feedbackId: string) {
    startTransition(async () => {
      await voteFeedbackAction({ feedbackId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search feedback…"
          className="h-10 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")}
          className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_STATUS_LABELS[key]}
            </option>
          ))}
        </select>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackCategory | "all")}
          className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm"
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {(Object.keys(FEEDBACK_CATEGORY_LABELS) as FeedbackCategory[]).map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={emptyTitle} body={emptyBody} href="/feedback" cta="Submit feedback" />
      ) : (
        <ul className="space-y-3">
          {filtered.map((item) => {
            const Icon = CATEGORY_ICONS[item.category];
            return (
              <li
                key={item.id}
                className="rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/30"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                        <Badge variant={STATUS_VARIANT[item.status]}>
                          {FEEDBACK_STATUS_LABELS[item.status]}
                        </Badge>
                        <Badge variant="default">{FEEDBACK_CATEGORY_LABELS[item.category]}</Badge>
                        <Badge variant={item.priority === "urgent" || item.priority === "high" ? "accent" : "default"}>
                          {FEEDBACK_PRIORITY_LABELS[item.priority]}
                        </Badge>
                      </div>
                      <p className="text-xs leading-5 text-secondary">{item.description}</p>
                      <p className="text-[11px] text-muted">
                        {item.reporterName || item.reporterEmail || "You"} · {formatRelative(item.createdAt)}
                        {item.assigneeName ? ` · Assigned to ${item.assigneeName}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.category === "feature_request" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant={item.hasVoted ? "primary" : "secondary"}
                        disabled={pending}
                        onClick={() => toggleVote(item.id)}
                        className="gap-1.5"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                        {item.voteCount}
                      </Button>
                    ) : null}
                    {canManage ? (
                      <select
                        value={item.status}
                        disabled={pending}
                        onChange={(event) =>
                          updateStatus(item.id, event.target.value as FeedbackStatus)
                        }
                        className="h-8 rounded-lg border border-border bg-elevated px-2 text-xs"
                        aria-label="Update status"
                      >
                        {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((key) => (
                          <option key={key} value={key}>
                            {FEEDBACK_STATUS_LABELS[key]}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function FeedbackStatusCards({
  stats,
}: {
  stats: Record<FeedbackStatus, number>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((status) => (
        <div
          key={status}
          className={cn(
            "rounded-2xl border border-border bg-surface p-4",
            stats[status] > 0 && "border-primary/20",
          )}
        >
          <p className="text-xs text-muted">{FEEDBACK_STATUS_LABELS[status]}</p>
          <p className="mt-2 text-2xl font-semibold">{stats[status]}</p>
        </div>
      ))}
    </div>
  );
}

export function RoadmapBoard({ items }: { items: FeedbackItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const columns: FeedbackStatus[] = ["planned", "in_progress", "completed"];

  function toggleVote(feedbackId: string) {
    startTransition(async () => {
      await voteFeedbackAction({ feedbackId });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((status) => {
        const columnItems = items.filter((item) => item.status === status);
        return (
          <section key={status} className="rounded-2xl border border-border bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{FEEDBACK_STATUS_LABELS[status]}</h2>
              <Badge variant="default">{columnItems.length}</Badge>
            </div>
            {columnItems.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted">Nothing here yet.</p>
            ) : (
              <ul className="space-y-3">
                {columnItems.map((item) => (
                  <li key={item.id} className="rounded-xl border border-border bg-elevated p-3">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 line-clamp-3 text-xs text-secondary">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] text-muted">{formatRelative(item.updatedAt)}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.hasVoted ? "primary" : "secondary"}
                        disabled={pending}
                        onClick={() => toggleVote(item.id)}
                        className="h-7 gap-1.5 px-2 text-xs"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" aria-hidden />
                        {item.voteCount}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

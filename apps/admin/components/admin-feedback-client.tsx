"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_PRIORITY_LABELS,
  FEEDBACK_STATUS_LABELS,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackPriority,
  type FeedbackStatus,
} from "@repo/types";
import { updateAdminFeedbackAction } from "../app/actions/feedback";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminFeedbackClient({
  initialItems,
}: {
  initialItems: FeedbackItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FeedbackStatus | "all">("all");
  const [category, setCategory] = useState<FeedbackCategory | "all">("all");
  const [priority, setPriority] = useState<FeedbackPriority | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (category !== "all" && item.category !== category) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.reporterEmail?.toLowerCase().includes(q) ?? false) ||
        (item.reporterName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [category, items, priority, query, status]);

  function updateItem(
    feedbackId: string,
    patch: { status?: FeedbackStatus; assigneeId?: string | null },
  ) {
    startTransition(async () => {
      const response = await updateAdminFeedbackAction({
        feedbackId,
        status: patch.status ?? items.find((item) => item.id === feedbackId)?.status,
        assigneeId: patch.assigneeId,
      });
      if (response.ok) {
        setItems((current) =>
          current.map((item) => (item.id === feedbackId ? response.data.item : item)),
        );
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 lg:flex-row lg:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, description, reporter…"
          className="h-10 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as FeedbackStatus | "all")}
          className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm"
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
        >
          <option value="all">All categories</option>
          {(Object.keys(FEEDBACK_CATEGORY_LABELS) as FeedbackCategory[]).map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value as FeedbackPriority | "all")}
          className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm"
        >
          <option value="all">All priorities</option>
          {(Object.keys(FEEDBACK_PRIORITY_LABELS) as FeedbackPriority[]).map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_PRIORITY_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted">
              <th className="px-4 py-3 font-medium">Feedback</th>
              <th className="px-4 py-3 font-medium">Votes</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Reporter</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Assign</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                  No feedback matches these filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-secondary">{item.description}</p>
                    <div className="mt-2">
                      <Badge variant="default">{FEEDBACK_CATEGORY_LABELS[item.category]}</Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{item.voteCount}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        item.priority === "urgent" || item.priority === "high"
                          ? "accent"
                          : "default"
                      }
                    >
                      {FEEDBACK_PRIORITY_LABELS[item.priority]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={item.status}
                      disabled={pending}
                      onChange={(event) =>
                        updateItem(item.id, {
                          status: event.target.value as FeedbackStatus,
                        })
                      }
                      className="h-8 rounded-lg border border-border bg-elevated px-2 text-xs"
                    >
                      {(Object.keys(FEEDBACK_STATUS_LABELS) as FeedbackStatus[]).map((key) => (
                        <option key={key} value={key}>
                          {FEEDBACK_STATUS_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-secondary">
                    {item.reporterName || item.reporterEmail || item.createdBy.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-secondary">
                        {item.assigneeName || "Unassigned"}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-xs"
                        disabled={pending}
                        onClick={() =>
                          updateItem(item.id, {
                            assigneeId: item.assigneeId ? null : item.createdBy,
                            status: item.status,
                          })
                        }
                      >
                        {item.assigneeId ? "Clear" : "Assign reporter"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

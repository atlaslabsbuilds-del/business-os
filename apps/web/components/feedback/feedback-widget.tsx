"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bug, Lightbulb, MessageSquare, Star } from "lucide-react";
import { Button } from "@repo/ui/button";
import type { FeedbackCategory, FeedbackPriority } from "@repo/types";
import { createFeedbackAction } from "../../app/(protected)/actions/feedback";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function submit() {
    const text = message.trim();
    if (text.length < 10) {
      setStatus("Add a little more detail before sending.");
      return;
    }
    const priority: FeedbackPriority = rating <= 2 ? "high" : "normal";
    startTransition(async () => {
      const result = await createFeedbackAction({
        title: `${categoryLabel(category)} · ${rating}/5`,
        description: `${text}\n\nStar rating: ${rating}/5`,
        category,
        priority,
      });
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      setStatus("Thanks — feedback submitted.");
      setMessage("");
      setCategory("general");
      setRating(5);
    });
  }

  return (
    <div className="fixed bottom-24 right-4 z-40 lg:bottom-6">
      {open ? (
        <div className="mb-3 w-[min(360px,calc(100vw-2rem))] rounded-3xl border border-border bg-surface/95 p-4 shadow-elevated backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Beta feedback</p>
              <p className="mt-1 text-xs text-secondary">
                Rate the experience, suggest improvements, or report a bug.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>

          <div className="mt-4 flex gap-1" aria-label="Star rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={value <= rating ? "text-primary" : "text-muted"}
                aria-label={`${value} stars`}
              >
                <Star className="h-5 w-5 fill-current" aria-hidden />
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { key: "general", label: "Feedback", icon: MessageSquare },
              { key: "feature_request", label: "Feature", icon: Lightbulb },
              { key: "bug_report", label: "Bug", icon: Bug },
            ].map((item) => {
              const Icon = item.icon;
              const active = category === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key as FeedbackCategory)}
                  className={`rounded-xl border px-2 py-2 text-xs transition ${
                    active
                      ? "border-primary/40 bg-primary-muted text-foreground"
                      : "border-border text-secondary"
                  }`}
                >
                  <Icon className="mx-auto mb-1 h-4 w-4" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="What should we improve before public beta?"
            className="mt-4 w-full rounded-2xl border border-border bg-elevated px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />

          {status ? <p className="mt-2 text-xs text-secondary">{status}</p> : null}

          <div className="mt-4 flex items-center justify-between gap-2">
            <Link href="/feedback" className="text-xs text-primary hover:underline">
              Attach screenshot
            </Link>
            <Button size="sm" disabled={pending} onClick={submit}>
              Send
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="shadow-elevated"
        onClick={() => setOpen((value) => !value)}
      >
        Feedback
      </Button>
    </div>
  );
}

function categoryLabel(category: FeedbackCategory): string {
  switch (category) {
    case "feature_request":
      return "Feature request";
    case "bug_report":
      return "Bug report";
    case "improvement":
      return "Improvement";
    default:
      return "Feedback";
  }
}

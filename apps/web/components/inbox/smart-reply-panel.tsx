"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { InboxAiReplyDraft, SmartReplyStyle } from "@repo/types";
import {
  generateSmartReplyAction,
  listSmartReplyDraftsAction,
  sendSmartReplyAction,
  updateSmartReplyDraftAction,
} from "../../app/(protected)/actions/inbox";

const STYLES: Array<{ id: SmartReplyStyle; label: string; hint: string }> = [
  { id: "professional", label: "Professional", hint: "Polished & clear" },
  { id: "friendly", label: "Friendly", hint: "Warm tone" },
  { id: "concise", label: "Concise", hint: "Short & direct" },
  { id: "detailed", label: "Detailed", hint: "Thorough reply" },
];

function styleBadge(style: string) {
  return style.charAt(0).toUpperCase() + style.slice(1);
}

export function SmartReplyPanel({
  threadId,
  isGmail,
  initialDrafts = [],
}: {
  threadId: string;
  isGmail: boolean;
  initialDrafts?: InboxAiReplyDraft[];
}) {
  const router = useRouter();
  const [style, setStyle] = useState<SmartReplyStyle>("professional");
  const [body, setBody] = useState("");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [history, setHistory] = useState<InboxAiReplyDraft[]>(initialDrafts);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<"idle" | "generating" | "sending" | "saving">(
    "idle",
  );

  useEffect(() => {
    if (initialDrafts.length > 0) return;
    void (async () => {
      const result = await listSmartReplyDraftsAction({ threadId });
      if (result.ok) setHistory(result.data.drafts);
    })();
  }, [threadId, initialDrafts.length]);

  function generate() {
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      setMode("generating");
      try {
        const result = await generateSmartReplyAction({ threadId, style });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setBody(result.data.reply);
        setActiveDraftId(result.data.draft.id);
        setHistory((prev) => [result.data.draft, ...prev]);
        setSuccess(
          result.data.draft.gmailDraftId
            ? "Reply generated and saved as a Gmail draft."
            : "Reply generated and saved to draft history.",
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to generate reply",
        );
      } finally {
        setMode("idle");
      }
    });
  }

  function saveEdits() {
    if (!activeDraftId || !body.trim()) return;
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      setMode("saving");
      try {
        const result = await updateSmartReplyDraftAction({
          draftId: activeDraftId,
          body,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setHistory((prev) =>
          prev.map((item) =>
            item.id === result.data.draft.id ? result.data.draft : item,
          ),
        );
        setSuccess("Draft edits saved.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save draft");
      } finally {
        setMode("idle");
      }
    });
  }

  function send(replyAll = false) {
    if (!body.trim()) {
      setError("Write or generate a reply before sending.");
      return;
    }
    startTransition(async () => {
      setError(null);
      setSuccess(null);
      setMode("sending");
      try {
        // Do not persist edits before send — sendSmartReply compares the
        // textarea body to the stored draft to choose drafts.send vs messages.send.
        const result = await sendSmartReplyAction({
          threadId,
          draftId: activeDraftId,
          body,
          replyAll,
        });
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.data.draft) {
          setHistory((prev) =>
            prev.map((item) =>
              item.id === result.data.draft!.id ? result.data.draft! : item,
            ),
          );
        }
        setSuccess(
          result.data.usedDraftSend
            ? "Sent via Gmail Draft → Send API."
            : "Reply sent via Gmail Send API.",
        );
        setActiveDraftId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      } finally {
        setMode("idle");
      }
    });
  }

  const loading = pending || mode !== "idle";

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-surface p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            AI smart reply
          </p>
          <p className="text-sm text-muted">
            Generate a reply, edit it, then send. Gmail draft is created first.
          </p>
        </div>
        {!isGmail ? (
          <Badge variant="warning">Gmail required to send</Badge>
        ) : (
          <Badge variant="accent">Gmail Draft → Send</Badge>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {STYLES.map((item) => {
          const active = style === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={loading}
              onClick={() => setStyle(item.id)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                active
                  ? "border-primary/40 bg-primary-muted text-foreground"
                  : "border-border bg-elevated/40 text-secondary hover:text-foreground"
              }`}
            >
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-[11px] text-muted">{item.hint}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          loading={mode === "generating"}
          disabled={loading}
          onClick={generate}
        >
          Generate Reply
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={mode === "saving"}
          disabled={loading || !activeDraftId || !body.trim()}
          onClick={saveEdits}
        >
          Save edits
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={mode === "sending"}
          disabled={loading || !isGmail || !body.trim()}
          onClick={() => send(false)}
        >
          Send reply
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          loading={mode === "sending"}
          disabled={loading || !isGmail || !body.trim()}
          onClick={() => send(true)}
        >
          Reply all
        </Button>
      </div>

      {mode === "generating" ? (
        <div className="space-y-2 animate-pulse rounded-xl border border-border/60 bg-elevated/40 p-3">
          <div className="h-3 w-32 rounded bg-elevated" />
          <div className="h-24 rounded-lg bg-elevated/80" />
          <p className="text-xs text-muted">Writing {style} reply…</p>
        </div>
      ) : (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Reply body
          </span>
          <textarea
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              setSuccess(null);
            }}
            rows={8}
            placeholder="Generate a reply or write your own…"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-primary/40 placeholder:text-muted focus:ring-2"
            disabled={loading && mode === "sending"}
          />
        </label>
      )}

      {error ? (
        <div className="rounded-xl border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-success/20 bg-success/5 px-3 py-2 text-sm text-success">
          {success}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Draft history
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-muted">No generated drafts yet</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {history.map((draft) => (
              <li key={draft.id}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setActiveDraftId(draft.id);
                    setBody(draft.body);
                    setStyle(draft.style);
                    setSuccess(null);
                    setError(null);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                    activeDraftId === draft.id
                      ? "border-primary/40 bg-primary-muted"
                      : "border-border/70 bg-elevated/40 hover:border-border"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge variant="default">{styleBadge(draft.style)}</Badge>
                    <Badge
                      variant={
                        draft.status === "sent"
                          ? "success"
                          : draft.status === "discarded"
                            ? "warning"
                            : "accent"
                      }
                    >
                      {draft.status}
                    </Badge>
                    <span className="text-[11px] text-muted">
                      {new Date(draft.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-xs text-secondary">
                    {draft.body}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

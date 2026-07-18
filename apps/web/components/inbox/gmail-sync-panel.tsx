"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import {
  getGmailSyncProgressAction,
  syncGmailAccountAction,
} from "../../app/(protected)/actions/gmail";

type SyncProgress = {
  jobId: string;
  status: string;
  phase: string;
  mode: string;
  threadsProcessed: number;
  threadsTotal: number;
  messagesUpserted: number;
  labelsUpserted: number;
  attachmentsUpserted: number;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
  linkedContacts: number;
  errors: Array<{ message: string; retries: number; at: string }>;
  currentThreadSubject?: string | null;
  historyId?: string | null;
  updatedAt: string;
  completedAt?: string | null;
};

const PHASE_LABELS: Record<string, string> = {
  starting: "Starting",
  labels: "Syncing labels",
  inbox: "Scanning inbox",
  sent: "Scanning sent",
  drafts: "Scanning drafts",
  trash: "Scanning trash",
  spam: "Scanning spam",
  history: "Reading Gmail history",
  threads: "Syncing threads",
  ai: "AI enrichment",
  finalizing: "Finalizing",
  done: "Complete",
};

function phaseLabel(phase: string): string {
  return PHASE_LABELS[phase] ?? phase;
}

function progressPercent(progress: SyncProgress | null): number {
  if (!progress) return 0;
  if (progress.status === "completed" || progress.status === "error") return 100;
  if (progress.threadsTotal <= 0) {
    return progress.phase === "starting" ? 4 : 12;
  }
  const ratio = progress.threadsProcessed / progress.threadsTotal;
  return Math.min(98, Math.round(ratio * 100));
}

export function GmailSyncPanel({
  accountId,
  full = false,
  initialProgress = null,
}: {
  accountId: string;
  full?: boolean;
  initialProgress?: SyncProgress | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(initialProgress);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const pollProgress = useCallback(async () => {
    const result = await getGmailSyncProgressAction({ accountId });
    if (!result.ok) {
      setError(result.error);
      stopPolling();
      return;
    }
    const next = result.data.progress;
    setProgress(next);
    if (
      next &&
      (next.status === "completed" || next.status === "error" || next.status === "idle")
    ) {
      stopPolling();
      router.refresh();
    }
  }, [accountId, router, stopPolling]);

  useEffect(() => {
    if (initialProgress?.status === "running") {
      setPolling(true);
    }
  }, [initialProgress]);

  useEffect(() => {
    if (!polling) return;
    void pollProgress();
    pollRef.current = setInterval(() => {
      void pollProgress();
    }, 1500);
    return () => stopPolling();
  }, [polling, pollProgress, stopPolling]);

  const startSync = (background: boolean) => {
    startTransition(async () => {
      setError(null);
      const result = await syncGmailAccountAction({
        accountId,
        full,
        background,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if ("background" in result.data && result.data.background) {
        setPolling(true);
        setProgress({
          jobId: result.data.jobId,
          status: "running",
          phase: "starting",
          mode: full ? "full" : "incremental",
          threadsProcessed: 0,
          threadsTotal: 0,
          messagesUpserted: 0,
          labelsUpserted: 0,
          attachmentsUpserted: 0,
          summariesGenerated: 0,
          tasksCreated: 0,
          meetingsScheduled: 0,
          linkedContacts: 0,
          errors: [],
          updatedAt: new Date().toISOString(),
        });
        return;
      }
      if ("progress" in result.data) {
        setProgress(result.data.progress as SyncProgress);
      }
      router.refresh();
    });
  };

  const percent = progressPercent(progress);
  const isRunning = progress?.status === "running" || pending || polling;

  return (
    <div className="w-full min-w-[280px] space-y-3 rounded-2xl border border-border/80 bg-gradient-to-b from-surface/90 to-elevated/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-secondary">
            Gmail sync engine
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={full ? "default" : "accent"}>
              {full ? "Full" : "Incremental"}
            </Badge>
            {progress ? (
              <Badge
                variant={
                  progress.status === "error"
                    ? "default"
                    : progress.status === "completed"
                      ? "accent"
                      : "default"
                }
              >
                {progress.status}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={pending && !polling}
            disabled={isRunning}
            onClick={() => startSync(true)}
          >
            {isRunning ? "Syncing…" : full ? "Full sync" : "Sync"}
          </Button>
          {progress?.status === "error" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => startSync(true)}
            >
              Retry
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-secondary">
          <span>{progress ? phaseLabel(progress.phase) : "Ready"}</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-background/80 ring-1 ring-border/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent/80 via-accent to-accent/70 transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        {progress?.currentThreadSubject ? (
          <p className="truncate text-xs text-muted">
            {progress.currentThreadSubject}
          </p>
        ) : null}
      </div>

      {progress ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-4">
          <div>
            <dt className="text-muted">Threads</dt>
            <dd className="font-medium text-foreground">
              {progress.threadsProcessed}
              {progress.threadsTotal > 0 ? ` / ${progress.threadsTotal}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Messages</dt>
            <dd className="font-medium text-foreground">
              {progress.messagesUpserted}
            </dd>
          </div>
          <div>
            <dt className="text-muted">AI summaries</dt>
            <dd className="font-medium text-foreground">
              {progress.summariesGenerated}
            </dd>
          </div>
          <div>
            <dt className="text-muted">CRM links</dt>
            <dd className="font-medium text-foreground">
              {progress.linkedContacts}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Tasks</dt>
            <dd className="font-medium text-foreground">
              {progress.tasksCreated}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Meetings</dt>
            <dd className="font-medium text-foreground">
              {progress.meetingsScheduled}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Labels</dt>
            <dd className="font-medium text-foreground">
              {progress.labelsUpserted}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Attachments</dt>
            <dd className="font-medium text-foreground">
              {progress.attachmentsUpserted}
            </dd>
          </div>
        </dl>
      ) : null}

      {progress?.errors && progress.errors.length > 0 ? (
        <div className="rounded-xl border border-error/20 bg-error/5 p-3">
          <p className="mb-1 text-xs font-medium text-error">
            {progress.errors.length} thread error(s)
          </p>
          <ul className="max-h-24 space-y-1 overflow-y-auto text-xs text-secondary">
            {progress.errors.slice(-5).map((item, index) => (
              <li key={`${item.at}-${index}`}>
                {item.message}
                {item.retries ? ` · ${item.retries} retries` : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}

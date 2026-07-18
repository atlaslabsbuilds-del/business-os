"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  archiveInboxThreadAction,
  assignInboxLabelAction,
  completeInboxTaskAction,
  connectInboxAccountAction,
  createInboxLabelAction,
  createInboxTaskAction,
  detectInboxMeetingAction,
  disconnectInboxAccountAction,
  replyInboxThreadAction,
  scheduleInboxMeetingAction,
  seedDemoInboxAction,
  smartReplyInboxThreadAction,
  summarizeInboxThreadAction,
} from "../../app/(protected)/actions/inbox";
import {
  archiveGmailAction,
  classifyGmailThreadAction,
  createLeadFromGmailAction,
  deleteGmailAction,
  replyGmailAction,
  setGmailReadStateAction,
  starGmailAction,
  startGmailOAuthAction,
} from "../../app/(protected)/actions/gmail";
import { GmailSyncPanel } from "./gmail-sync-panel";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <Label>{label}</Label>
      {children}
    </label>
  );
}

export function SeedDemoInboxButton({
  provider = "gmail",
}: {
  provider?: "gmail" | "outlook";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        onClick={() => {
          startTransition(async () => {
            setError(null);
            const result = await seedDemoInboxAction({ provider });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
      >
        Seed {provider} demo
      </Button>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function ConnectGmailOAuthButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        loading={pending}
        disabled={pending}
        onClick={() => {
          // Do not use startTransition here: a full-page Google redirect while a
          // Server Action transition is still settling causes
          // "An unexpected response was received from the server" on return.
          void (async () => {
            setPending(true);
            setError(null);
            try {
              const result = await startGmailOAuthAction({});
              if (!result.ok) {
                setError(result.error);
                setPending(false);
                return;
              }
              setRedirectUri(result.data.redirectUri);
              console.info(
                "[gmail.oauth] browser redirect — Google Cloud must allow:",
                result.data.redirectUri,
              );
              window.location.assign(result.data.authUrl);
            } catch (err) {
              console.error("[gmail.oauth] start failed", err);
              setError(
                err instanceof Error
                  ? err.message
                  : "Failed to start Gmail OAuth",
              );
              setPending(false);
            }
          })();
        }}
      >
        Connect Gmail with Google
      </Button>
      {redirectUri ? (
        <p className="text-xs text-secondary">
          redirect_uri sent to Google:{" "}
          <code className="text-foreground">{redirectUri}</code>
        </p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function SyncGmailButton({
  accountId,
  full = false,
}: {
  accountId: string;
  full?: boolean;
}) {
  return <GmailSyncPanel accountId={accountId} full={full} />;
}

export function ConnectInboxAccountForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface/60 p-4">
        <p className="mb-3 text-sm text-secondary">
          Production Gmail: Google OAuth, secure token storage, refresh, and
          incremental sync.
        </p>
        <ConnectGmailOAuthButton />
      </div>

      <form
        className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          startTransition(async () => {
            setError(null);
            setAuthUrl(null);
            const result = await connectInboxAccountAction({
              provider: String(form.get("provider") ?? "outlook") as
                | "gmail"
                | "outlook",
              email: String(form.get("email") ?? ""),
              displayName: String(form.get("displayName") ?? "") || null,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (result.data.authUrl) setAuthUrl(result.data.authUrl);
            event.currentTarget.reset();
            router.refresh();
          });
        }}
      >
        <Field label="Provider">
          <select
            name="provider"
            className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground"
            defaultValue="outlook"
          >
            <option value="outlook">Outlook</option>
            <option value="gmail">Gmail (manual / demo)</option>
          </select>
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required placeholder="you@company.com" />
        </Field>
        <Field label="Display name">
          <Input name="displayName" placeholder="Workspace inbox" />
        </Field>
        {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        {authUrl ? (
          <p className="text-sm text-secondary sm:col-span-2">
            Account created.{" "}
            <a className="text-accent underline" href={authUrl}>
              Continue OAuth
            </a>
          </p>
        ) : null}
        <div className="sm:col-span-2">
          <Button type="submit" loading={pending} variant="secondary">
            Connect without Google OAuth
          </Button>
        </div>
      </form>
    </div>
  );
}

export function DisconnectAccountButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await disconnectInboxAccountAction({ id });
          router.refresh();
        });
      }}
    >
      Disconnect
    </Button>
  );
}

export function CreateInboxLabelForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createInboxLabelAction({
            name: String(form.get("name") ?? ""),
            color: String(form.get("color") ?? "") || undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Name">
        <Input name="name" required placeholder="VIP" />
      </Field>
      <Field label="Color">
        <Input name="color" placeholder="#dc2626" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" loading={pending}>
          Create label
        </Button>
      </div>
      {error ? <p className="text-sm text-error sm:col-span-3">{error}</p> : null}
    </form>
  );
}

export function ThreadAiActions({
  threadId,
  labels,
  isGmail = false,
}: {
  threadId: string;
  labels: Array<{ id: string; name: string; color: string }>;
  isGmail?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [smartReply, setSmartReply] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; error?: string; data?: unknown }>) {
    startTransition(async () => {
      setError(null);
      setNotice(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "Action failed");
        return;
      }
      if (
        result.data &&
        typeof result.data === "object" &&
        "reply" in result.data &&
        typeof (result.data as { reply: unknown }).reply === "string"
      ) {
        setSmartReply((result.data as { reply: string }).reply);
      }
      if (
        result.data &&
        typeof result.data === "object" &&
        "detected" in result.data
      ) {
        const meeting = result.data as {
          detected: boolean;
          suggestedTitle?: string;
        };
        setNotice(
          meeting.detected
            ? `Meeting detected${meeting.suggestedTitle ? `: ${meeting.suggestedTitle}` : ""}`
            : "No meeting intent detected",
        );
      }
      if (
        result.data &&
        typeof result.data === "object" &&
        "priority" in result.data
      ) {
        const classified = result.data as {
          priority: string;
          classification: string;
        };
        setNotice(
          `Priority ${classified.priority} · ${classified.classification}`,
        );
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-surface/60 p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          loading={pending}
          onClick={() =>
            run(() => summarizeInboxThreadAction({ threadId, force: true }))
          }
        >
          Regenerate Summary
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() =>
            run(() =>
              smartReplyInboxThreadAction({
                threadId,
                style: "professional",
              }),
            )
          }
        >
          Quick Smart Reply
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() =>
            run(() => classifyGmailThreadAction({ threadId }))
          }
        >
          Classify
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() =>
            run(() =>
              isGmail
                ? replyGmailAction({
                    threadId,
                    body: smartReply || "Thanks — following up shortly.",
                    useSmartReply: !smartReply,
                  })
                : replyInboxThreadAction({
                    threadId,
                    body: smartReply || "Thanks — following up shortly.",
                    useSmartReply: !smartReply,
                  }),
            )
          }
        >
          Send reply
        </Button>
        {isGmail ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() =>
                run(() =>
                  replyGmailAction({
                    threadId,
                    body: smartReply || "Thanks — looping everyone in.",
                    replyAll: true,
                    useSmartReply: !smartReply,
                  }),
                )
              }
            >
              Reply all
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() =>
                run(() => starGmailAction({ threadId, starred: true }))
              }
            >
              Star
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() =>
                run(() => setGmailReadStateAction({ threadId, unread: true }))
              }
            >
              Mark unread
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() => run(() => archiveGmailAction({ threadId }))}
            >
              Archive
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              loading={pending}
              onClick={() => run(() => deleteGmailAction({ threadId }))}
            >
              Delete
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              loading={pending}
              onClick={() => run(() => createLeadFromGmailAction({ threadId }))}
            >
              Create lead
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            loading={pending}
            onClick={() =>
              run(() => archiveInboxThreadAction({ threadId }))
            }
          >
            Archive
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => run(() => detectInboxMeetingAction({ threadId }))}
        >
          Detect meeting
        </Button>
      </div>

      <form
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const body = String(form.get("body") ?? "");
          run(() =>
            isGmail
              ? replyGmailAction({ threadId, body })
              : replyInboxThreadAction({ threadId, body }),
          );
        }}
      >
        <textarea
          name="body"
          value={smartReply}
          onChange={(event) => setSmartReply(event.target.value)}
          rows={4}
          placeholder="Draft a reply…"
          className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground"
        />
        <Button type="submit" size="sm" loading={pending}>
          Reply
        </Button>
      </form>

      <form
        className="grid gap-2 sm:grid-cols-[1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          run(() =>
            createInboxTaskAction({
              threadId,
              title: String(form.get("title") ?? ""),
              description: String(form.get("description") ?? "") || null,
            }),
          );
          event.currentTarget.reset();
        }}
      >
        <Input name="title" required placeholder="Create task from thread" />
        <Button type="submit" size="sm" variant="secondary" loading={pending}>
          Create task
        </Button>
        <input type="hidden" name="description" value="" />
      </form>

      <form
        className="grid gap-2 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const startsAt = String(form.get("startsAt") ?? "");
          const endsAt = String(form.get("endsAt") ?? "");
          run(() =>
            scheduleInboxMeetingAction({
              threadId,
              title: String(form.get("title") ?? ""),
              startsAt: new Date(startsAt).toISOString(),
              endsAt: new Date(endsAt).toISOString(),
              location: String(form.get("location") ?? "") || null,
            }),
          );
          event.currentTarget.reset();
        }}
      >
        <Input name="title" required placeholder="Meeting title" />
        <Input name="location" placeholder="Zoom / office" />
        <Input name="startsAt" type="datetime-local" required />
        <Input name="endsAt" type="datetime-local" required />
        <div className="sm:col-span-2">
          <Button type="submit" size="sm" variant="secondary" loading={pending}>
            Schedule meeting
          </Button>
        </div>
      </form>

      {labels.length > 0 ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            run(() =>
              assignInboxLabelAction({
                threadId,
                labelId: String(form.get("labelId") ?? ""),
              }),
            );
          }}
        >
          <select
            name="labelId"
            className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm"
            defaultValue={labels[0]?.id}
          >
            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="ghost" loading={pending}>
            Apply label
          </Button>
        </form>
      ) : null}

      {notice ? <p className="text-sm text-secondary">{notice}</p> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function CompleteTaskButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          await completeInboxTaskAction({ id });
          router.refresh();
        });
      }}
    >
      Done
    </Button>
  );
}

export function CreateStandaloneTaskForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3 rounded-2xl border border-border bg-surface/60 p-4 sm:grid-cols-[1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const result = await createInboxTaskAction({
            title: String(form.get("title") ?? ""),
            description: String(form.get("description") ?? "") || null,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          event.currentTarget.reset();
          router.refresh();
        });
      }}
    >
      <Field label="Task">
        <Input name="title" required placeholder="Follow up with customer" />
      </Field>
      <div className="flex items-end">
        <Button type="submit" loading={pending}>
          Create task
        </Button>
      </div>
      {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
    </form>
  );
}

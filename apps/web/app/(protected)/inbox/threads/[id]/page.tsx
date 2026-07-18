import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getInboxThreadDetail,
  listInboxAccounts,
  listInboxLabels,
} from "@repo/database/inbox";
import {
  contactDisplayName,
  getContact,
  getCustomerTimeline,
  listContacts,
} from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../../../lib/inbox-ai";
import { ensureGmailAiToolsRegistered } from "../../../../../lib/gmail-ai";
import { resolveActiveWorkspace } from "../../../../../lib/workspace-context";
import { InboxShell } from "../../../../../components/inbox/inbox-shell";
import { ThreadAiActions } from "../../../../../components/inbox/inbox-forms";
import { EmailSummaryPanel } from "../../../../../components/inbox/email-summary-panel";
import { SmartReplyPanel } from "../../../../../components/inbox/smart-reply-panel";
import { listAiReplyDrafts } from "@repo/database/ai-reply-drafts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InboxThreadPage({ params }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureInboxAiToolsRegistered();
  ensureGmailAiToolsRegistered();

  const { id } = await params;
  const workspaceId = context.active.workspace.id;

  const [detail, labels, accounts, replyDrafts] = await Promise.all([
    getInboxThreadDetail({ workspaceId, threadId: id }),
    listInboxLabels({ workspaceId }),
    listInboxAccounts({ workspaceId }),
    listAiReplyDrafts({ workspaceId, threadId: id, limit: 12 }),
  ]);
  if (!detail) notFound();
  const account = accounts.find((item) => item.id === detail.thread.accountId);
  const isGmail = account?.provider === "gmail";

  let contact = detail.thread.contactId
    ? await getContact({ workspaceId, id: detail.thread.contactId })
    : null;

  if (!contact) {
    const emails = detail.thread.participants.map((p) => p.email.toLowerCase());
    const contacts = await listContacts({ workspaceId });
    contact =
      contacts.find(
        (item) => item.email && emails.includes(item.email.toLowerCase()),
      ) ?? null;
  }

  const timeline = contact
    ? await getCustomerTimeline({ workspaceId, contactId: contact.id })
    : [];

  return (
    <InboxShell
      title={detail.thread.subject}
      description={`${detail.messages.length} messages · ${detail.thread.status}`}
      actions={
        <Link
          href="/inbox"
          className="rounded-xl bg-elevated px-3 py-1.5 text-sm text-secondary hover:text-foreground"
        >
          Back to inbox
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thread</CardTitle>
              <CardDescription>
                Participants:{" "}
                {detail.thread.participants
                  .map((p) => p.name || p.email)
                  .join(", ")}
              </CardDescription>
            </CardHeader>
            <div className="mb-3 flex flex-wrap gap-2">
              {detail.labels.map((label) => (
                <Badge key={label.id} variant="default">
                  {label.name}
                </Badge>
              ))}
              {detail.thread.meetingDetected ? (
                <Badge variant="accent">
                  Meeting · {Math.round(detail.thread.meetingConfidence * 100)}%
                </Badge>
              ) : null}
              {detail.thread.aiPriority ? (
                <Badge variant="accent">{detail.thread.aiPriority}</Badge>
              ) : null}
              {detail.thread.aiClassification ? (
                <Badge variant="default">{detail.thread.aiClassification}</Badge>
              ) : null}
            </div>
            {detail.thread.aiSuggestedActions.length > 0 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {detail.thread.aiSuggestedActions.map((action) => (
                  <Badge key={`${action.type}-${action.label}`} variant="default">
                    {action.label}
                  </Badge>
                ))}
              </div>
            ) : null}
            <div className="mb-4">
              <EmailSummaryPanel
                threadId={detail.thread.id}
                initialSummary={detail.thread.aiSummaryStructured}
              />
            </div>
            <ul className="space-y-3">
              {detail.messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-xl border border-border/70 bg-elevated/40 px-3 py-3"
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                    <span>
                      {message.fromName || message.fromEmail} ·{" "}
                      {message.direction}
                    </span>
                    <span>{new Date(message.sentAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">
                    {message.bodyText}
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          {detail.attachments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Files linked to this conversation
                </CardDescription>
              </CardHeader>
              <ul className="space-y-2">
                {detail.attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                  >
                    <span className="truncate text-foreground">
                      {file.filename}
                    </span>
                    <span className="text-xs text-muted">
                      {file.mimeType} · {Math.round(file.sizeBytes / 1024)} KB
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <SmartReplyPanel
            threadId={detail.thread.id}
            isGmail={isGmail}
            initialDrafts={replyDrafts}
          />

          <ThreadAiActions
            threadId={detail.thread.id}
            labels={labels}
            isGmail={isGmail}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CRM context</CardTitle>
              <CardDescription>
                Customer signal from Actora CRM
              </CardDescription>
            </CardHeader>
            {contact ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-foreground">
                  {contactDisplayName(contact)}
                </p>
                <p className="text-secondary">{contact.email ?? "No email"}</p>
                <Badge variant="default">{contact.lifecycleStage}</Badge>
                <ul className="mt-3 space-y-2">
                  {timeline.slice(0, 8).map((entry) => {
                    const title =
                      entry.kind === "activity"
                        ? entry.item.subject
                        : entry.kind === "note"
                          ? entry.item.body.slice(0, 80)
                          : entry.item.title;
                    return (
                      <li
                        key={`${entry.kind}-${entry.item.id}`}
                        className="rounded-xl bg-elevated/60 px-3 py-2 text-xs text-secondary"
                      >
                        <span className="font-medium text-foreground">
                          {entry.kind}
                        </span>
                        {" · "}
                        {title}
                      </li>
                    );
                  })}
                  {timeline.length === 0 ? (
                    <li className="text-xs text-muted">No timeline events</li>
                  ) : null}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-muted">
                No matching CRM contact for this thread yet.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Created from this thread</CardDescription>
            </CardHeader>
            <ul className="space-y-2">
              {detail.tasks.length === 0 ? (
                <li className="text-sm text-muted">No tasks yet</li>
              ) : (
                detail.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                  >
                    <p className="text-foreground">{task.title}</p>
                    <p className="text-xs text-muted">{task.status}</p>
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meetings</CardTitle>
              <CardDescription>Calendar events linked here</CardDescription>
            </CardHeader>
            <ul className="space-y-2">
              {detail.calendarEvents.length === 0 ? (
                <li className="text-sm text-muted">No meetings scheduled</li>
              ) : (
                detail.calendarEvents.map((event) => (
                  <li
                    key={event.id}
                    className="rounded-xl bg-elevated/60 px-3 py-2 text-sm"
                  >
                    <p className="text-foreground">{event.title}</p>
                    <p className="text-xs text-muted">
                      {new Date(event.startsAt).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </InboxShell>
  );
}

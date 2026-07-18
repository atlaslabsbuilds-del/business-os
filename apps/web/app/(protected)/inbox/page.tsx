import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getInboxDashboardStats,
  listInboxAccounts,
  listInboxThreads,
} from "@repo/database/inbox";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../lib/inbox-ai";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { InboxShell } from "../../../components/inbox/inbox-shell";
import { InboxSearch } from "../../../components/inbox/inbox-search";
import { SeedDemoInboxButton } from "../../../components/inbox/inbox-forms";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    unread?: string;
    accountId?: string;
  }>;
};

export default async function InboxPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const { registered } = ensureInboxAiToolsRegistered();
  const workspaceId = context.active.workspace.id;
  const params = await searchParams;

  const status =
    params.status === "open" ||
    params.status === "archived" ||
    params.status === "trashed" ||
    params.status === "spam"
      ? params.status
      : undefined;

  const [stats, accounts, threads] = await Promise.all([
    getInboxDashboardStats({ workspaceId }),
    listInboxAccounts({ workspaceId }),
    listInboxThreads({
      workspaceId,
      query: params.q,
      status,
      accountId: params.accountId,
      unreadOnly: params.unread === "1",
    }),
  ]);

  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  return (
    <InboxShell
      title="Unified Inbox"
      description="Gmail and Outlook in one workspace-aware surface — AI summary, smart reply, CRM context, and calendar actions."
      actions={<InboxSearch />}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Connected" value={stats.accounts} hint="Mail accounts" />
        <StatCard title="Open" value={stats.openThreads} hint="Active threads" />
        <StatCard title="Unread" value={stats.unread} hint="Needs attention" />
        <StatCard title="Archived" value={stats.archived} hint="Closed loops" />
        <StatCard title="Tasks" value={stats.tasksOpen} hint="From inbox" />
        <StatCard
          title="Meetings"
          value={stats.upcomingMeetings}
          hint="Scheduled ahead"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "All", href: "/inbox" },
          { label: "Unread", href: "/inbox?unread=1" },
          { label: "Open", href: "/inbox?status=open" },
          { label: "Archived", href: "/inbox?status=archived" },
        ].map((filter) => {
          const active =
            (filter.href === "/inbox" &&
              !params.unread &&
              !params.status &&
              !params.accountId) ||
            (filter.href.includes("unread=1") && params.unread === "1") ||
            (filter.href.includes(`status=${status}`) && Boolean(status));
          return (
            <Link
              key={filter.href}
              href={filter.href}
              className={`rounded-xl px-3 py-1.5 text-xs transition ${
                active
                  ? "bg-accent-muted text-foreground"
                  : "bg-elevated text-secondary hover:text-foreground"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
        {accounts.map((account) => (
          <Link
            key={account.id}
            href={`/inbox?accountId=${account.id}`}
            className={`rounded-xl px-3 py-1.5 text-xs transition ${
              params.accountId === account.id
                ? "bg-accent-muted text-foreground"
                : "bg-elevated text-secondary hover:text-foreground"
            }`}
          >
            {account.provider}: {account.email}
          </Link>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <SeedDemoInboxButton provider="gmail" />
          <SeedDemoInboxButton provider="outlook" />
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <ul className="divide-y divide-border/70">
          {threads.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-muted">
              No threads yet. Connect Gmail/Outlook or seed a demo inbox.
            </li>
          ) : (
            threads.map((thread) => {
              const account = accountMap.get(thread.accountId);
              return (
                <li key={thread.id}>
                  <Link
                    href={`/inbox/threads/${thread.id}`}
                    className="flex flex-col gap-2 px-4 py-3 transition hover:bg-elevated/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {thread.isUnread ? (
                          <span className="h-2 w-2 rounded-full bg-accent" />
                        ) : null}
                        <p
                          className={`truncate text-sm ${
                            thread.isUnread
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground"
                          }`}
                        >
                          {thread.subject}
                        </p>
                        {thread.meetingDetected ? (
                          <Badge variant="accent">Meeting</Badge>
                        ) : null}
                        {thread.hasAttachments ? (
                          <Badge variant="default">Attachment</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-secondary">
                        {thread.snippet}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-start gap-1 text-xs text-muted sm:items-end">
                      <span>
                        {account?.provider ?? "inbox"} · {thread.status}
                      </span>
                      <span>
                        {new Date(thread.lastMessageAt).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI tools registered</CardTitle>
          <CardDescription>
            Inbox actions keep these tools available to the AI Tool Registry.
          </CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {(registered.length
            ? registered.filter((name) => name.startsWith("inbox."))
            : [
                "inbox.listThreads",
                "inbox.summarize",
                "inbox.reply",
                "inbox.archive",
                "inbox.createTask",
                "inbox.scheduleMeeting",
                "inbox.smartReply",
                "inbox.detectMeeting",
              ]
          ).map((name) => (
            <Badge key={name} variant="accent">
              {name}
            </Badge>
          ))}
        </div>
      </Card>
    </InboxShell>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{hint}</CardDescription>
      </CardHeader>
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}

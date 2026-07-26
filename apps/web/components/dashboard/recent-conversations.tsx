import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import type { DashboardSnapshot } from "@repo/types";
import { formatRelative } from "./format";
import { EmptyState, SectionShell } from "./section-shell";

export function RecentConversations({
  snapshot,
}: {
  snapshot: DashboardSnapshot;
}) {
  return (
    <SectionShell
      title="Recent Conversations"
      description="Your latest AI Assistant threads."
      actionHref="/chat"
      actionLabel="Open chat"
    >
      {snapshot.conversations.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          body="Start a chat to get workspace-aware help across CRM and Inbox."
          href="/chat"
          cta="Start chatting"
        />
      ) : (
        <ul className="space-y-2">
          {snapshot.conversations.map((conversation) => (
            <li key={conversation.id}>
              <Link
                href={conversation.href}
                className="flex items-center gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5 transition duration-200 hover:border-primary/40"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                  <MessageSquare className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {conversation.title}
                    </span>
                    {conversation.pinned ? (
                      <Badge variant="accent">Pinned</Badge>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs text-muted">
                    {conversation.provider} · {conversation.model} ·{" "}
                    {formatRelative(conversation.updatedAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
}

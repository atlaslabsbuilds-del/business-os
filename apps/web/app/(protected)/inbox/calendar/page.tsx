import Link from "next/link";
import { redirect } from "next/navigation";
import { listInboxCalendarEvents } from "@repo/database/inbox";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../../lib/inbox-ai";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { InboxShell } from "../../../../components/inbox/inbox-shell";

export const dynamic = "force-dynamic";

export default async function InboxCalendarPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureInboxAiToolsRegistered();

  const events = await listInboxCalendarEvents({
    workspaceId: context.active.workspace.id,
  });

  return (
    <InboxShell
      title="Calendar"
      description="Meetings scheduled from inbox threads via inbox.scheduleMeeting and meeting detection."
    >
      <Card>
        <CardHeader>
          <CardTitle>Inbox meetings</CardTitle>
          <CardDescription>
            Linked calendar events across providers
          </CardDescription>
        </CardHeader>
        <ul className="space-y-2">
          {events.length === 0 ? (
            <li className="text-sm text-muted">No meetings scheduled</li>
          ) : (
            events.map((event) => (
              <li
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-elevated/60 px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {event.title}
                  </p>
                  <p className="text-xs text-secondary">
                    {new Date(event.startsAt).toLocaleString()} →{" "}
                    {new Date(event.endsAt).toLocaleString()}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.threadId ? (
                    <Link
                      href={`/inbox/threads/${event.threadId}`}
                      className="text-xs text-accent underline"
                    >
                      View thread
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {event.provider ? (
                    <Badge variant="default">{event.provider}</Badge>
                  ) : null}
                  <Badge variant="accent">{event.status}</Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </InboxShell>
  );
}

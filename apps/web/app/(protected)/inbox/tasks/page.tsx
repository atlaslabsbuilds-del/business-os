import Link from "next/link";
import { redirect } from "next/navigation";
import { listInboxTasks } from "@repo/database/inbox";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../../lib/inbox-ai";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { InboxShell } from "../../../../components/inbox/inbox-shell";
import {
  CompleteTaskButton,
  CreateStandaloneTaskForm,
} from "../../../../components/inbox/inbox-forms";

export const dynamic = "force-dynamic";

export default async function InboxTasksPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureInboxAiToolsRegistered();

  const tasks = await listInboxTasks({
    workspaceId: context.active.workspace.id,
  });

  return (
    <InboxShell
      title="Tasks"
      description="One-click task creation from threads via inbox.createTask."
    >
      <CreateStandaloneTaskForm />
      <Card>
        <CardHeader>
          <CardTitle>Inbox tasks</CardTitle>
          <CardDescription>Open and completed follow-ups</CardDescription>
        </CardHeader>
        <ul className="space-y-2">
          {tasks.length === 0 ? (
            <li className="text-sm text-muted">No tasks yet</li>
          ) : (
            tasks.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-elevated/60 px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {task.title}
                  </p>
                  {task.threadId ? (
                    <Link
                      href={`/inbox/threads/${task.threadId}`}
                      className="text-xs text-accent underline"
                    >
                      View thread
                    </Link>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default">{task.status}</Badge>
                  {task.status === "open" ? (
                    <CompleteTaskButton id={task.id} />
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </Card>
    </InboxShell>
  );
}

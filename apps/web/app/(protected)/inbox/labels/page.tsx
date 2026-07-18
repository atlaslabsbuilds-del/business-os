import { redirect } from "next/navigation";
import { listInboxLabels } from "@repo/database/inbox";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../../lib/inbox-ai";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { InboxShell } from "../../../../components/inbox/inbox-shell";
import { CreateInboxLabelForm } from "../../../../components/inbox/inbox-forms";

export const dynamic = "force-dynamic";

export default async function InboxLabelsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureInboxAiToolsRegistered();

  const labels = await listInboxLabels({
    workspaceId: context.active.workspace.id,
  });

  return (
    <InboxShell
      title="Labels"
      description="Organize threads across Gmail and Outlook with workspace labels."
    >
      <CreateInboxLabelForm />
      <Card>
        <CardHeader>
          <CardTitle>Labels</CardTitle>
          <CardDescription>{labels.length} labels in this workspace</CardDescription>
        </CardHeader>
        <ul className="space-y-2">
          {labels.length === 0 ? (
            <li className="text-sm text-muted">No labels yet</li>
          ) : (
            labels.map((label) => (
              <li
                key={label.id}
                className="flex items-center gap-3 rounded-xl bg-elevated/60 px-3 py-2 text-sm"
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="text-foreground">{label.name}</span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </InboxShell>
  );
}

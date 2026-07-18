import { redirect } from "next/navigation";
import { listActivities } from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import {
  CreateActivityForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CrmActivitiesPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const activities = await listActivities({
    workspaceId: context.active.workspace.id,
    query: params.q,
  });

  return (
    <CrmShell
      title="Activities"
      description="Calls, emails, meetings, and tasks across the workspace."
      actions={<CrmSearch placeholder="Search activities" />}
    >
      <CreateActivityForm />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  No activities yet
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {activity.subject}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{activity.type}</Badge>
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {activity.dueAt
                      ? new Date(activity.dueAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    {activity.completedAt ? "Done" : "Open"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton id={activity.id} kind="activity" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </CrmShell>
  );
}

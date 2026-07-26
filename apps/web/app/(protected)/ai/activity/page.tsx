import { listWorkspaceActivityEvents } from "@repo/database/activity";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ActivityTimeline } from "../../../../components/ai/activity-timeline";

export const dynamic = "force-dynamic";

export default async function AiActivityPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const events = await listWorkspaceActivityEvents({
    workspaceId: context.active.workspace.id,
    since,
    limit: 80,
  }).catch(() => []);

  return <ActivityTimeline initialEvents={events} />;
}

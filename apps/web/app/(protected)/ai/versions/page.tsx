import { listAiOutputVersions } from "@repo/database/kairos-intelligence";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { VersionHistoryPanel } from "../../../../components/ai/version-history-panel";

export const dynamic = "force-dynamic";

export default async function AiVersionsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const versions = await listAiOutputVersions({
    workspaceId: context.active.workspace.id,
    limit: 60,
  }).catch(() => []);

  return <VersionHistoryPanel initialVersions={versions} />;
}

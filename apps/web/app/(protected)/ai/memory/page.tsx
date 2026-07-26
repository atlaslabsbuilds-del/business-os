import {
  getWorkspaceAiSettings,
  listWorkspaceAiMemory,
} from "@repo/database/workspace-memory";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { KairosMemoryPanel } from "../../../../components/ai/kairos-memory-panel";

export const dynamic = "force-dynamic";

export default async function AiMemoryPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const [memory, settings] = await Promise.all([
    listWorkspaceAiMemory({
      workspaceId: context.active.workspace.id,
      limit: 100,
    }).catch(() => []),
    getWorkspaceAiSettings({
      workspaceId: context.active.workspace.id,
    }).catch(() => ({
      workspaceId: context.active.workspace.id,
      memoryEnabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
  ]);

  return (
    <KairosMemoryPanel initialMemory={memory} initialSettings={settings} />
  );
}

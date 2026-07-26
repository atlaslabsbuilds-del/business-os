import { listKairosAgentRuns } from "@repo/database/kairos-intelligence";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { KairosAgentsShell } from "../../../../components/ai/kairos-agents-shell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ agent?: string; prompt?: string }>;
};

export default async function AiAgentsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) return null;
  const params = await searchParams;
  const runs = await listKairosAgentRuns({
    workspaceId: context.active.workspace.id,
    limit: 40,
  }).catch(() => []);

  return (
    <KairosAgentsShell
      initialRuns={runs}
      initialAgentId={params.agent}
    />
  );
}

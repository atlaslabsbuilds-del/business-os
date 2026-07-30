import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { getCrmModuleData } from "../../actions/crm";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmPipelineBoard } from "../../../../components/crm/crm-extra";
import { CrmSearch } from "../../../../components/crm/crm-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pipeline" };

export default async function CrmPipelinePage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();

  return (
    <CrmShell
      title="Pipeline"
      description="Kanban board for lead-to-close deal movement with drag and drop."
      actions={<CrmSearch placeholder="Search deals" />}
    >
      <CrmPipelineBoard
        deals={data.deals}
        stages={data.stages}
        pipelineId={data.pipeline.id}
      />
    </CrmShell>
  );
}

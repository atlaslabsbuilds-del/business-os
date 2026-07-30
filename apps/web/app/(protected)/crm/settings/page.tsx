import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { getCrmModuleData } from "../../actions/crm";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSettingsPanel } from "../../../../components/crm/crm-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CRM Settings" };

export default async function CrmSettingsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();

  return (
    <CrmShell
      title="Settings"
      description="Lead sources, custom fields, pipeline stages, permissions, and automation."
    >
      <CrmSettingsPanel
        settings={data.settings}
        pipelineId={data.pipeline.id}
      />
    </CrmShell>
  );
}

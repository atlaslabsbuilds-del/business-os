import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { getCrmModuleData } from "../../actions/crm";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmReportsPanel } from "../../../../components/crm/crm-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CRM Reports" };

export default async function CrmReportsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();

  return (
    <CrmShell
      title="Reports"
      description="Forecast, conversion, pipeline health, and monthly sales performance."
    >
      <CrmReportsPanel report={data.report} />
    </CrmShell>
  );
}

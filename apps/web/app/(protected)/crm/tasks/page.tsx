import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { getCrmModuleData } from "../../actions/crm";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmTasksPanel } from "../../../../components/crm/crm-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "CRM Tasks" };

export default async function CrmTasksPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();
  const data = await getCrmModuleData();

  return (
    <CrmShell
      title="Tasks"
      description="Prioritized follow-ups with due dates, assignees, and reminders."
    >
      <CrmTasksPanel tasks={data.tasks} />
    </CrmShell>
  );
}

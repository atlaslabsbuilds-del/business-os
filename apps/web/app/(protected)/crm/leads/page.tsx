import { redirect } from "next/navigation";
import { contactDisplayName, listLeads } from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import { EmptyState } from "../../../../components/dashboard/section-shell";
import {
  CreateContactForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";
import { CrmCsvExportButton } from "../../../../components/crm/crm-csv";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CrmLeadsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const leads = await listLeads({
    workspaceId: context.active.workspace.id,
    query: params.q,
  });

  const exportRows = leads.map((lead) => ({
    name: contactDisplayName(lead),
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    source: lead.source ?? "",
    priority: lead.priority,
    stage: lead.lifecycleStage,
  }));

  return (
    <CrmShell
      title="Leads"
      description="Inbound and outbound leads with priority, source, and owner-ready workflows."
      actions={<CrmSearch placeholder="Search leads" />}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CreateContactForm asLead />
        <CrmCsvExportButton filename="crm-leads.csv" rows={exportRows} />
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4">
                  <EmptyState
                    title="No leads yet"
                    body="Capture your first lead with the form above to grow the funnel."
                  />
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {contactDisplayName(lead)}
                  </td>
                  <td className="px-4 py-3 text-secondary">{lead.email ?? "—"}</td>
                  <td className="px-4 py-3 text-secondary">{lead.source ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{lead.priority}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="accent">{lead.lifecycleStage}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton id={lead.id} kind="contact" />
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

import { redirect } from "next/navigation";
import { listCompanies } from "@repo/database/crm";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import {
  CreateCompanyForm,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function CrmCompaniesPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const companies = await listCompanies({
    workspaceId: context.active.workspace.id,
    query: params.q,
  });

  return (
    <CrmShell
      title="Companies"
      description="Accounts and organizations. Search by name or domain."
      actions={<CrmSearch placeholder="Search companies" />}
    >
      <CreateCompanyForm />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Domain</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No companies yet
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {company.name}
                  </td>
                  <td className="px-4 py-3 text-secondary">{company.domain ?? "—"}</td>
                  <td className="px-4 py-3 text-secondary">
                    {company.industry ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton id={company.id} kind="company" />
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

import { redirect } from "next/navigation";
import { listDeals } from "@repo/database/crm";
import { Badge } from "@repo/ui/badge";
import { Card } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { ensureCrmAiToolsRegistered } from "../../../../lib/crm-ai";
import { CrmShell } from "../../../../components/crm/crm-shell";
import { CrmSearch } from "../../../../components/crm/crm-search";
import { EmptyState } from "../../../../components/dashboard/section-shell";
import {
  CreateDealForm,
  DealStageSelect,
  DeleteButton,
} from "../../../../components/crm/crm-forms";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string; stage?: string }> };

export default async function CrmDealsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureCrmAiToolsRegistered();

  const params = await searchParams;
  const stage =
    params.stage === "lead" ||
    params.stage === "qualified" ||
    params.stage === "proposal" ||
    params.stage === "negotiation" ||
    params.stage === "won" ||
    params.stage === "lost"
      ? params.stage
      : undefined;

  const deals = await listDeals({
    workspaceId: context.active.workspace.id,
    query: params.q,
    stage,
  });

  return (
    <CrmShell
      title="Deals"
      description="Pipeline management with stage filters and inline updates."
      actions={<CrmSearch placeholder="Search deals" />}
    >
      <CreateDealForm />

      <div className="flex flex-wrap gap-2">
        {["", "lead", "qualified", "proposal", "negotiation", "won", "lost"].map(
          (value) => {
            const href = value
              ? `/crm/deals?stage=${value}${params.q ? `&q=${params.q}` : ""}`
              : `/crm/deals${params.q ? `?q=${params.q}` : ""}`;
            const active = (stage ?? "") === value;
            return (
              <a
                key={value || "all"}
                href={href}
                className={`rounded-xl px-3 py-1.5 text-xs transition ${
                  active
                    ? "bg-accent-muted text-foreground"
                    : "bg-elevated text-secondary hover:text-foreground"
                }`}
              >
                {value || "All"}
              </a>
            );
          },
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-elevated/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Probability</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <EmptyState
                    title="No deals yet"
                    body="Create your first deal with the form above to track pipeline value."
                  />
                </td>
              </tr>
            ) : (
              deals.map((deal) => (
                <tr key={deal.id} className="border-b border-border/70">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {deal.title}
                  </td>
                  <td className="px-4 py-3 text-secondary">
                    ${deal.amount.toLocaleString()} {deal.currency}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{deal.stage}</Badge>
                      <DealStageSelect id={deal.id} stage={deal.stage} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-secondary">{deal.probability}%</td>
                  <td className="px-4 py-3 text-right">
                    <DeleteButton id={deal.id} kind="deal" />
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

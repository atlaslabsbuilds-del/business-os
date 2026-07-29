import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { FinanceAnalytics } from "../../../../components/finance/finance-client";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finance Analytics" };

export default async function FinanceAnalyticsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return (
    <FinanceShell tab="analytics">
      <FinanceAnalytics stats={data.stats} />
    </FinanceShell>
  );
}

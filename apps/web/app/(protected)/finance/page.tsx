import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../actions/finance";
import { FinanceShell } from "../../../components/finance/finance-shell";
import { FinanceDashboard } from "../../../components/finance/finance-client";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finance" };

export default async function FinancePage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return (
    <FinanceShell tab="overview">
      <FinanceDashboard stats={data.stats} />
    </FinanceShell>
  );
}

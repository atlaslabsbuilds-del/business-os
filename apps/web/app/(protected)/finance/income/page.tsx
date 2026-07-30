import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceIncomePanel } from "../../../../components/finance/finance-extra";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Income" };

export default async function FinanceIncomePage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const { stats } = await getFinanceData();
  return <FinanceShell tab="income"><FinanceIncomePanel stats={stats} /></FinanceShell>;
}

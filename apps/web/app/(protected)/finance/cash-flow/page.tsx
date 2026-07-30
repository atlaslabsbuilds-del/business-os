import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceCashFlowPanel } from "../../../../components/finance/finance-extra";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cash Flow" };

export default async function FinanceCashFlowPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return <FinanceShell tab="cash-flow"><FinanceCashFlowPanel entries={data.cashFlow} series={data.cashFlowSeries} /></FinanceShell>;
}

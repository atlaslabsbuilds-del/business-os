import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceReportsPanel } from "../../../../components/finance/finance-extra";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reports" };

export default async function FinanceReportsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return <FinanceShell tab="reports"><FinanceReportsPanel reports={data.reports} /></FinanceShell>;
}

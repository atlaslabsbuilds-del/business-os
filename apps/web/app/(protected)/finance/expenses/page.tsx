import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { ExpenseManager } from "../../../../components/finance/finance-client";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Expenses" };

export default async function FinanceExpensesPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return (
    <FinanceShell tab="expenses">
      <ExpenseManager expenses={data.expenses} />
    </FinanceShell>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getFinanceData } from "../../actions/finance";
import { FinanceShell } from "../../../../components/finance/finance-shell";
import { FinanceCustomerList } from "../../../../components/finance/finance-client";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Finance Customers" };

export default async function FinanceCustomersPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getFinanceData();
  return (
    <FinanceShell tab="customers">
      <FinanceCustomerList invoices={data.invoices} />
    </FinanceShell>
  );
}

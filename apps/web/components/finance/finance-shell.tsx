import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { ModuleNav } from "../app/module-nav";

export type FinanceTab = "overview" | "invoices" | "expenses" | "transactions" | "customers" | "analytics";

const tabs = [
  ["overview", "Overview"],
  ["invoices", "Invoices"],
  ["expenses", "Expenses"],
  ["transactions", "Transactions"],
  ["customers", "Customers"],
  ["analytics", "Analytics"],
] as const;

export function FinanceShell({
  tab,
  children,
  actions,
}: {
  tab: FinanceTab;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <ModulePageShell
      badge="Finance"
      title="Finance"
      description="Revenue, expenses, invoices, and cash flow from your real workspace data."
      actions={actions}
    >
      <div data-finance-tab={tab}>
        <ModuleNav
          items={tabs.map(([value, label]) => ({
            href: value === "overview" ? "/finance" : `/finance/${value}`,
            label,
            exact: value === "overview",
          }))}
        />
        <div className="mt-6">{children}</div>
      </div>
    </ModulePageShell>
  );
}

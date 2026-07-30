import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { ModuleNav } from "../app/module-nav";

export type FinanceTab =
  | "overview"
  | "transactions"
  | "income"
  | "expenses"
  | "invoices"
  | "customers"
  | "budgets"
  | "cash-flow"
  | "reports"
  | "analytics"
  | "settings";

const tabs = [
  ["overview", "Overview"],
  ["transactions", "Transactions"],
  ["income", "Income"],
  ["expenses", "Expenses"],
  ["invoices", "Invoices"],
  ["customers", "Customers"],
  ["budgets", "Budgets"],
  ["cash-flow", "Cash Flow"],
  ["reports", "Reports"],
  ["analytics", "Analytics"],
  ["settings", "Settings"],
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

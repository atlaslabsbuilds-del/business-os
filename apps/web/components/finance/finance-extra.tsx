"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Button } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import type {
  FinanceBudget,
  FinanceCashFlowEntry,
  FinanceCashFlowPoint,
  FinanceReport,
  FinanceSettings,
} from "@repo/types";
import {
  createBudgetAction,
  createCashFlowAction,
  generateFinanceReportAction,
  updateFinanceSettingsAction,
} from "../../app/(protected)/actions/finance";

const inputClass =
  "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none focus:border-primary/50";
const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

function EmptyPanel({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-secondary">{text}</div>;
}

export function FinanceIncomePanel({ stats }: { stats: { totalRevenue: number; monthly: Array<{ month: string; revenue: number; profit: number }> } }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card elevated>
        <CardHeader><CardTitle>Revenue dashboard</CardTitle><CardDescription>Revenue by month and profit contribution.</CardDescription></CardHeader>
        <div className="space-y-4 px-5 pb-5">
          <p className="text-3xl font-semibold text-accent">{money(stats.totalRevenue)}</p>
          <div className="grid grid-cols-6 items-end gap-2">
            {stats.monthly.map((point) => (
              <div key={point.month} className="min-w-0">
                <div className="flex h-36 items-end rounded-t-lg bg-elevated">
                  <div className="w-full rounded-t-lg bg-primary/80" style={{ height: `${Math.max(5, Math.min(100, point.revenue / Math.max(1, stats.totalRevenue) * 600))}%` }} />
                </div>
                <p className="mt-2 truncate text-center text-[10px] text-muted">{point.month}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
      <Card elevated>
        <CardHeader><CardTitle>AI revenue signal</CardTitle><CardDescription>Deterministic insight from current workspace data.</CardDescription></CardHeader>
        <div className="px-5 pb-5 text-sm leading-6 text-secondary">
          {stats.totalRevenue > 0
            ? "Revenue is being tracked. Keep paid invoices and income transactions categorized to improve forecasting."
            : "Add paid invoices or income transactions to unlock revenue trends and forecasting."}
        </div>
      </Card>
    </div>
  );
}

export function FinanceBudgetManager({ budgets }: { budgets: FinanceBudget[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader><CardTitle>Create monthly budget</CardTitle><CardDescription>Set a limit and detect overspending automatically.</CardDescription></CardHeader>
        <form className="grid gap-3 px-5 pb-5 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createBudgetAction({
              name: String(form.get("name") ?? ""),
              category: String(form.get("category") ?? "") || undefined,
              periodStart: String(form.get("periodStart") ?? ""),
              periodEnd: String(form.get("periodEnd") ?? ""),
              amount: Number(form.get("amount") ?? 0),
            });
            if (!result.ok) setError(result.error);
            else { event.currentTarget.reset(); router.refresh(); }
          });
        }}>
          <input name="name" required placeholder="Operating budget" className={inputClass} />
          <input name="category" placeholder="Category (optional)" className={inputClass} />
          <input name="periodStart" required type="date" className={inputClass} />
          <input name="periodEnd" required type="date" className={inputClass} />
          <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" className={inputClass} />
          <Button loading={pending} type="submit">Create budget</Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>
      {budgets.length === 0 ? <EmptyPanel text="No budgets yet. Create one to monitor spending." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => (
            <Card key={budget.id} elevated>
              <CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{budget.name}</CardTitle><CardDescription>{budget.category || "All categories"} · {budget.periodStart} to {budget.periodEnd}</CardDescription></div><Badge variant={budget.percentUsed >= budget.alertThreshold ? "warning" : "success"}>{budget.percentUsed}% used</Badge></div></CardHeader>
              <div className="px-5 pb-5"><div className="h-2 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${budget.percentUsed >= budget.alertThreshold ? "bg-warning" : "bg-primary"}`} style={{ width: `${Math.min(100, budget.percentUsed)}%` }} /></div><div className="mt-3 flex justify-between text-sm text-secondary"><span>{money(budget.spent)} spent</span><span>{money(budget.remaining)} remaining</span></div></div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function FinanceCashFlowPanel({ entries, series }: { entries: FinanceCashFlowEntry[]; series: FinanceCashFlowPoint[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <Card elevated>
        <CardHeader><CardTitle>Cash flow</CardTitle><CardDescription>Cash in, cash out, and projected movement.</CardDescription></CardHeader>
        <div className="grid grid-cols-6 items-end gap-2 px-5 pb-5">
          {series.map((point) => <div key={point.month}><div className="flex h-36 items-end gap-1 rounded-t-lg bg-elevated p-1"><div className="w-1/2 rounded-t bg-success/80" style={{ height: `${Math.max(5, Math.min(100, point.cashIn / Math.max(1, ...series.map((item) => item.cashIn)) * 100))}%` }} /><div className="w-1/2 rounded-t bg-warning/80" style={{ height: `${Math.max(5, Math.min(100, point.cashOut / Math.max(1, ...series.map((item) => item.cashOut)) * 100))}%` }} /></div><p className="mt-2 text-center text-[10px] text-muted">{point.month}</p></div>)}
        </div>
      </Card>
      <Card elevated>
        <CardHeader><CardTitle>Add cash movement</CardTitle></CardHeader>
        <form className="grid gap-3 px-5 pb-5 sm:grid-cols-2" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          startTransition(async () => {
            const result = await createCashFlowAction({ flowType: String(form.get("flowType")) as "in" | "out", description: String(form.get("description") ?? ""), category: String(form.get("category") ?? "") || undefined, amount: Number(form.get("amount") ?? 0), flowDate: String(form.get("flowDate") ?? ""), isForecast: form.get("forecast") === "on" });
            if (!result.ok) setError(result.error); else { event.currentTarget.reset(); router.refresh(); }
          });
        }}>
          <select name="flowType" className={inputClass}><option value="in">Cash in</option><option value="out">Cash out</option></select>
          <input name="description" required placeholder="Description" className={inputClass} />
          <input name="category" placeholder="Category" className={inputClass} />
          <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" className={inputClass} />
          <input name="flowDate" required type="date" className={inputClass} />
          <label className="flex items-center gap-2 text-sm text-secondary"><input name="forecast" type="checkbox" /> Forecast</label>
          <Button loading={pending} type="submit" className="sm:col-span-2 sm:w-fit">Add movement</Button>
          {error ? <p className="text-sm text-error sm:col-span-2">{error}</p> : null}
        </form>
      </Card>
      {entries.length === 0 ? <EmptyPanel text="No cash flow entries yet." /> : <div className="space-y-2">{entries.slice(0, 20).map((entry) => <div key={entry.id} className="bos-glass flex items-center justify-between rounded-xl p-4"><div><p className="font-medium">{entry.description}</p><p className="text-xs text-muted">{entry.flowDate} · {entry.category || "Uncategorized"}{entry.isForecast ? " · Forecast" : ""}</p></div><p className={entry.flowType === "in" ? "font-semibold text-success" : "font-semibold text-warning"}>{entry.flowType === "in" ? "+" : "−"}{money(entry.amount)}</p></div>)}</div>}
    </div>
  );
}

export function FinanceReportsPanel({ reports }: { reports: FinanceReport[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="space-y-4"><Card elevated><CardHeader><CardTitle>Generate report</CardTitle><CardDescription>Save a workspace-scoped financial snapshot for sharing or export.</CardDescription></CardHeader><form className="grid gap-3 px-5 pb-5 sm:grid-cols-3" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await generateFinanceReportAction({ reportType: String(form.get("reportType")) as FinanceReport["reportType"], periodStart: String(form.get("periodStart")), periodEnd: String(form.get("periodEnd")) }); if (result.ok) router.refresh(); }); }}><select name="reportType" className={inputClass}><option value="profit_loss">Profit & Loss</option><option value="revenue">Revenue</option><option value="expense">Expense</option><option value="cash_flow">Cash Flow</option><option value="tax">Tax Summary</option></select><input name="periodStart" required type="date" className={inputClass} /><input name="periodEnd" required type="date" className={inputClass} /><Button loading={pending} type="submit" className="sm:col-span-3 sm:w-fit">Generate report</Button></form></Card>{reports.length === 0 ? <EmptyPanel text="No reports generated yet." /> : <div className="grid gap-4 md:grid-cols-2">{reports.map((report) => <Card key={report.id}><CardHeader><CardTitle className="capitalize">{report.title}</CardTitle><CardDescription>{report.periodStart} to {report.periodEnd}</CardDescription></CardHeader><p className="px-5 pb-5 text-sm text-secondary">{report.summary}</p></Card>)}</div>}</div>;
}

export function FinanceSettingsPanel({ settings }: { settings: FinanceSettings }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <Card elevated><CardHeader><CardTitle>Finance settings</CardTitle><CardDescription>Defaults used by reports, invoices, and financial views.</CardDescription></CardHeader><form className="grid gap-4 px-5 pb-5 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); startTransition(async () => { const result = await updateFinanceSettingsAction({ currency: String(form.get("currency")), taxRate: Number(form.get("taxRate")), invoiceNumberFormat: String(form.get("invoiceFormat")), fiscalYearStartMonth: Number(form.get("fiscalMonth")), paymentMethods: String(form.get("paymentMethods")).split(",").map((item) => item.trim()).filter(Boolean), defaultCategories: String(form.get("categories")).split(",").map((item) => item.trim()).filter(Boolean) }); if (result.ok) router.refresh(); }); }}><label className="grid gap-1 text-sm text-secondary">Currency<input name="currency" defaultValue={settings.currency} className={inputClass} /></label><label className="grid gap-1 text-sm text-secondary">Tax rate<input name="taxRate" type="number" step="0.01" defaultValue={settings.taxRate} className={inputClass} /></label><label className="grid gap-1 text-sm text-secondary">Invoice number format<input name="invoiceFormat" defaultValue={settings.invoiceNumberFormat} className={inputClass} /></label><label className="grid gap-1 text-sm text-secondary">Fiscal year start month<input name="fiscalMonth" type="number" min="1" max="12" defaultValue={settings.fiscalYearStartMonth} className={inputClass} /></label><label className="grid gap-1 text-sm text-secondary sm:col-span-2">Payment methods<input name="paymentMethods" defaultValue={settings.paymentMethods.join(", ")} className={inputClass} /></label><label className="grid gap-1 text-sm text-secondary sm:col-span-2">Default categories<input name="categories" defaultValue={settings.defaultCategories.join(", ")} className={inputClass} /></label><Button loading={pending} type="submit" className="sm:w-fit">Save settings</Button></form></Card>;
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownRight,
  ArrowUpRight,
  Copy,
  Download,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { EmptyState } from "../dashboard/section-shell";
import {
  createExpenseAction,
  createInvoiceAction,
  createTransactionAction,
  updateInvoiceStatusAction,
} from "../../app/(protected)/actions/finance";
import type {
  FinanceDashboardStats,
  FinanceExpense,
  FinanceInvoice,
  FinanceInvoiceItem,
  FinanceTransaction,
  FinanceTransactionType,
} from "@repo/types";

const money = (value: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);

const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));

const statusVariant = (status: string) =>
  status === "paid" || status === "reimbursed" ? "success" : status === "overdue" || status === "void" ? "warning" : "default";

function MetricCard({
  label,
  value,
  hint,
  positive,
}: {
  label: string;
  value: string;
  hint: string;
  positive?: boolean;
}) {
  return (
    <Card className="transition hover:border-primary/30">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tracking-tight sm:text-3xl">{value}</CardTitle>
        <p className={`mt-1 flex items-center gap-1 text-xs ${positive === false ? "text-warning" : "text-secondary"}`}>
          {positive === true ? <ArrowUpRight className="h-3.5 w-3.5 text-success" aria-hidden /> : null}
          {positive === false ? <ArrowDownRight className="h-3.5 w-3.5 text-warning" aria-hidden /> : null}
          {hint}
        </p>
      </CardHeader>
    </Card>
  );
}

export function FinanceDashboard({ stats }: { stats: FinanceDashboardStats }) {
  const max = Math.max(1, ...stats.monthly.flatMap((point) => [point.revenue, point.expenses]));
  const hasActivity = stats.monthly.some((point) => point.revenue > 0 || point.expenses > 0);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard label="Total Revenue" value={money(stats.totalRevenue)} hint="Paid invoices + income" positive />
        <MetricCard label="Total Expenses" value={money(stats.totalExpenses)} hint="Recorded workspace spend" positive={false} />
        <MetricCard label="Net Profit" value={money(stats.netProfit)} hint="Revenue less expenses" positive={stats.netProfit >= 0} />
        <MetricCard label="Cash Balance" value={money(stats.cashBalance)} hint="Tracked transactions" positive={stats.cashBalance >= 0} />
        <MetricCard label="Pending Payments" value={money(stats.pendingPayments)} hint="Sent invoices" />
        <MetricCard label="Overdue Invoices" value={String(stats.overdueInvoices)} hint="Needs attention" positive={stats.overdueInvoices === 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Monthly performance</CardTitle>
                <CardDescription>Paid revenue and recorded expenses for the last six months.</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            </div>
          </CardHeader>
          {hasActivity ? (
            <div className="grid grid-cols-6 items-end gap-2 px-5 pb-6 pt-2 sm:gap-4">
              {stats.monthly.map((point) => (
                <div key={point.month} className="min-w-0">
                  <div className="flex h-44 items-end justify-center gap-1">
                    <div className="w-1/2 rounded-t-md bg-primary/80 transition-all" style={{ height: `${Math.max(4, (point.revenue / max) * 100)}%` }} title={`Revenue ${money(point.revenue)}`} />
                    <div className="w-1/2 rounded-t-md bg-white/20 transition-all" style={{ height: `${Math.max(4, (point.expenses / max) * 100)}%` }} title={`Expenses ${money(point.expenses)}`} />
                  </div>
                  <p className="mt-2 truncate text-center text-[10px] text-muted">{point.month}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5"><EmptyState preset="analytics" /></div>
          )}
          {hasActivity ? <div className="flex gap-4 px-5 pb-5 text-xs text-secondary"><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-primary" />Revenue</span><span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-white/30" />Expenses</span></div> : null}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top customers</CardTitle>
            <CardDescription>By paid invoice revenue.</CardDescription>
          </CardHeader>
          {stats.topCustomers.length ? (
            <ul className="space-y-3 px-5 pb-5">
              {stats.topCustomers.map((customer) => <li key={customer.name} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-secondary">{customer.name}</span><span className="font-medium">{money(customer.revenue)}</span></li>)}
            </ul>
          ) : <div className="p-5 pt-0"><EmptyState preset="customers" /></div>}
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Top expense categories</CardTitle>
          <CardDescription>Recorded spend by category.</CardDescription>
        </CardHeader>
        {stats.topExpenseCategories.length ? (
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-5">
            {stats.topExpenseCategories.map((category) => <div key={category.category} className="rounded-xl border border-border bg-elevated p-3"><p className="truncate text-xs text-secondary">{category.category}</p><p className="mt-2 font-semibold">{money(category.amount)}</p></div>)}
          </div>
        ) : <div className="p-5 pt-0"><EmptyState preset="analytics" title="No expenses yet" body="Record an expense to see category analytics." /></div>}
      </Card>
    </div>
  );
}

function FinanceForm({
  title,
  children,
  onSubmit,
  submitLabel,
  error,
  pending,
}: {
  title: string;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  error: string | null;
  pending: boolean;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <form onSubmit={onSubmit} className="grid gap-3 px-5 pb-5 sm:grid-cols-2">
        {error ? <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200 sm:col-span-2" role="alert">{error}</p> : null}
        {children}
        <Button type="submit" loading={pending} className="sm:col-span-2 sm:w-fit">{submitLabel}</Button>
      </form>
    </Card>
  );
}

const inputClass = "w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="grid gap-1.5"><span className="text-xs font-medium text-secondary">{label}</span>{children}</label>;
}

export function InvoiceManager({
  invoices,
  onRefresh: passedRefresh,
}: {
  invoices: FinanceInvoice[];
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const refresh = passedRefresh ?? (() => router.refresh());
  const onRefresh = refresh;
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const filtered = useMemo(() => invoices.filter((item) => `${item.invoiceNumber} ${item.customerName}`.toLowerCase().includes(query.toLowerCase()) && (status === "all" || item.status === status)), [invoices, query, status]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const quantity = Number(form.get("quantity") ?? 1);
    const unitPrice = Number(form.get("unitPrice") ?? 0);
    const item: FinanceInvoiceItem = { description: String(form.get("item") ?? "").trim(), quantity, unitPrice, amount: quantity * unitPrice };
    setError(null);
    startTransition(async () => {
      const result = await createInvoiceAction({
        invoiceNumber: String(form.get("invoiceNumber") ?? ""),
        customerName: String(form.get("customerName") ?? ""),
        items: [item],
        tax: Number(form.get("tax") ?? 0),
        discount: Number(form.get("discount") ?? 0),
        dueDate: String(form.get("dueDate") ?? "") || undefined,
        notes: String(form.get("notes") ?? ""),
      });
      if (!result.ok) { setError(result.error); return; }
      setShowForm(false); refresh();
    });
  }

  function duplicate(invoice: FinanceInvoice) {
    const nextNumber = `${invoice.invoiceNumber}-COPY-${Date.now().toString().slice(-4)}`;
    startTransition(async () => {
      const result = await createInvoiceAction({ invoiceNumber: nextNumber, customerName: invoice.customerName, items: invoice.items, tax: invoice.tax, discount: invoice.discount, dueDate: invoice.dueDate ?? undefined, notes: invoice.notes ?? undefined });
      if (!result.ok) setError(result.error); else refresh();
    });
  }

  return (
    <div className="space-y-4">
      {showForm ? <FinanceForm title="Create invoice" submitLabel="Save draft" onSubmit={submit} error={error} pending={pending}>
        <Field label="Invoice number"><input name="invoiceNumber" required placeholder="INV-0001" className={inputClass} /></Field>
        <Field label="Customer"><input name="customerName" required placeholder="Customer or company name" className={inputClass} /></Field>
        <Field label="Item"><input name="item" required placeholder="Service or product" className={inputClass} /></Field>
        <Field label="Quantity"><input name="quantity" type="number" min="1" defaultValue="1" className={inputClass} /></Field>
        <Field label="Unit price"><input name="unitPrice" required type="number" min="0" step="0.01" className={inputClass} /></Field>
        <Field label="Due date"><input name="dueDate" type="date" className={inputClass} /></Field>
        <Field label="Tax"><input name="tax" type="number" min="0" step="0.01" defaultValue="0" className={inputClass} /></Field>
        <Field label="Discount"><input name="discount" type="number" min="0" step="0.01" defaultValue="0" className={inputClass} /></Field>
        <Field label="Notes"><textarea name="notes" rows={2} className={`${inputClass} sm:col-span-2`} /></Field>
      </FinanceForm> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-2 sm:max-w-lg"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices" className={`${inputClass} pl-9`} /></div><select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} w-auto`}><option value="all">All statuses</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
        <Button onClick={() => { setShowForm((value) => !value); setError(null); }} className="gap-2"><Plus className="h-4 w-4" aria-hidden />{showForm ? "Close" : "Create Invoice"}</Button>
      </div>
      {filtered.length === 0 ? <EmptyState preset="invoices" /> : <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-border bg-elevated text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Due</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody>{filtered.map((invoice) => <tr key={invoice.id} className="border-b border-border/70 last:border-0"><td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td><td className="px-4 py-3 text-secondary">{invoice.customerName}</td><td className="px-4 py-3 text-secondary">{invoice.dueDate ? dateLabel(invoice.dueDate) : "—"}</td><td className="px-4 py-3 font-medium">{money(invoice.total, invoice.currency)}</td><td className="px-4 py-3"><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button title="Print or save PDF" onClick={() => window.print()} className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-foreground"><Download className="h-4 w-4" aria-hidden /></button><button title="Duplicate invoice" onClick={() => duplicate(invoice)} className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-foreground"><Copy className="h-4 w-4" aria-hidden /></button>{invoice.status === "draft" ? <button onClick={() => { startTransition(async () => { const result = await updateInvoiceStatusAction({ id: invoice.id, status: "sent" }); if (!result.ok) setError(result.error); else onRefresh(); }); }} className="rounded-lg px-2 text-xs text-primary hover:bg-primary/10">Send</button> : null}</div></td></tr>)}</tbody></table></div>}
    </div>
  );
}

export function ExpenseManager({ expenses, onRefresh }: { expenses: FinanceExpense[]; onRefresh?: () => void }) {
  const router = useRouter();
  const refresh = onRefresh ?? (() => router.refresh());
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const filtered = expenses.filter((item) => `${item.vendor} ${item.category}`.toLowerCase().includes(query.toLowerCase()));
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createExpenseAction({ category: String(form.get("category") ?? ""), vendor: String(form.get("vendor") ?? ""), amount: Number(form.get("amount") ?? 0), expenseDate: String(form.get("expenseDate") ?? ""), notes: String(form.get("notes") ?? ""), receipt: (form.get("receipt") as File)?.size ? (form.get("receipt") as File) : undefined });
      if (!result.ok) setError(result.error); else { setShowForm(false); refresh(); }
    });
  }
  return <div className="space-y-4">{showForm ? <FinanceForm title="Add expense" submitLabel="Save expense" onSubmit={submit} error={error} pending={pending}><Field label="Category"><input name="category" required placeholder="Software, payroll, travel…" className={inputClass} /></Field><Field label="Vendor"><input name="vendor" required placeholder="Vendor name" className={inputClass} /></Field><Field label="Amount"><input name="amount" required type="number" min="0.01" step="0.01" className={inputClass} /></Field><Field label="Date"><input name="expenseDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} /></Field><Field label="Receipt"><input name="receipt" type="file" accept="image/*,.pdf" className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-2 file:py-1 file:text-xs file:text-primary`} /></Field><Field label="Notes"><textarea name="notes" rows={2} className={`${inputClass} sm:col-span-2`} /></Field></FinanceForm> : null}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expenses" className={`${inputClass} pl-9`} /></div><Button onClick={() => { setShowForm((value) => !value); setError(null); }} className="gap-2"><Plus className="h-4 w-4" aria-hidden />{showForm ? "Close" : "Add expense"}</Button></div>{filtered.length === 0 ? <EmptyState preset="invoices" title="No expenses yet" body="Record your first expense to build a reliable cash view." /> : <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[650px] text-left text-sm"><thead className="border-b border-border bg-elevated text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{filtered.map((expense) => <tr key={expense.id} className="border-b border-border/70 last:border-0"><td className="px-4 py-3 text-secondary">{dateLabel(expense.expenseDate)}</td><td className="px-4 py-3 font-medium">{expense.vendor}</td><td className="px-4 py-3 text-secondary">{expense.category}</td><td className="px-4 py-3 font-medium">{money(expense.amount, expense.currency)}</td><td className="px-4 py-3"><Badge variant={statusVariant(expense.status)}>{expense.status}</Badge></td></tr>)}</tbody></table></div>}</div>;
}

export function TransactionManager({ transactions, onRefresh }: { transactions: FinanceTransaction[]; onRefresh?: () => void }) {
  const router = useRouter();
  const refresh = onRefresh ?? (() => router.refresh());
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const filtered = transactions.filter((item) => item.description.toLowerCase().includes(query.toLowerCase()));
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createTransactionAction({ type: String(form.get("type") ?? "manual") as FinanceTransactionType, description: String(form.get("description") ?? ""), amount: Number(form.get("amount") ?? 0), transactionDate: String(form.get("transactionDate") ?? "") });
      if (!result.ok) setError(result.error); else { setShowForm(false); refresh(); }
    });
  }
  return <div className="space-y-4">{showForm ? <FinanceForm title="Add manual transaction" submitLabel="Save transaction" onSubmit={submit} error={error} pending={pending}><Field label="Type"><select name="type" className={inputClass}><option value="manual">Manual entry</option><option value="income">Income</option><option value="expense">Expense</option><option value="refund">Refund</option></select></Field><Field label="Description"><input name="description" required className={inputClass} /></Field><Field label="Amount"><input name="amount" required type="number" min="0.01" step="0.01" className={inputClass} /></Field><Field label="Date"><input name="transactionDate" required type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} /></Field></FinanceForm> : null}<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-xs"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" className={`${inputClass} pl-9`} /></div><Button onClick={() => { setShowForm((value) => !value); setError(null); }} className="gap-2"><Plus className="h-4 w-4" aria-hidden />{showForm ? "Close" : "Add transaction"}</Button></div>{filtered.length === 0 ? <EmptyState preset="analytics" title="No transactions yet" body="Income, expenses, refunds, and manual entries will appear here." /> : <div className="space-y-2">{filtered.map((transaction) => <div key={transaction.id} className="flex flex-col gap-2 rounded-2xl border border-border bg-elevated p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{transaction.description}</p><p className="mt-1 text-xs text-muted">{dateLabel(transaction.transactionDate)} · {transaction.type}</p></div><p className={`font-semibold ${transaction.type === "expense" || transaction.type === "refund" ? "text-warning" : "text-success"}`}>{transaction.type === "expense" || transaction.type === "refund" ? "−" : "+"}{money(transaction.amount, transaction.currency)}</p></div>)}</div>}</div>;
}

export function FinanceCustomerList({ invoices }: { invoices: FinanceInvoice[] }) {
  const customers = new Map<string, { revenue: number; outstanding: number; invoices: number; history: FinanceInvoice[] }>();
  for (const invoice of invoices) {
    const entry = customers.get(invoice.customerName) ?? { revenue: 0, outstanding: 0, invoices: 0, history: [] };
    entry.invoices += 1;
    entry.history.push(invoice);
    if (invoice.status === "paid") entry.revenue += invoice.total;
    if (invoice.status === "sent" || invoice.status === "overdue") entry.outstanding += invoice.total;
    customers.set(invoice.customerName, entry);
  }
  const rows = [...customers.entries()];
  return rows.length === 0 ? <EmptyState preset="customers" /> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{rows.map(([name, data]) => <Card key={name}><CardHeader><CardTitle className="truncate text-base">{name}</CardTitle><CardDescription>{data.invoices} invoice{data.invoices === 1 ? "" : "s"}</CardDescription></CardHeader><div className="grid grid-cols-2 gap-3 px-5 pb-5 text-sm"><div><p className="text-xs text-muted">Lifetime revenue</p><p className="mt-1 font-semibold">{money(data.revenue)}</p></div><div><p className="text-xs text-muted">Outstanding</p><p className="mt-1 font-semibold text-warning">{money(data.outstanding)}</p></div></div><div className="border-t border-border px-5 py-4"><p className="text-xs font-medium text-muted">Invoice & payment history</p><ul className="mt-2 space-y-2">{data.history.slice(0, 3).map((invoice) => <li key={invoice.id} className="flex items-center justify-between gap-2 text-xs"><span className="text-secondary">{invoice.invoiceNumber}</span><span className="flex items-center gap-2"><Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge><span>{money(invoice.total)}</span></span></li>)}</ul></div></Card>)}</div>;
}

export function FinanceAnalytics({ stats }: { stats: FinanceDashboardStats }) {
  return <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Profit trend</CardTitle><CardDescription>Monthly revenue minus expenses.</CardDescription></CardHeader><div className="space-y-3 px-5 pb-5">{stats.monthly.map((point) => <div key={point.month} className="grid grid-cols-[70px_1fr_80px] items-center gap-3 text-sm"><span className="text-xs text-muted">{point.month}</span><div className="h-2 overflow-hidden rounded-full bg-elevated"><div className={`h-full rounded-full ${point.profit >= 0 ? "bg-primary" : "bg-warning"}`} style={{ width: `${Math.min(100, Math.abs(point.profit) / Math.max(1, stats.totalRevenue) * 100)}%` }} /></div><span className="text-right font-medium">{money(point.profit)}</span></div>)}</div></Card><Card><CardHeader><CardTitle>Top expense categories</CardTitle><CardDescription>Where recorded spend is concentrated.</CardDescription></CardHeader><div className="space-y-3 px-5 pb-5">{stats.topExpenseCategories.length ? stats.topExpenseCategories.map((item) => <div key={item.category} className="flex items-center justify-between text-sm"><span className="text-secondary">{item.category}</span><span className="font-medium">{money(item.amount)}</span></div>) : <EmptyState preset="analytics" title="No analytics yet" body="Add expenses to see category insights." />}</div></Card></div>;
}

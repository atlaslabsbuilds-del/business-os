import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  FinanceDashboardStats,
  FinanceBudget,
  FinanceCashFlowEntry,
  FinanceCashFlowPoint,
  FinanceCustomer,
  FinanceExpense,
  FinanceExpenseStatus,
  FinanceInvoice,
  FinanceInvoiceItem,
  FinanceMonthlyPoint,
  FinanceInvoiceStatus,
  FinanceTransaction,
  FinanceTransactionType,
  FinanceReport,
  FinanceSettings,
  FinanceVendor,
  Json,
} from "@repo/types";
import { clientOrDefault } from "./platform-helpers";

type Db = SupabaseClient<Database>;
type InvoiceRow = Database["public"]["Tables"]["finance_invoices"]["Row"];
type ExpenseRow = Database["public"]["Tables"]["finance_expenses"]["Row"];
type TransactionRow = Database["public"]["Tables"]["finance_transactions"]["Row"];

function number(value: number | string | null | undefined) {
  return Number(value ?? 0);
}

function mapInvoice(row: InvoiceRow): FinanceInvoice {
  const isPastDue =
    row.status === "sent" &&
    Boolean(row.due_date) &&
    row.due_date! < new Date().toISOString().slice(0, 10);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    customerId: row.customer_id,
    customerName: row.customer_name,
    invoiceNumber: row.invoice_number,
    status: isPastDue ? "overdue" : (row.status as FinanceInvoiceStatus),
    items: Array.isArray(row.items) ? (row.items as unknown as FinanceInvoiceItem[]) : [],
    subtotal: number(row.subtotal),
    tax: number(row.tax),
    discount: number(row.discount),
    total: number(row.total),
    currency: row.currency,
    notes: row.notes,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExpense(row: ExpenseRow): FinanceExpense {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    category: row.category,
    vendor: row.vendor,
    amount: number(row.amount),
    currency: row.currency,
    expenseDate: row.expense_date,
    notes: row.notes,
    receiptPath: row.receipt_path,
    status: row.status as FinanceExpenseStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: TransactionRow): FinanceTransaction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    type: row.type as FinanceTransactionType,
    description: row.description,
    amount: number(row.amount),
    currency: row.currency,
    transactionDate: row.transaction_date,
    referenceId: row.reference_id,
    provider: row.provider,
    createdAt: row.created_at,
  };
}

function mapCustomer(row: Database["public"]["Tables"]["finance_customers"]["Row"]): FinanceCustomer {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    crmCompanyId: row.crm_company_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    billingAddress: row.billing_address,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVendor(row: Database["public"]["Tables"]["finance_vendors"]["Row"]): FinanceVendor {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    email: row.email,
    category: row.category,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapBudget(
  row: Database["public"]["Tables"]["finance_budgets"]["Row"],
  spent = 0,
): FinanceBudget {
  const amount = number(row.amount);
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    category: row.category,
    department: row.department,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    amount,
    spent,
    remaining: amount - spent,
    percentUsed: amount > 0 ? Math.round((spent / amount) * 100) : 0,
    alertThreshold: number(row.alert_threshold),
    status: row.status as FinanceBudget["status"],
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCashFlow(row: Database["public"]["Tables"]["finance_cash_flow"]["Row"]): FinanceCashFlowEntry {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    flowType: row.flow_type as FinanceCashFlowEntry["flowType"],
    description: row.description,
    category: row.category,
    amount: number(row.amount),
    currency: row.currency,
    flowDate: row.flow_date,
    isForecast: row.is_forecast,
    status: row.status as FinanceCashFlowEntry["status"],
    referenceId: row.reference_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapReport(row: Database["public"]["Tables"]["finance_reports"]["Row"]): FinanceReport {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    reportType: row.report_type as FinanceReport["reportType"],
    periodStart: row.period_start,
    periodEnd: row.period_end,
    title: row.title,
    summary: row.summary,
    data: (row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? row.data
      : {}) as Record<string, unknown>,
    format: row.format as FinanceReport["format"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: Database["public"]["Tables"]["finance_settings"]["Row"]): FinanceSettings {
  const strings = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  return {
    workspaceId: row.workspace_id,
    currency: row.currency,
    taxRate: number(row.tax_rate),
    invoiceNumberFormat: row.invoice_number_format,
    fiscalYearStartMonth: row.fiscal_year_start_month,
    paymentMethods: strings(row.payment_methods),
    defaultCategories: strings(row.default_categories),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFinanceInvoices(input: {
  workspaceId: string;
  query?: string;
  status?: FinanceInvoiceStatus;
  client?: Db;
}): Promise<FinanceInvoice[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("finance_invoices")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (input.status) query = query.eq("status", input.status);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    query = query.or(`invoice_number.ilike.%${term}%,customer_name.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list invoices: ${error.message}`);
  return (data ?? []).map(mapInvoice);
}

export async function createFinanceInvoice(input: {
  workspaceId: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  customerId?: string | null;
  items: FinanceInvoiceItem[];
  tax?: number;
  discount?: number;
  currency?: string;
  notes?: string | null;
  dueDate?: string | null;
  client?: Db;
}): Promise<FinanceInvoice> {
  const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);
  const tax = input.tax ?? 0;
  const discount = input.discount ?? 0;
  const total = Math.max(0, subtotal + tax - discount);
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_invoices")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      invoice_number: input.invoiceNumber.trim(),
      customer_name: input.customerName.trim(),
      customer_id: input.customerId ?? null,
      items: input.items as unknown as Json,
      subtotal,
      tax,
      discount,
      total,
      currency: input.currency ?? "USD",
      notes: input.notes ?? null,
      due_date: input.dueDate ?? null,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return mapInvoice(data);
}

export async function updateFinanceInvoiceStatus(input: {
  workspaceId: string;
  id: string;
  status: FinanceInvoiceStatus;
  client?: Db;
}): Promise<FinanceInvoice> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_invoices")
    .update({
      status: input.status,
      paid_at: input.status === "paid" ? new Date().toISOString() : null,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error) throw new Error(`Failed to update invoice: ${error.message}`);
  return mapInvoice(data);
}

export async function listFinanceExpenses(input: {
  workspaceId: string;
  query?: string;
  status?: FinanceExpenseStatus;
  client?: Db;
}): Promise<FinanceExpense[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("finance_expenses")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("expense_date", { ascending: false });
  if (input.status) query = query.eq("status", input.status);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    query = query.or(`vendor.ilike.%${term}%,category.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list expenses: ${error.message}`);
  return (data ?? []).map(mapExpense);
}

export async function createFinanceExpense(input: {
  workspaceId: string;
  userId: string;
  category: string;
  vendor: string;
  amount: number;
  expenseDate: string;
  notes?: string | null;
  receiptPath?: string | null;
  client?: Db;
}): Promise<FinanceExpense> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_expenses")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      category: input.category.trim(),
      vendor: input.vendor.trim(),
      amount: input.amount,
      expense_date: input.expenseDate,
      notes: input.notes ?? null,
      receipt_path: input.receiptPath ?? null,
      status: "recorded",
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create expense: ${error.message}`);
  return mapExpense(data);
}

export async function listFinanceTransactions(input: {
  workspaceId: string;
  query?: string;
  type?: FinanceTransactionType;
  client?: Db;
}): Promise<FinanceTransaction[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("finance_transactions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (input.type) query = query.eq("type", input.type);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    query = query.ilike("description", `%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list transactions: ${error.message}`);
  return (data ?? []).map(mapTransaction);
}

export async function createFinanceTransaction(input: {
  workspaceId: string;
  userId: string;
  type: FinanceTransactionType;
  description: string;
  amount: number;
  transactionDate: string;
  client?: Db;
}): Promise<FinanceTransaction> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_transactions")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      type: input.type,
      description: input.description.trim(),
      amount: input.amount,
      transaction_date: input.transactionDate,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create transaction: ${error.message}`);
  return mapTransaction(data);
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

export async function getFinanceDashboardStats(
  workspaceId: string,
  client?: Db,
): Promise<FinanceDashboardStats> {
  const supabase = await clientOrDefault(client);
  const [invoicesResult, expensesResult, transactionsResult] = await Promise.all([
    supabase.from("finance_invoices").select("*").eq("workspace_id", workspaceId),
    supabase.from("finance_expenses").select("*").eq("workspace_id", workspaceId),
    supabase.from("finance_transactions").select("*").eq("workspace_id", workspaceId),
  ]);
  if (invoicesResult.error) throw new Error(`Failed to load invoice analytics: ${invoicesResult.error.message}`);
  if (expensesResult.error) throw new Error(`Failed to load expense analytics: ${expensesResult.error.message}`);
  if (transactionsResult.error) throw new Error(`Failed to load transaction analytics: ${transactionsResult.error.message}`);

  const invoices = (invoicesResult.data ?? []).map(mapInvoice);
  const expenses = (expensesResult.data ?? []).map(mapExpense);
  const transactions = (transactionsResult.data ?? []).map(mapTransaction);
  const revenue = invoices.filter((invoice) => invoice.status === "paid").reduce((sum, invoice) => sum + invoice.total, 0);
  const transactionIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const refunds = transactions
    .filter((transaction) => transaction.type === "refund")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalRevenue = revenue + transactionIncome - refunds;
  const totalExpenses =
    expenses.filter((expense) => expense.status !== "void").reduce((sum, expense) => sum + expense.amount, 0) +
    transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
  const cashBalance =
    transactions.reduce(
      (sum, transaction) =>
        sum + (transaction.type === "income" || transaction.type === "manual" ? transaction.amount : -transaction.amount),
      0,
    );
  const pendingPayments = invoices
    .filter((invoice) => invoice.status === "sent")
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const overdueInvoices = invoices.filter((invoice) => invoice.status === "overdue").length;

  const months = new Map<string, FinanceMonthlyPoint>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - index, 1);
    const key = date.toISOString().slice(0, 7);
    months.set(key, { month: key, revenue: 0, expenses: 0, profit: 0 });
  }
  for (const invoice of invoices.filter((item) => item.status === "paid")) {
    const point = months.get(monthKey(invoice.paidAt ?? invoice.createdAt));
    if (point) point.revenue += invoice.total;
  }
  for (const expense of expenses.filter((item) => item.status !== "void")) {
    const point = months.get(monthKey(expense.expenseDate));
    if (point) point.expenses += expense.amount;
  }
  for (const point of months.values()) point.profit = point.revenue - point.expenses;

  const customerTotals = new Map<string, number>();
  for (const invoice of invoices.filter((item) => item.status === "paid")) {
    customerTotals.set(invoice.customerName, (customerTotals.get(invoice.customerName) ?? 0) + invoice.total);
  }
  const categoryTotals = new Map<string, number>();
  for (const expense of expenses.filter((item) => item.status !== "void")) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    cashBalance,
    pendingPayments,
    overdueInvoices,
    monthly: [...months.values()],
    topCustomers: [...customerTotals.entries()]
      .map(([name, value]) => ({ name, revenue: value }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    topExpenseCategories: [...categoryTotals.entries()]
      .map(([category, value]) => ({ category, amount: value }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5),
  };
}

export async function listFinanceCustomers(input: {
  workspaceId: string;
  query?: string;
  limit?: number;
  offset?: number;
  client?: Db;
}): Promise<FinanceCustomer[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("finance_customers")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("name", { ascending: true })
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 50) - 1);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list finance customers: ${error.message}`);
  return (data ?? []).map(mapCustomer);
}

export async function listFinanceVendors(input: {
  workspaceId: string;
  query?: string;
  limit?: number;
  offset?: number;
  client?: Db;
}): Promise<FinanceVendor[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("finance_vendors")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("name", { ascending: true })
    .range(input.offset ?? 0, (input.offset ?? 0) + (input.limit ?? 50) - 1);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,category.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list finance vendors: ${error.message}`);
  return (data ?? []).map(mapVendor);
}

export async function listFinanceBudgets(input: {
  workspaceId: string;
  client?: Db;
}): Promise<FinanceBudget[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_budgets")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("status", "active")
    .order("period_start", { ascending: false });
  if (error) throw new Error(`Failed to list budgets: ${error.message}`);
  const expenses = await listFinanceExpenses({ workspaceId: input.workspaceId, client: supabase });
  return (data ?? []).map((row) => {
    const spent = expenses
      .filter(
        (expense) =>
          expense.expenseDate >= row.period_start &&
          expense.expenseDate <= row.period_end &&
          (!row.category || expense.category === row.category),
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
    return mapBudget(row, spent);
  });
}

export async function createFinanceBudget(input: {
  workspaceId: string;
  userId: string;
  name: string;
  category?: string | null;
  department?: string | null;
  periodStart: string;
  periodEnd: string;
  amount: number;
  alertThreshold?: number;
  notes?: string | null;
  client?: Db;
}): Promise<FinanceBudget> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_budgets")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name.trim(),
      category: input.category?.trim() || null,
      department: input.department?.trim() || null,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      amount: input.amount,
      alert_threshold: input.alertThreshold ?? 80,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create budget: ${error.message}`);
  return mapBudget(data);
}

export async function listFinanceCashFlow(input: {
  workspaceId: string;
  client?: Db;
}): Promise<FinanceCashFlowEntry[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_cash_flow")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("flow_date", { ascending: false });
  if (error) throw new Error(`Failed to list cash flow: ${error.message}`);
  return (data ?? []).map(mapCashFlow);
}

export async function createFinanceCashFlowEntry(input: {
  workspaceId: string;
  userId: string;
  flowType: "in" | "out";
  description: string;
  category?: string | null;
  amount: number;
  currency?: string;
  flowDate: string;
  isForecast?: boolean;
  status?: "projected" | "confirmed" | "cancelled";
  client?: Db;
}): Promise<FinanceCashFlowEntry> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_cash_flow")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      flow_type: input.flowType,
      description: input.description.trim(),
      category: input.category?.trim() || null,
      amount: input.amount,
      currency: input.currency ?? "USD",
      flow_date: input.flowDate,
      is_forecast: input.isForecast ?? false,
      status: input.status ?? "projected",
    })
    .select("*")
    .single();
  if (error) throw new Error(`Failed to create cash flow entry: ${error.message}`);
  return mapCashFlow(data);
}

export async function getFinanceCashFlowSeries(
  workspaceId: string,
  client?: Db,
): Promise<FinanceCashFlowPoint[]> {
  const entries = await listFinanceCashFlow({ workspaceId, client });
  const points = new Map<string, FinanceCashFlowPoint>();
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date();
    date.setMonth(date.getMonth() - index, 1);
    const month = date.toISOString().slice(0, 7);
    points.set(month, { month, cashIn: 0, cashOut: 0, net: 0 });
  }
  for (const entry of entries) {
    const point = points.get(entry.flowDate.slice(0, 7));
    if (!point || entry.status === "cancelled") continue;
    if (entry.flowType === "in") point.cashIn += entry.amount;
    else point.cashOut += entry.amount;
    point.net = point.cashIn - point.cashOut;
  }
  return [...points.values()];
}

export async function getFinanceSettings(
  workspaceId: string,
  client?: Db,
): Promise<FinanceSettings> {
  const supabase = await clientOrDefault(client);
  const { data, error } = await supabase
    .from("finance_settings")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load finance settings: ${error.message}`);
  if (data) return mapSettings(data);
  const { data: created, error: createError } = await supabase
    .from("finance_settings")
    .insert({ workspace_id: workspaceId })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(`Failed to initialize finance settings: ${createError?.message ?? "Unknown error"}`);
  }
  return mapSettings(created);
}

export async function updateFinanceSettings(input: {
  workspaceId: string;
  currency?: string;
  taxRate?: number;
  invoiceNumberFormat?: string;
  fiscalYearStartMonth?: number;
  paymentMethods?: string[];
  defaultCategories?: string[];
  client?: Db;
}): Promise<FinanceSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_settings")
    .upsert({
      workspace_id: input.workspaceId,
      currency: input.currency,
      tax_rate: input.taxRate,
      invoice_number_format: input.invoiceNumberFormat,
      fiscal_year_start_month: input.fiscalYearStartMonth,
      payment_methods: input.paymentMethods,
      default_categories: input.defaultCategories,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update finance settings: ${error?.message ?? "Unknown error"}`);
  return mapSettings(data);
}

export async function createFinanceReport(input: {
  workspaceId: string;
  userId: string;
  reportType: FinanceReport["reportType"];
  periodStart: string;
  periodEnd: string;
  title: string;
  summary?: string | null;
  data: Record<string, unknown>;
  format?: FinanceReport["format"];
  client?: Db;
}): Promise<FinanceReport> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_reports")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      report_type: input.reportType,
      period_start: input.periodStart,
      period_end: input.periodEnd,
      title: input.title,
      summary: input.summary ?? null,
      data: input.data as Json,
      format: input.format ?? "json",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create finance report: ${error?.message ?? "Unknown error"}`);
  return mapReport(data);
}

export async function listFinanceReports(input: {
  workspaceId: string;
  client?: Db;
}): Promise<FinanceReport[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("finance_reports")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list finance reports: ${error.message}`);
  return (data ?? []).map(mapReport);
}


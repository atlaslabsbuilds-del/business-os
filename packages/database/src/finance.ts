import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  FinanceDashboardStats,
  FinanceExpense,
  FinanceExpenseStatus,
  FinanceInvoice,
  FinanceInvoiceItem,
  FinanceMonthlyPoint,
  FinanceInvoiceStatus,
  FinanceTransaction,
  FinanceTransactionType,
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


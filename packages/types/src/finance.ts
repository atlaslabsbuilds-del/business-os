import { z } from "zod";

export const financeInvoiceStatusSchema = z.enum([
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);
export type FinanceInvoiceStatus = z.infer<typeof financeInvoiceStatusSchema>;

export const financeExpenseStatusSchema = z.enum([
  "recorded",
  "reimbursable",
  "reimbursed",
  "void",
]);
export type FinanceExpenseStatus = z.infer<typeof financeExpenseStatusSchema>;

export const financeTransactionTypeSchema = z.enum([
  "income",
  "expense",
  "refund",
  "manual",
]);
export type FinanceTransactionType = z.infer<typeof financeTransactionTypeSchema>;

export const financeSearchSchema = z.object({
  query: z.string().trim().max(100).optional(),
  status: z.string().optional(),
  type: z.string().optional(),
});

export type FinanceInvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

export type FinanceInvoice = {
  id: string;
  workspaceId: string;
  createdBy: string;
  customerId: string | null;
  customerName: string;
  invoiceNumber: string;
  status: FinanceInvoiceStatus;
  items: FinanceInvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  notes: string | null;
  dueDate: string | null;
  paidAt: string | null;
  provider: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceExpense = {
  id: string;
  workspaceId: string;
  createdBy: string;
  category: string;
  vendor: string;
  amount: number;
  currency: string;
  expenseDate: string;
  notes: string | null;
  receiptPath: string | null;
  status: FinanceExpenseStatus;
  createdAt: string;
  updatedAt: string;
};

export type FinanceTransaction = {
  id: string;
  workspaceId: string;
  createdBy: string;
  type: FinanceTransactionType;
  description: string;
  amount: number;
  currency: string;
  transactionDate: string;
  referenceId: string | null;
  provider: string | null;
  createdAt: string;
};

export type FinanceMonthlyPoint = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};

export type FinanceDashboardStats = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  pendingPayments: number;
  overdueInvoices: number;
  monthly: FinanceMonthlyPoint[];
  topCustomers: Array<{ name: string; revenue: number }>;
  topExpenseCategories: Array<{ category: string; amount: number }>;
};

export type FinanceCustomer = {
  id: string;
  workspaceId: string;
  createdBy: string;
  crmCompanyId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceVendor = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  email: string | null;
  category: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceBudget = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  category: string | null;
  department: string | null;
  periodStart: string;
  periodEnd: string;
  amount: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  alertThreshold: number;
  status: "active" | "archived";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceCashFlowEntry = {
  id: string;
  workspaceId: string;
  createdBy: string;
  flowType: "in" | "out";
  description: string;
  category: string | null;
  amount: number;
  currency: string;
  flowDate: string;
  isForecast: boolean;
  status: "projected" | "confirmed" | "cancelled";
  referenceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FinanceReport = {
  id: string;
  workspaceId: string;
  createdBy: string;
  reportType: "profit_loss" | "balance_sheet" | "cash_flow" | "revenue" | "expense" | "tax";
  periodStart: string;
  periodEnd: string;
  title: string;
  summary: string | null;
  data: Record<string, unknown>;
  format: "json" | "csv" | "pdf";
  createdAt: string;
  updatedAt: string;
};

export type FinanceSettings = {
  workspaceId: string;
  currency: string;
  taxRate: number;
  invoiceNumberFormat: string;
  fiscalYearStartMonth: number;
  paymentMethods: string[];
  defaultCategories: string[];
  createdAt: string;
  updatedAt: string;
};

export type FinanceCashFlowPoint = {
  month: string;
  cashIn: number;
  cashOut: number;
  net: number;
};


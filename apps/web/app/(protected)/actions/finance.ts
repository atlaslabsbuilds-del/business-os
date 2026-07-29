"use server";

import { getUser } from "@repo/auth/server";
import {
  createFinanceExpense,
  createFinanceInvoice,
  createFinanceTransaction,
  getFinanceDashboardStats,
  listFinanceExpenses,
  listFinanceInvoices,
  listFinanceTransactions,
  updateFinanceInvoiceStatus,
} from "@repo/database/finance";
import { getMembershipRole } from "@repo/database/workspace";
import { createAdminClient } from "@repo/database/admin";
import { emitWorkspaceNotification } from "@repo/database/notifications";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import type {
  FinanceExpenseStatus,
  FinanceInvoiceItem,
  FinanceInvoiceStatus,
  FinanceTransactionType,
} from "@repo/types";

async function context() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const active = await resolveActiveWorkspace();
  if (!active) throw new Error("No active workspace");
  const role = await getMembershipRole(active.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: active.active.workspace.id };
}

export async function getFinanceData(input?: {
  query?: string;
  invoiceStatus?: FinanceInvoiceStatus;
  expenseStatus?: FinanceExpenseStatus;
  transactionType?: FinanceTransactionType;
}) {
  const ctx = await context();
  const [stats, invoices, expenses, transactions] = await Promise.all([
    getFinanceDashboardStats(ctx.workspaceId),
    listFinanceInvoices({ workspaceId: ctx.workspaceId, query: input?.query, status: input?.invoiceStatus }),
    listFinanceExpenses({ workspaceId: ctx.workspaceId, query: input?.query, status: input?.expenseStatus }),
    listFinanceTransactions({ workspaceId: ctx.workspaceId, query: input?.query, type: input?.transactionType }),
  ]);
  return { stats, invoices, expenses, transactions };
}

export async function createInvoiceAction(input: {
  invoiceNumber: string;
  customerName: string;
  items: FinanceInvoiceItem[];
  tax: number;
  discount: number;
  dueDate?: string;
  notes?: string;
  receipt?: File;
}) {
  const ctx = await context();
  if (!input.invoiceNumber.trim() || !input.customerName.trim() || input.items.length === 0) {
    return { ok: false as const, error: "Invoice number, customer, and at least one item are required." };
  }
  try {
    const invoice = await createFinanceInvoice({ ...input, workspaceId: ctx.workspaceId, userId: ctx.userId });
    return { ok: true as const, invoice };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to create invoice." };
  }
}

export async function updateInvoiceStatusAction(input: {
  id: string;
  status: FinanceInvoiceStatus;
}) {
  const ctx = await context();
  try {
    const invoice = await updateFinanceInvoiceStatus({ ...input, workspaceId: ctx.workspaceId });
    if (input.status === "paid") {
      await emitWorkspaceNotification({
        workspaceId: ctx.workspaceId,
        module: "finance",
        category: "invoice_paid",
        title: `Invoice ${invoice.invoiceNumber} paid`,
        body: `${invoice.customerName} · $${invoice.total.toLocaleString()}`,
        actionUrl: "/finance/invoices",
        userId: ctx.userId,
        metadata: { invoiceId: invoice.id },
      });
    } else if (invoice.status === "overdue") {
      await emitWorkspaceNotification({
        workspaceId: ctx.workspaceId,
        module: "finance",
        category: "invoice_overdue",
        title: `Invoice ${invoice.invoiceNumber} is overdue`,
        body: `${invoice.customerName} · due ${invoice.dueDate ?? "now"}`,
        actionUrl: "/finance/invoices",
        userId: ctx.userId,
        metadata: { invoiceId: invoice.id },
      });
    }
    return { ok: true as const, invoice };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to update invoice." };
  }
}

export async function createExpenseAction(input: {
  category: string;
  vendor: string;
  amount: number;
  expenseDate: string;
  notes?: string;
  receipt?: File;
}) {
  const ctx = await context();
  if (!input.category.trim() || !input.vendor.trim() || input.amount <= 0 || !input.expenseDate) {
    return { ok: false as const, error: "Category, vendor, positive amount, and date are required." };
  }
  try {
    let receiptPath: string | null = null;
    if (input.receipt && input.receipt.size > 0) {
      if (input.receipt.size > 8 * 1024 * 1024) {
        return { ok: false as const, error: "Receipt must be 8MB or smaller." };
      }
      if (!input.receipt.type.startsWith("image/") && input.receipt.type !== "application/pdf") {
        return { ok: false as const, error: "Receipts must be a PDF or image file." };
      }
      const safeName = input.receipt.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      receiptPath = `${ctx.workspaceId}/${crypto.randomUUID()}-${safeName}`;
      const admin = createAdminClient();
      const upload = await admin.storage.from("finance-receipts").upload(receiptPath, input.receipt, {
        contentType: input.receipt.type,
        upsert: false,
      });
      if (upload.error) {
        return { ok: false as const, error: "Receipt upload failed. Please try again." };
      }
    }
    const expense = await createFinanceExpense({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      category: input.category,
      vendor: input.vendor,
      amount: input.amount,
      expenseDate: input.expenseDate,
      notes: input.notes,
      receiptPath,
    });
    return { ok: true as const, expense };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to create expense." };
  }
}

export async function createTransactionAction(input: {
  type: FinanceTransactionType;
  description: string;
  amount: number;
  transactionDate: string;
}) {
  const ctx = await context();
  if (!input.description.trim() || input.amount <= 0 || !input.transactionDate) {
    return { ok: false as const, error: "Description, positive amount, and date are required." };
  }
  try {
    const transaction = await createFinanceTransaction({ ...input, workspaceId: ctx.workspaceId, userId: ctx.userId });
    return { ok: true as const, transaction };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Unable to create transaction." };
  }
}

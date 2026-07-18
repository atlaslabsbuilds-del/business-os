import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreditTransaction, Database, Json, WorkspaceCredits } from "@repo/types";
import { createServerClient } from "./server";

type CreditsRow = Database["public"]["Tables"]["workspace_credits"]["Row"];
type TransactionRow = Database["public"]["Tables"]["credit_transactions"]["Row"];

function mapCredits(row: CreditsRow): WorkspaceCredits {
  return {
    workspaceId: row.workspace_id,
    balance: Number(row.balance),
    updatedAt: row.updated_at,
  };
}

function mapTransaction(row: TransactionRow): CreditTransaction {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    amount: Number(row.amount),
    reason: row.reason,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export async function getWorkspaceCredits(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceCredits> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("workspace_credits")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load credits: ${error.message}`);
  }

  if (data) {
    return mapCredits(data);
  }

  const { data: created, error: createError } = await supabase
    .from("workspace_credits")
    .insert({ workspace_id: input.workspaceId, balance: 10000 })
    .select("*")
    .single();

  if (createError || !created) {
    return {
      workspaceId: input.workspaceId,
      balance: 10000,
      updatedAt: new Date().toISOString(),
    };
  }

  return mapCredits(created);
}

export async function deductWorkspaceCredits(input: {
  workspaceId: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<{ balance: number }> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase.rpc("deduct_workspace_credits", {
    target_workspace_id: input.workspaceId,
    deduct_amount: input.amount,
    reason: input.reason,
    metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    if (error.message.includes("INSUFFICIENT_CREDITS")) {
      throw new Error("Insufficient workspace credits");
    }
    throw new Error(`Failed to deduct credits: ${error.message}`);
  }

  return { balance: Number(data) };
}

export async function listCreditTransactions(input: {
  workspaceId: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<CreditTransaction[]> {
  const supabase = input.client ?? (await createServerClient());
  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (error) {
    throw new Error(`Failed to list credit transactions: ${error.message}`);
  }

  return (data ?? []).map(mapTransaction);
}

export function tokensToCredits(totalTokens: number): number {
  if (totalTokens <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(totalTokens / 100));
}

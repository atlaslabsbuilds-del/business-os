import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  InboxAiReplyDraft,
  Json,
  SmartReplyStatus,
  SmartReplyStyle,
} from "@repo/types";
import { createServerClient } from "./server";

type DraftRow = Database["public"]["Tables"]["inbox_ai_reply_drafts"]["Row"];

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

function metadataToRecord(json: Json): Record<string, unknown> {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

function mapDraft(row: DraftRow): InboxAiReplyDraft {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    accountId: row.account_id,
    createdBy: row.created_by,
    style: row.style,
    body: row.body,
    subject: row.subject,
    gmailDraftId: row.gmail_draft_id,
    gmailMessageId: row.gmail_message_id,
    status: row.status,
    creditsUsed: row.credits_used,
    metadata: metadataToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sentAt: row.sent_at,
  };
}

export async function createAiReplyDraft(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  accountId?: string | null;
  style: SmartReplyStyle;
  body: string;
  subject?: string | null;
  gmailDraftId?: string | null;
  creditsUsed?: number;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<InboxAiReplyDraft> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_ai_reply_drafts")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      thread_id: input.threadId,
      account_id: input.accountId ?? null,
      style: input.style,
      body: input.body,
      subject: input.subject ?? null,
      gmail_draft_id: input.gmailDraftId ?? null,
      credits_used: input.creditsUsed ?? 0,
      status: "draft",
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to save AI reply draft: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapDraft(data);
}

export async function listAiReplyDrafts(input: {
  workspaceId: string;
  threadId: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<InboxAiReplyDraft[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_ai_reply_drafts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("thread_id", input.threadId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);
  if (error) {
    throw new Error(`Failed to list AI reply drafts: ${error.message}`);
  }
  return (data ?? []).map(mapDraft);
}

export async function listWorkspaceAiReplyDrafts(input: {
  workspaceId: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<InboxAiReplyDraft[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_ai_reply_drafts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);
  if (error) {
    throw new Error(`Failed to list workspace AI reply drafts: ${error.message}`);
  }
  return (data ?? []).map(mapDraft);
}

export async function getAiReplyDraft(input: {
  workspaceId: string;
  draftId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAiReplyDraft | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_ai_reply_drafts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.draftId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load AI reply draft: ${error.message}`);
  }
  return data ? mapDraft(data) : null;
}

export async function updateAiReplyDraft(input: {
  workspaceId: string;
  draftId: string;
  body?: string;
  status?: SmartReplyStatus;
  gmailDraftId?: string | null;
  gmailMessageId?: string | null;
  sentAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxAiReplyDraft> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["inbox_ai_reply_drafts"]["Update"] =
    {};
  if (input.body !== undefined) patch.body = input.body;
  if (input.status !== undefined) patch.status = input.status;
  if (input.gmailDraftId !== undefined) {
    patch.gmail_draft_id = input.gmailDraftId;
  }
  if (input.gmailMessageId !== undefined) {
    patch.gmail_message_id = input.gmailMessageId;
  }
  if (input.sentAt !== undefined) patch.sent_at = input.sentAt;

  const { data, error } = await supabase
    .from("inbox_ai_reply_drafts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.draftId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update AI reply draft: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapDraft(data);
}

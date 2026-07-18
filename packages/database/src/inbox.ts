import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  EmailThreadSummary,
  InboxAccount,
  InboxAttachment,
  InboxCalendarEvent,
  InboxDashboardStats,
  InboxLabel,
  InboxMessage,
  InboxParticipant,
  InboxProvider,
  InboxTask,
  InboxTaskStatus,
  InboxThread,
  InboxThreadDetail,
  InboxThreadStatus,
  Json,
} from "@repo/types";
import { emailThreadSummarySchema } from "@repo/types";
import { createServerClient } from "./server";

type AccountRow = Database["public"]["Tables"]["inbox_accounts"]["Row"];
type ThreadRow = Database["public"]["Tables"]["inbox_threads"]["Row"];
type MessageRow = Database["public"]["Tables"]["inbox_messages"]["Row"];
type LabelRow = Database["public"]["Tables"]["inbox_labels"]["Row"];
type AttachmentRow = Database["public"]["Tables"]["inbox_attachments"]["Row"];
type TaskRow = Database["public"]["Tables"]["inbox_tasks"]["Row"];
type CalendarEventRow =
  Database["public"]["Tables"]["inbox_calendar_events"]["Row"];

export function parseParticipants(json: Json): InboxParticipant[] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }
    const email = item.email;
    if (typeof email !== "string" || email.length === 0) return [];
    const name = item.name;
    return [
      {
        email,
        name:
          typeof name === "string"
            ? name
            : name === null
              ? null
              : undefined,
      },
    ];
  });
}

function metadataToRecord(json: Json): Record<string, unknown> {
  if (typeof json === "object" && json !== null && !Array.isArray(json)) {
    return json as Record<string, unknown>;
  }
  return {};
}

function participantsToJson(participants: InboxParticipant[]): Json {
  return participants as unknown as Json;
}

function parseSuggestedActions(
  json: Json,
): InboxThread["aiSuggestedActions"] {
  if (!Array.isArray(json)) return [];
  return json.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return [];
    }
    const type = item.type;
    const label = item.label;
    const confidence = item.confidence;
    if (typeof type !== "string" || typeof label !== "string") return [];
    return [
      {
        type,
        label,
        confidence: typeof confidence === "number" ? confidence : 0,
      },
    ];
  });
}

export function parseEmailThreadSummary(
  json: Json | null | undefined,
): EmailThreadSummary | null {
  if (json == null) return null;
  const parsed = emailThreadSummarySchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}

function mapAccount(row: AccountRow): InboxAccount {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    provider: row.provider,
    email: row.email,
    displayName: row.display_name,
    status: row.status,
    scopes: row.scopes,
    lastSyncedAt: row.last_synced_at,
    historyId: row.history_id ?? null,
    syncError: row.sync_error ?? null,
    metadata: metadataToRecord(row.metadata),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapThread(row: ThreadRow): InboxThread {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    externalId: row.external_id,
    subject: row.subject,
    snippet: row.snippet,
    participants: parseParticipants(row.participants),
    status: row.status,
    isUnread: row.is_unread,
    isStarred: row.is_starred,
    messageCount: row.message_count,
    hasAttachments: row.has_attachments,
    lastMessageAt: row.last_message_at,
    contactId: row.contact_id,
    companyId: row.company_id,
    aiSummary: row.ai_summary,
    aiSummaryStructured: parseEmailThreadSummary(row.ai_summary_structured),
    aiPriority: row.ai_priority ?? null,
    aiClassification: row.ai_classification ?? null,
    aiSuggestedActions: parseSuggestedActions(
      row.ai_suggested_actions ?? [],
    ),
    meetingDetected: row.meeting_detected,
    meetingConfidence: Number(row.meeting_confidence),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): InboxMessage {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    accountId: row.account_id,
    externalId: row.external_id,
    direction: row.direction,
    fromEmail: row.from_email,
    fromName: row.from_name,
    toEmails: parseParticipants(row.to_emails),
    ccEmails: parseParticipants(row.cc_emails),
    subject: row.subject,
    bodyText: row.body_text,
    bodyHtml: row.body_html,
    sentAt: row.sent_at,
    isDraft: row.is_draft,
    aiSummary: row.ai_summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLabel(row: LabelRow): InboxLabel {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    name: row.name,
    color: row.color,
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAttachment(row: AttachmentRow): InboxAttachment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    messageId: row.message_id,
    filename: row.filename,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    storageUrl: row.storage_url,
    externalId: row.external_id,
    createdAt: row.created_at,
  };
}

function mapTask(row: TaskRow): InboxTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    messageId: row.message_id,
    title: row.title,
    description: row.description,
    dueAt: row.due_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapCalendarEvent(row: CalendarEventRow): InboxCalendarEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    threadId: row.thread_id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    location: row.location,
    attendees: parseParticipants(row.attendees),
    provider: row.provider,
    externalId: row.external_id,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

// ── Accounts ───────────────────────────────────────────────

export async function listInboxAccounts(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccount[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(`Failed to list inbox accounts: ${error.message}`);
  return (data ?? []).map(mapAccount);
}

export async function connectInboxAccount(input: {
  workspaceId: string;
  userId: string;
  provider: InboxProvider;
  email: string;
  displayName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxAccount> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_accounts")
    .upsert(
      {
        workspace_id: input.workspaceId,
        created_by: input.userId,
        provider: input.provider,
        email: input.email,
        display_name: input.displayName ?? null,
        access_token: input.accessToken ?? null,
        refresh_token: input.refreshToken ?? null,
        status: "connected",
        last_synced_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,provider,email" },
    )
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to connect inbox account: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapAccount(data);
}

export async function disconnectInboxAccount(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("inbox_accounts")
    .update({
      status: "disconnected",
      access_token: null,
      refresh_token: null,
      token_expires_at: null,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) {
    throw new Error(`Failed to disconnect inbox account: ${error.message}`);
  }
}

// ── Threads ────────────────────────────────────────────────

export async function listInboxThreads(input: {
  workspaceId: string;
  query?: string;
  status?: InboxThreadStatus;
  accountId?: string;
  unreadOnly?: boolean;
  contactId?: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("inbox_threads")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("last_message_at", { ascending: false });

  if (input.status) builder = builder.eq("status", input.status);
  if (input.accountId) builder = builder.eq("account_id", input.accountId);
  if (input.unreadOnly) builder = builder.eq("is_unread", true);
  if (input.contactId) builder = builder.eq("contact_id", input.contactId);
  if (input.query) {
    builder = builder.or(
      `subject.ilike.%${input.query}%,snippet.ilike.%${input.query}%`,
    );
  }

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list inbox threads: ${error.message}`);
  return (data ?? []).map(mapThread);
}

export async function getInboxThread(input: {
  workspaceId: string;
  threadId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_threads")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load inbox thread: ${error.message}`);
  return data ? mapThread(data) : null;
}

export async function getInboxThreadDetail(input: {
  workspaceId: string;
  threadId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxThreadDetail | null> {
  const thread = await getInboxThread({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    client: input.client,
  });
  if (!thread) return null;

  const [messages, attachments, labels, tasks, calendarEvents] =
    await Promise.all([
      listInboxMessages({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        client: input.client,
      }),
      listInboxAttachments({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        client: input.client,
      }),
      listThreadLabels({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        client: input.client,
      }),
      listInboxTasks({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        client: input.client,
      }),
      listInboxCalendarEvents({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        client: input.client,
      }),
    ]);

  return {
    thread,
    messages,
    attachments,
    labels,
    tasks,
    calendarEvents,
  };
}

export async function archiveInboxThread(input: {
  workspaceId: string;
  threadId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_threads")
    .update({ status: "archived" })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to archive inbox thread: ${error?.message ?? "Unknown"}`);
  }
  return mapThread(data);
}

export async function markThreadRead(input: {
  workspaceId: string;
  threadId: string;
  isUnread: boolean;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_threads")
    .update({ is_unread: input.isUnread })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update thread read state: ${error?.message ?? "Unknown"}`);
  }
  return mapThread(data);
}

export async function updateThreadSummary(input: {
  workspaceId: string;
  threadId: string;
  aiSummary: string | null;
  aiSummaryStructured?: EmailThreadSummary | null;
  meetingDetected?: boolean;
  meetingConfidence?: number;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["inbox_threads"]["Update"] = {
    ai_summary: input.aiSummary,
  };
  if (input.aiSummaryStructured !== undefined) {
    patch.ai_summary_structured =
      input.aiSummaryStructured as unknown as Json;
  }
  if (input.meetingDetected !== undefined) {
    patch.meeting_detected = input.meetingDetected;
  }
  if (input.meetingConfidence !== undefined) {
    patch.meeting_confidence = input.meetingConfidence;
  }

  const { data, error } = await supabase
    .from("inbox_threads")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update thread summary: ${error?.message ?? "Unknown"}`);
  }
  return mapThread(data);
}

export async function linkThreadToContact(input: {
  workspaceId: string;
  threadId: string;
  contactId?: string | null;
  companyId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxThread> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["inbox_threads"]["Update"] = {};
  if (input.contactId !== undefined) patch.contact_id = input.contactId;
  if (input.companyId !== undefined) patch.company_id = input.companyId;

  const { data, error } = await supabase
    .from("inbox_threads")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to link thread to contact: ${error?.message ?? "Unknown"}`);
  }
  return mapThread(data);
}

// ── Messages ───────────────────────────────────────────────

export async function listInboxMessages(input: {
  workspaceId: string;
  threadId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxMessage[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_messages")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("thread_id", input.threadId)
    .order("sent_at", { ascending: true });
  if (error) throw new Error(`Failed to list inbox messages: ${error.message}`);
  return (data ?? []).map(mapMessage);
}

export async function createInboxReply(input: {
  workspaceId: string;
  threadId: string;
  accountId: string;
  fromEmail: string;
  toEmails: InboxParticipant[];
  subject: string;
  bodyText: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxMessage> {
  const supabase = await clientOrDefault(input.client);
  const sentAt = new Date().toISOString();
  const snippet = input.bodyText.slice(0, 240);

  const { data: message, error: messageError } = await supabase
    .from("inbox_messages")
    .insert({
      workspace_id: input.workspaceId,
      thread_id: input.threadId,
      account_id: input.accountId,
      direction: "outbound",
      from_email: input.fromEmail,
      to_emails: participantsToJson(input.toEmails),
      cc_emails: participantsToJson([]),
      subject: input.subject,
      body_text: input.bodyText,
      sent_at: sentAt,
      is_draft: false,
    })
    .select("*")
    .single();
  if (messageError || !message) {
    throw new Error(
      `Failed to create inbox reply: ${messageError?.message ?? "Unknown"}`,
    );
  }

  const thread = await getInboxThread({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    client: input.client,
  });
  const messageCount = (thread?.messageCount ?? 0) + 1;

  const { error: threadError } = await supabase
    .from("inbox_threads")
    .update({
      message_count: messageCount,
      last_message_at: sentAt,
      snippet,
      is_unread: false,
    })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId);
  if (threadError) {
    throw new Error(`Failed to update thread after reply: ${threadError.message}`);
  }

  return mapMessage(message);
}

// ── Labels ─────────────────────────────────────────────────

export async function listInboxLabels(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxLabel[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_labels")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to list inbox labels: ${error.message}`);
  return (data ?? []).map(mapLabel);
}

export async function createInboxLabel(input: {
  workspaceId: string;
  name: string;
  color?: string;
  accountId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxLabel> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_labels")
    .insert({
      workspace_id: input.workspaceId,
      name: input.name,
      color: input.color ?? "#4f46e5",
      account_id: input.accountId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create inbox label: ${error?.message ?? "Unknown"}`);
  }
  return mapLabel(data);
}

export async function assignInboxLabel(input: {
  workspaceId: string;
  threadId: string;
  labelId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase.from("inbox_thread_labels").upsert(
    {
      workspace_id: input.workspaceId,
      thread_id: input.threadId,
      label_id: input.labelId,
    },
    { onConflict: "thread_id,label_id" },
  );
  if (error) throw new Error(`Failed to assign inbox label: ${error.message}`);
}

export async function unassignInboxLabel(input: {
  workspaceId: string;
  threadId: string;
  labelId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("inbox_thread_labels")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("thread_id", input.threadId)
    .eq("label_id", input.labelId);
  if (error) throw new Error(`Failed to unassign inbox label: ${error.message}`);
}

export async function listThreadLabels(input: {
  workspaceId: string;
  threadId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxLabel[]> {
  const supabase = await clientOrDefault(input.client);
  const { data: assignments, error: assignmentError } = await supabase
    .from("inbox_thread_labels")
    .select("label_id")
    .eq("workspace_id", input.workspaceId)
    .eq("thread_id", input.threadId);
  if (assignmentError) {
    throw new Error(`Failed to list thread labels: ${assignmentError.message}`);
  }

  const labelIds = (assignments ?? []).map((row) => row.label_id);
  if (labelIds.length === 0) return [];

  const { data, error } = await supabase
    .from("inbox_labels")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .in("id", labelIds)
    .order("name", { ascending: true });
  if (error) throw new Error(`Failed to load thread labels: ${error.message}`);
  return (data ?? []).map(mapLabel);
}

// ── Attachments ────────────────────────────────────────────

export async function listInboxAttachments(input: {
  workspaceId: string;
  messageId?: string;
  threadId?: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxAttachment[]> {
  const supabase = await clientOrDefault(input.client);

  if (input.threadId) {
    const messages = await listInboxMessages({
      workspaceId: input.workspaceId,
      threadId: input.threadId,
      client: input.client,
    });
    const messageIds = messages.map((message) => message.id);
    if (messageIds.length === 0) return [];

    const { data, error } = await supabase
      .from("inbox_attachments")
      .select("*")
      .eq("workspace_id", input.workspaceId)
      .in("message_id", messageIds)
      .order("created_at", { ascending: true });
    if (error) {
      throw new Error(`Failed to list inbox attachments: ${error.message}`);
    }
    return (data ?? []).map(mapAttachment);
  }

  let builder = supabase
    .from("inbox_attachments")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: true });
  if (input.messageId) builder = builder.eq("message_id", input.messageId);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list inbox attachments: ${error.message}`);
  return (data ?? []).map(mapAttachment);
}

// ── Tasks ──────────────────────────────────────────────────

export async function listInboxTasks(input: {
  workspaceId: string;
  threadId?: string;
  status?: InboxTaskStatus;
  client?: SupabaseClient<Database>;
}): Promise<InboxTask[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("inbox_tasks")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });

  if (input.threadId) builder = builder.eq("thread_id", input.threadId);
  if (input.status) builder = builder.eq("status", input.status);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list inbox tasks: ${error.message}`);
  return (data ?? []).map(mapTask);
}

export async function createInboxTask(input: {
  workspaceId: string;
  userId: string;
  threadId?: string | null;
  messageId?: string | null;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<InboxTask> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_tasks")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      thread_id: input.threadId ?? null,
      message_id: input.messageId ?? null,
      title: input.title,
      description: input.description ?? null,
      due_at: input.dueAt ?? null,
      status: "open",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create inbox task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

export async function updateInboxTaskStatus(input: {
  workspaceId: string;
  id: string;
  status: InboxTaskStatus;
  client?: SupabaseClient<Database>;
}): Promise<InboxTask> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_tasks")
    .update({ status: input.status })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update inbox task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

// ── Calendar ───────────────────────────────────────────────

export async function listInboxCalendarEvents(input: {
  workspaceId: string;
  threadId?: string;
  upcomingOnly?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<InboxCalendarEvent[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("inbox_calendar_events")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("starts_at", { ascending: true });

  if (input.threadId) builder = builder.eq("thread_id", input.threadId);
  if (input.upcomingOnly) {
    builder = builder.gte("starts_at", new Date().toISOString());
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list inbox calendar events: ${error.message}`);
  }
  return (data ?? []).map(mapCalendarEvent);
}

export async function scheduleInboxMeeting(input: {
  workspaceId: string;
  userId: string;
  threadId?: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string | null;
  attendees?: InboxParticipant[];
  provider?: InboxProvider;
  client?: SupabaseClient<Database>;
}): Promise<InboxCalendarEvent> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("inbox_calendar_events")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      thread_id: input.threadId ?? null,
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location ?? null,
      attendees: participantsToJson(input.attendees ?? []),
      provider: input.provider ?? null,
      status: "scheduled",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to schedule inbox meeting: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapCalendarEvent(data);
}

// ── Dashboard ──────────────────────────────────────────────

export async function getInboxDashboardStats(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<InboxDashboardStats> {
  const [accounts, threads, tasks, calendarEvents] = await Promise.all([
    listInboxAccounts({ workspaceId: input.workspaceId, client: input.client }),
    listInboxThreads({ workspaceId: input.workspaceId, client: input.client }),
    listInboxTasks({
      workspaceId: input.workspaceId,
      status: "open",
      client: input.client,
    }),
    listInboxCalendarEvents({
      workspaceId: input.workspaceId,
      upcomingOnly: true,
      client: input.client,
    }),
  ]);

  const openThreads = threads.filter((thread) => thread.status === "open");
  const unread = threads.filter((thread) => thread.isUnread);
  const archived = threads.filter((thread) => thread.status === "archived");
  const upcomingMeetings = calendarEvents.filter(
    (event) => event.status === "scheduled",
  );

  return {
    accounts: accounts.filter((account) => account.status === "connected")
      .length,
    openThreads: openThreads.length,
    unread: unread.length,
    archived: archived.length,
    tasksOpen: tasks.length,
    upcomingMeetings: upcomingMeetings.length,
  };
}

// ── Demo seed ──────────────────────────────────────────────

export async function seedDemoInbox(input: {
  workspaceId: string;
  userId: string;
  provider?: InboxProvider;
  client?: SupabaseClient<Database>;
}): Promise<{
  account: InboxAccount;
  threads: InboxThread[];
  label: InboxLabel;
}> {
  const provider = input.provider ?? "gmail";
  const supabase = await clientOrDefault(input.client);

  const account = await connectInboxAccount({
    workspaceId: input.workspaceId,
    userId: input.userId,
    provider,
    email: `demo@${provider === "gmail" ? "gmail.com" : "outlook.com"}`,
    displayName: "Demo Inbox",
    client: input.client,
  });

  const label = await createInboxLabel({
    workspaceId: input.workspaceId,
    name: "Important",
    color: "#dc2626",
    accountId: account.id,
    client: input.client,
  });

  const now = Date.now();
  const threadSpecs = [
    {
      subject: "Welcome to your unified inbox",
      snippet: "Your demo inbox is ready with sample threads.",
      participants: [{ email: "team@actora.ai", name: "Actora Team" }],
      meetingDetected: false,
      messages: [
        {
          fromEmail: "team@actora.ai",
          fromName: "Actora Team",
          bodyText:
            "Welcome! This is a demo thread so you can explore inbox features without connecting OAuth.",
        },
      ],
    },
    {
      subject: "Q3 pipeline review",
      snippet: "Can we schedule time next week to walk through the pipeline?",
      participants: [
        { email: "alex@acme.co", name: "Alex Morgan" },
        { email: account.email, name: account.displayName },
      ],
      meetingDetected: true,
      messages: [
        {
          fromEmail: "alex@acme.co",
          fromName: "Alex Morgan",
          bodyText:
            "Hi — can we schedule a meeting next Tuesday at 2pm to review the Q3 pipeline? I'll send an agenda beforehand.",
        },
        {
          fromEmail: account.email,
          fromName: account.displayName,
          bodyText: "Tuesday at 2pm works for me. Looking forward to it.",
        },
      ],
    },
    {
      subject: "Contract draft attached",
      snippet: "Please find the updated MSA attached for your review.",
      participants: [{ email: "legal@vendor.io", name: "Legal Team" }],
      meetingDetected: false,
      hasAttachment: true,
      messages: [
        {
          fromEmail: "legal@vendor.io",
          fromName: "Legal Team",
          bodyText:
            "Please find the updated MSA attached for your review. Let us know if you have any redlines.",
        },
      ],
    },
  ];

  const threads: InboxThread[] = [];

  for (const [index, spec] of threadSpecs.entries()) {
    const lastMessageAt = new Date(now - index * 3600_000).toISOString();
    const { data: threadRow, error: threadError } = await supabase
      .from("inbox_threads")
      .insert({
        workspace_id: input.workspaceId,
        account_id: account.id,
        subject: spec.subject,
        snippet: spec.snippet,
        participants: participantsToJson(spec.participants),
        status: "open",
        is_unread: index === 0,
        message_count: spec.messages.length,
        has_attachments: Boolean(spec.hasAttachment),
        last_message_at: lastMessageAt,
        meeting_detected: spec.meetingDetected,
        meeting_confidence: spec.meetingDetected ? 0.92 : 0,
      })
      .select("*")
      .single();
    if (threadError || !threadRow) {
      throw new Error(
        `Failed to seed demo thread: ${threadError?.message ?? "Unknown"}`,
      );
    }

    for (const [messageIndex, messageSpec] of spec.messages.entries()) {
      const sentAt = new Date(
        now - index * 3600_000 + messageIndex * 60_000,
      ).toISOString();
      const { data: messageRow, error: messageError } = await supabase
        .from("inbox_messages")
        .insert({
          workspace_id: input.workspaceId,
          thread_id: threadRow.id,
          account_id: account.id,
          direction: messageIndex === spec.messages.length - 1 && index === 1
            ? "outbound"
            : "inbound",
          from_email: messageSpec.fromEmail,
          from_name: messageSpec.fromName,
          to_emails: participantsToJson([{ email: account.email }]),
          cc_emails: participantsToJson([]),
          subject: spec.subject,
          body_text: messageSpec.bodyText,
          sent_at: sentAt,
        })
        .select("*")
        .single();
      if (messageError || !messageRow) {
        throw new Error(
          `Failed to seed demo message: ${messageError?.message ?? "Unknown"}`,
        );
      }

      if (spec.hasAttachment && messageIndex === 0) {
        const { error: attachmentError } = await supabase
          .from("inbox_attachments")
          .insert({
            workspace_id: input.workspaceId,
            message_id: messageRow.id,
            filename: "MSA-draft-v2.pdf",
            mime_type: "application/pdf",
            size_bytes: 248_000,
          });
        if (attachmentError) {
          throw new Error(
            `Failed to seed demo attachment: ${attachmentError.message}`,
          );
        }
      }
    }

    if (index === 0) {
      await assignInboxLabel({
        workspaceId: input.workspaceId,
        threadId: threadRow.id,
        labelId: label.id,
        client: input.client,
      });
    }

    threads.push(mapThread(threadRow));
  }

  return { account, threads, label };
}

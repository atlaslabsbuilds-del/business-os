import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  WorkspaceNotification,
  WorkspaceNotificationType,
} from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type NotificationRow =
  Database["public"]["Tables"]["workspace_notifications"]["Row"];

function mapNotification(row: NotificationRow): WorkspaceNotification {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    module: row.module,
    type: row.type,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    readAt: row.read_at,
    createdBy: row.created_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listWorkspaceNotifications(input: {
  workspaceId: string;
  unreadOnly?: boolean;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("workspace_notifications")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 20);

  if (input.unreadOnly) {
    builder = builder.is("read_at", null);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list workspace notifications: ${error.message}`);
  }
  return (data ?? []).map(mapNotification);
}

export async function createWorkspaceNotification(input: {
  workspaceId: string;
  module: string;
  type?: WorkspaceNotificationType;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_notifications")
    .insert({
      workspace_id: input.workspaceId,
      module: input.module,
      type: input.type ?? "info",
      title: input.title,
      body: input.body ?? null,
      action_url: input.actionUrl ?? null,
      created_by: input.userId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create workspace notification: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapNotification(data);
}

export async function markWorkspaceNotificationRead(input: {
  workspaceId: string;
  notificationId: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.notificationId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to mark notification read: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapNotification(data);
}

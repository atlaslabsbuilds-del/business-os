import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  NotificationCategory,
  NotificationListItem,
  NotificationPriority,
  UserNotificationPreferences,
  WorkspaceNotification,
  WorkspaceNotificationType,
} from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type NotificationRow =
  Database["public"]["Tables"]["workspace_notifications"]["Row"];
type StateRow = Database["public"]["Tables"]["user_notification_states"]["Row"];
type PreferencesRow =
  Database["public"]["Tables"]["user_notification_preferences"]["Row"];

const DEFAULT_PREFERENCES: Omit<
  UserNotificationPreferences,
  "userId" | "createdAt" | "updatedAt"
> = {
  emailNotifications: true,
  inAppNotifications: true,
  marketingEmails: false,
  productUpdates: true,
  securityAlerts: true,
  billingAlerts: true,
};

function mapNotification(row: NotificationRow): WorkspaceNotification {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    module: row.module,
    type: row.type,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    recipientUserId: row.recipient_user_id,
    readAt: row.read_at,
    createdBy: row.created_by,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPreferences(row: PreferencesRow): UserNotificationPreferences {
  return {
    userId: row.user_id,
    emailNotifications: row.email_notifications,
    inAppNotifications: row.in_app_notifications,
    marketingEmails: row.marketing_emails,
    productUpdates: row.product_updates,
    securityAlerts: row.security_alerts,
    billingAlerts: row.billing_alerts,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function categoryAllowed(
  category: string,
  prefs: UserNotificationPreferences,
): boolean {
  if (!prefs.inAppNotifications) return false;
  switch (category) {
    case "security_alert":
      return prefs.securityAlerts;
    case "billing_alert":
      return prefs.billingAlerts;
    case "system_update":
      return prefs.productUpdates;
    default:
      return true;
  }
}

async function loadUserStates(input: {
  userId: string;
  notificationIds: string[];
  client?: SupabaseClient<Database>;
}): Promise<Map<string, StateRow>> {
  if (input.notificationIds.length === 0) return new Map();
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("user_notification_states")
    .select("*")
    .eq("user_id", input.userId)
    .in("notification_id", input.notificationIds);

  if (error) {
    throw new Error(`Failed to load notification states: ${error.message}`);
  }

  return new Map((data ?? []).map((row) => [row.notification_id, row]));
}

function toListItem(
  notification: WorkspaceNotification,
  state?: StateRow,
): NotificationListItem {
  const readAt = state?.read_at ?? notification.readAt;
  return {
    ...notification,
    readAt,
    isRead: Boolean(readAt),
  };
}

export async function getUserNotificationPreferences(input: {
  userId: string;
  client?: SupabaseClient<Database>;
}): Promise<UserNotificationPreferences> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load notification preferences: ${error.message}`);
  }

  if (!data) {
    const now = new Date().toISOString();
    return {
      userId: input.userId,
      ...DEFAULT_PREFERENCES,
      createdAt: now,
      updatedAt: now,
    };
  }

  return mapPreferences(data);
}

export async function upsertUserNotificationPreferences(input: {
  userId: string;
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  marketingEmails?: boolean;
  productUpdates?: boolean;
  securityAlerts?: boolean;
  billingAlerts?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<UserNotificationPreferences> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["user_notification_preferences"]["Insert"] =
    {
      user_id: input.userId,
    };
  if (input.emailNotifications !== undefined) {
    patch.email_notifications = input.emailNotifications;
  }
  if (input.inAppNotifications !== undefined) {
    patch.in_app_notifications = input.inAppNotifications;
  }
  if (input.marketingEmails !== undefined) {
    patch.marketing_emails = input.marketingEmails;
  }
  if (input.productUpdates !== undefined) {
    patch.product_updates = input.productUpdates;
  }
  if (input.securityAlerts !== undefined) {
    patch.security_alerts = input.securityAlerts;
  }
  if (input.billingAlerts !== undefined) {
    patch.billing_alerts = input.billingAlerts;
  }

  const { data, error } = await supabase
    .from("user_notification_preferences")
    .upsert(patch, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to update notification preferences: ${error?.message ?? "Unknown"}`,
    );
  }

  return mapPreferences(data);
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

export async function listNotificationsForUser(input: {
  workspaceId: string;
  userId: string;
  query?: string;
  category?: NotificationCategory;
  unreadOnly?: boolean;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<NotificationListItem[]> {
  const supabase = await clientOrDefault(input.client);
  const prefs = await getUserNotificationPreferences({
    userId: input.userId,
    client: supabase,
  });

  let builder = supabase
    .from("workspace_notifications")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .or(`recipient_user_id.is.null,recipient_user_id.eq.${input.userId}`)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.category) {
    builder = builder.eq("category", input.category);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list notifications: ${error.message}`);
  }

  const rows = (data ?? []).map(mapNotification);
  const states = await loadUserStates({
    userId: input.userId,
    notificationIds: rows.map((row) => row.id),
    client: supabase,
  });

  const query = input.query?.trim().toLowerCase();
  let items = rows
    .filter((row) => categoryAllowed(row.category, prefs))
    .map((row) => toListItem(row, states.get(row.id)))
    .filter((row) => !states.get(row.id)?.deleted_at);

  if (query) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.body?.toLowerCase().includes(query) ?? false),
    );
  }

  if (input.unreadOnly) {
    items = items.filter((item) => !item.isRead);
  }

  return items;
}

export async function countUnreadNotificationsForUser(input: {
  workspaceId: string;
  userId: string;
  client?: SupabaseClient<Database>;
}): Promise<number> {
  const items = await listNotificationsForUser({
    workspaceId: input.workspaceId,
    userId: input.userId,
    unreadOnly: true,
    limit: 100,
    client: input.client,
  });
  return items.length;
}

export async function createWorkspaceNotification(input: {
  workspaceId: string;
  module: string;
  category?: NotificationCategory | string;
  priority?: NotificationPriority | string;
  type?: WorkspaceNotificationType;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  userId?: string | null;
  recipientUserId?: string | null;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_notifications")
    .insert({
      workspace_id: input.workspaceId,
      module: input.module,
      category: input.category ?? "system_update",
      priority: input.priority ?? "normal",
      type: input.type ?? "info",
      title: input.title,
      body: input.body ?? null,
      action_url: input.actionUrl ?? null,
      created_by: input.userId ?? null,
      recipient_user_id: input.recipientUserId ?? null,
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

export async function emitWorkspaceNotification(input: {
  workspaceId: string;
  module: string;
  category: NotificationCategory;
  title: string;
  body?: string | null;
  actionUrl?: string | null;
  userId?: string | null;
  recipientUserId?: string | null;
  priority?: NotificationPriority;
  type?: WorkspaceNotificationType;
  metadata?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification | null> {
  const typeByCategory: Partial<
    Record<NotificationCategory, WorkspaceNotificationType>
  > = {
    invoice_paid: "success",
    invoice_overdue: "warning",
    task_assigned: "task",
    kairos_suggestion: "insight",
    billing_alert: "warning",
    security_alert: "error",
  };

  const priorityByCategory: Partial<
    Record<NotificationCategory, NotificationPriority>
  > = {
    invoice_overdue: "high",
    security_alert: "urgent",
    billing_alert: "high",
    task_assigned: "high",
  };

  try {
    return await createWorkspaceNotification({
      ...input,
      type: input.type ?? typeByCategory[input.category] ?? "info",
      priority: input.priority ?? priorityByCategory[input.category] ?? "normal",
    });
  } catch {
    return null;
  }
}

async function upsertNotificationState(input: {
  userId: string;
  notificationId: string;
  readAt?: string | null;
  deletedAt?: string | null;
  client?: SupabaseClient<Database>;
}) {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["user_notification_states"]["Insert"] =
    {
      user_id: input.userId,
      notification_id: input.notificationId,
    };
  if (input.readAt !== undefined) patch.read_at = input.readAt;
  if (input.deletedAt !== undefined) patch.deleted_at = input.deletedAt;

  const { error } = await supabase
    .from("user_notification_states")
    .upsert(patch, { onConflict: "user_id,notification_id" });

  if (error) {
    throw new Error(`Failed to update notification state: ${error.message}`);
  }
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

export async function markNotificationReadForUser(input: {
  workspaceId: string;
  userId: string;
  notificationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  await upsertNotificationState({
    userId: input.userId,
    notificationId: input.notificationId,
    readAt: new Date().toISOString(),
    client: input.client,
  });
}

export async function markAllNotificationsReadForUser(input: {
  workspaceId: string;
  userId: string;
  client?: SupabaseClient<Database>;
}): Promise<number> {
  const unread = await listNotificationsForUser({
    workspaceId: input.workspaceId,
    userId: input.userId,
    unreadOnly: true,
    limit: 100,
    client: input.client,
  });

  const now = new Date().toISOString();
  await Promise.all(
    unread.map((item) =>
      upsertNotificationState({
        userId: input.userId,
        notificationId: item.id,
        readAt: now,
        client: input.client,
      }),
    ),
  );

  return unread.length;
}

export async function deleteNotificationForUser(input: {
  userId: string;
  notificationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  await upsertNotificationState({
    userId: input.userId,
    notificationId: input.notificationId,
    deletedAt: new Date().toISOString(),
    client: input.client,
  });
}

export async function deleteWorkspaceNotification(input: {
  workspaceId: string;
  notificationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("workspace_notifications")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.notificationId);

  if (error) {
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
}

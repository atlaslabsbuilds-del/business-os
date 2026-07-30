import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DeliveryQueueItem,
  Json,
  NotificationCategory,
  NotificationListItem,
  NotificationPriority,
  NotificationSection,
  NotificationTemplate,
  UserNotificationPreferences,
  WorkspaceNotification,
  WorkspaceNotificationType,
} from "@repo/types";
import { NOTIFICATION_SECTION_CATEGORIES } from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";

type NotificationRow =
  Database["public"]["Tables"]["workspace_notifications"]["Row"];
type StateRow = Database["public"]["Tables"]["user_notification_states"]["Row"];
type PreferencesRow =
  Database["public"]["Tables"]["user_notification_preferences"]["Row"];
type TemplateRow =
  Database["public"]["Tables"]["notification_templates"]["Row"];
type DeliveryRow = Database["public"]["Tables"]["delivery_queue"]["Row"];

const DEFAULT_PREFERENCES: Omit<
  UserNotificationPreferences,
  "userId" | "createdAt" | "updatedAt"
> = {
  emailNotifications: true,
  inAppNotifications: true,
  pushNotifications: true,
  browserNotifications: false,
  webhookEvents: false,
  smsNotifications: false,
  marketingEmails: false,
  productUpdates: true,
  securityAlerts: true,
  billingAlerts: true,
  quietHoursEnabled: false,
  quietHoursStart: null,
  quietHoursEnd: null,
  doNotDisturb: false,
  priorityMin: "low",
  channelOverrides: {},
};

const PRIORITY_RANK: Record<string, number> = {
  low: 0,
  normal: 1,
  high: 2,
  urgent: 3,
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
    pushNotifications: row.push_notifications,
    browserNotifications: row.browser_notifications,
    webhookEvents: row.webhook_events,
    smsNotifications: row.sms_notifications,
    marketingEmails: row.marketing_emails,
    productUpdates: row.product_updates,
    securityAlerts: row.security_alerts,
    billingAlerts: row.billing_alerts,
    quietHoursEnabled: row.quiet_hours_enabled,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    doNotDisturb: row.do_not_disturb,
    priorityMin: row.priority_min,
    channelOverrides: jsonToRecord(row.channel_overrides),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTemplate(row: TemplateRow): NotificationTemplate {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    key: row.key,
    category: row.category,
    titleTemplate: row.title_template,
    bodyTemplate: row.body_template,
    defaultPriority: row.default_priority,
    channels: row.channels ?? [],
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDelivery(row: DeliveryRow): DeliveryQueueItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    notificationId: row.notification_id,
    userId: row.user_id,
    channel: row.channel,
    status: row.status,
    attempts: row.attempts,
    scheduledFor: row.scheduled_for,
    sentAt: row.sent_at,
    lastError: row.last_error,
    payload: jsonToRecord(row.payload),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function categoryAllowed(
  category: string,
  prefs: UserNotificationPreferences,
): boolean {
  if (!prefs.inAppNotifications || prefs.doNotDisturb) return false;
  switch (category) {
    case "security_alert":
      return prefs.securityAlerts;
    case "billing_alert":
      return prefs.billingAlerts;
    case "system_update":
    case "system_alert":
      return prefs.productUpdates;
    default:
      return true;
  }
}

function meetsPriorityFloor(
  priority: string,
  prefs: UserNotificationPreferences,
): boolean {
  return (PRIORITY_RANK[priority] ?? 1) >= (PRIORITY_RANK[prefs.priorityMin] ?? 0);
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
  const archivedAt = state?.archived_at ?? null;
  return {
    ...notification,
    readAt,
    archivedAt,
    isRead: Boolean(readAt),
    isArchived: Boolean(archivedAt),
  };
}

function categoriesForSection(
  section?: NotificationSection,
): NotificationCategory[] | null {
  if (!section || section === "all" || section === "unread" || section === "settings") {
    return null;
  }
  return NOTIFICATION_SECTION_CATEGORIES[section];
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
  pushNotifications?: boolean;
  browserNotifications?: boolean;
  webhookEvents?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  productUpdates?: boolean;
  securityAlerts?: boolean;
  billingAlerts?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  doNotDisturb?: boolean;
  priorityMin?: NotificationPriority | string;
  channelOverrides?: Record<string, unknown>;
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
  if (input.pushNotifications !== undefined) {
    patch.push_notifications = input.pushNotifications;
  }
  if (input.browserNotifications !== undefined) {
    patch.browser_notifications = input.browserNotifications;
  }
  if (input.webhookEvents !== undefined) {
    patch.webhook_events = input.webhookEvents;
  }
  if (input.smsNotifications !== undefined) {
    patch.sms_notifications = input.smsNotifications;
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
  if (input.quietHoursEnabled !== undefined) {
    patch.quiet_hours_enabled = input.quietHoursEnabled;
  }
  if (input.quietHoursStart !== undefined) {
    patch.quiet_hours_start = input.quietHoursStart;
  }
  if (input.quietHoursEnd !== undefined) {
    patch.quiet_hours_end = input.quietHoursEnd;
  }
  if (input.doNotDisturb !== undefined) {
    patch.do_not_disturb = input.doNotDisturb;
  }
  if (input.priorityMin !== undefined) {
    patch.priority_min = input.priorityMin;
  }
  if (input.channelOverrides !== undefined) {
    patch.channel_overrides = input.channelOverrides as Json;
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
  priority?: NotificationPriority;
  section?: NotificationSection;
  unreadOnly?: boolean;
  archivedOnly?: boolean;
  cursor?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<NotificationListItem[]> {
  const supabase = await clientOrDefault(input.client);
  const prefs = await getUserNotificationPreferences({
    userId: input.userId,
    client: supabase,
  });

  const fetchLimit = Math.min((input.limit ?? 50) * 2, 100);
  let builder = supabase
    .from("workspace_notifications")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .or(`recipient_user_id.is.null,recipient_user_id.eq.${input.userId}`)
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (input.category) {
    builder = builder.eq("category", input.category);
  }
  if (input.priority) {
    builder = builder.eq("priority", input.priority);
  }
  if (input.cursor) {
    builder = builder.lt("created_at", input.cursor);
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
  const sectionCategories = categoriesForSection(input.section);
  const unreadOnly = input.unreadOnly || input.section === "unread";

  let items = rows
    .filter((row) => categoryAllowed(row.category, prefs))
    .filter((row) => meetsPriorityFloor(row.priority, prefs))
    .map((row) => toListItem(row, states.get(row.id)))
    .filter((row) => !states.get(row.id)?.deleted_at);

  if (input.archivedOnly) {
    items = items.filter((item) => item.isArchived);
  } else {
    items = items.filter((item) => !item.isArchived);
  }

  if (sectionCategories) {
    items = items.filter((item) =>
      sectionCategories.includes(item.category as NotificationCategory),
    );
  }

  if (query) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        (item.body?.toLowerCase().includes(query) ?? false),
    );
  }

  if (unreadOnly) {
    items = items.filter((item) => !item.isRead);
  }

  return items.slice(0, input.limit ?? 50);
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
  channels?: string[];
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

  const notification = mapNotification(data);
  const channels = input.channels ?? ["in_app"];
  await Promise.all(
    channels
      .filter((channel) => channel !== "in_app")
      .map((channel) =>
        enqueueNotificationDelivery({
          workspaceId: input.workspaceId,
          notificationId: notification.id,
          userId: input.recipientUserId ?? null,
          channel,
          payload: {
            title: notification.title,
            body: notification.body,
            actionUrl: notification.actionUrl,
          },
          client: supabase,
        }).catch(() => null),
      ),
  );

  return notification;
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
  channels?: string[];
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification | null> {
  const typeByCategory: Partial<
    Record<NotificationCategory, WorkspaceNotificationType>
  > = {
    invoice_paid: "success",
    invoice_overdue: "warning",
    task_assigned: "task",
    kairos_suggestion: "insight",
    ai_recommendation: "insight",
    billing_alert: "warning",
    security_alert: "error",
    mention: "info",
  };

  const priorityByCategory: Partial<
    Record<NotificationCategory, NotificationPriority>
  > = {
    invoice_overdue: "high",
    security_alert: "urgent",
    billing_alert: "high",
    task_assigned: "high",
    mention: "high",
    meeting_reminder: "high",
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

export async function emitKairosAlert(input: {
  workspaceId: string;
  userId?: string | null;
  recipientUserId?: string | null;
  title: string;
  body: string;
  actionUrl?: string | null;
  priority?: NotificationPriority;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceNotification | null> {
  return emitWorkspaceNotification({
    workspaceId: input.workspaceId,
    module: "kairos",
    category: "ai_recommendation",
    title: input.title,
    body: input.body,
    actionUrl: input.actionUrl,
    userId: input.userId,
    recipientUserId: input.recipientUserId,
    priority: input.priority ?? "normal",
    channels: ["in_app", "push"],
    client: input.client,
  });
}

async function upsertNotificationState(input: {
  userId: string;
  notificationId: string;
  readAt?: string | null;
  archivedAt?: string | null;
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
  if (input.archivedAt !== undefined) patch.archived_at = input.archivedAt;
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

export async function archiveNotificationForUser(input: {
  userId: string;
  notificationId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  await upsertNotificationState({
    userId: input.userId,
    notificationId: input.notificationId,
    archivedAt: new Date().toISOString(),
    readAt: new Date().toISOString(),
    client: input.client,
  });
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

export async function listNotificationTemplates(input: {
  workspaceId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<NotificationTemplate[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("notification_templates")
    .select("*")
    .order("key", { ascending: true });

  if (input.workspaceId) {
    builder = builder.or(`workspace_id.is.null,workspace_id.eq.${input.workspaceId}`);
  } else {
    builder = builder.is("workspace_id", null);
  }

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to list notification templates: ${error.message}`);
  }
  return (data ?? []).map(mapTemplate);
}

export async function enqueueNotificationDelivery(input: {
  workspaceId: string;
  notificationId?: string | null;
  userId?: string | null;
  channel: string;
  scheduledFor?: string;
  payload?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<DeliveryQueueItem> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("delivery_queue")
    .insert({
      workspace_id: input.workspaceId,
      notification_id: input.notificationId ?? null,
      user_id: input.userId ?? null,
      channel: input.channel,
      scheduled_for: input.scheduledFor ?? new Date().toISOString(),
      payload: (input.payload ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to enqueue delivery: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapDelivery(data);
}

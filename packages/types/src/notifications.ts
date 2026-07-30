import { z } from "zod";

export const notificationCategorySchema = z.enum([
  "workspace_update",
  "invoice_paid",
  "invoice_overdue",
  "new_customer",
  "new_lead",
  "task_assigned",
  "task_completed",
  "project_updated",
  "crm_activity",
  "meeting_reminder",
  "calendar_invite",
  "document_shared",
  "mention",
  "comment",
  "team_invite",
  "kairos_suggestion",
  "ai_recommendation",
  "billing_alert",
  "system_update",
  "system_alert",
  "security_alert",
  "integration_alert",
  "feedback_update",
]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const notificationPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationDeliveryChannelSchema = z.enum([
  "in_app",
  "email",
  "push",
  "browser",
  "webhook",
  "sms",
]);
export type NotificationDeliveryChannel = z.infer<
  typeof notificationDeliveryChannelSchema
>;

export const notificationSectionSchema = z.enum([
  "all",
  "unread",
  "mentions",
  "tasks",
  "projects",
  "finance",
  "crm",
  "calendar",
  "system",
  "settings",
]);
export type NotificationSection = z.infer<typeof notificationSectionSchema>;

export type UserNotificationPreferences = {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  pushNotifications: boolean;
  browserNotifications: boolean;
  webhookEvents: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  billingAlerts: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  doNotDisturb: boolean;
  priorityMin: NotificationPriority | string;
  channelOverrides: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type UserNotificationState = {
  id: string;
  userId: string;
  notificationId: string;
  readAt: string | null;
  archivedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListItem = {
  id: string;
  workspaceId: string;
  module: string;
  type: string;
  category: NotificationCategory | string;
  priority: NotificationPriority | string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  recipientUserId: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  readAt: string | null;
  archivedAt: string | null;
  isRead: boolean;
  isArchived: boolean;
};

export type NotificationTemplate = {
  id: string;
  workspaceId: string | null;
  key: string;
  category: string;
  titleTemplate: string;
  bodyTemplate: string | null;
  defaultPriority: NotificationPriority | string;
  channels: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryQueueItem = {
  id: string;
  workspaceId: string;
  notificationId: string | null;
  userId: string | null;
  channel: NotificationDeliveryChannel | string;
  status: string;
  attempts: number;
  scheduledFor: string;
  sentAt: string | null;
  lastError: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const listNotificationsSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: notificationCategorySchema.optional(),
  priority: notificationPrioritySchema.optional(),
  section: notificationSectionSchema.optional(),
  unreadOnly: z.boolean().optional(),
  archivedOnly: z.boolean().optional(),
  cursor: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const archiveNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  browserNotifications: z.boolean().optional(),
  webhookEvents: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  billingAlerts: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().nullable().optional(),
  quietHoursEnd: z.string().nullable().optional(),
  doNotDisturb: z.boolean().optional(),
  priorityMin: notificationPrioritySchema.optional(),
  channelOverrides: z.record(z.string(), z.unknown()).optional(),
});

export type ListNotificationsInput = z.infer<typeof listNotificationsSchema>;
export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  workspace_update: "Workspace",
  invoice_paid: "Invoice paid",
  invoice_overdue: "Invoice overdue",
  new_customer: "New customer",
  new_lead: "New lead",
  task_assigned: "Task assigned",
  task_completed: "Task completed",
  project_updated: "Project updated",
  crm_activity: "CRM activity",
  meeting_reminder: "Meeting reminder",
  calendar_invite: "Calendar invite",
  document_shared: "Document shared",
  mention: "Mention",
  comment: "Comment",
  team_invite: "Team invite",
  kairos_suggestion: "Kairos",
  ai_recommendation: "AI recommendation",
  billing_alert: "Billing",
  system_update: "System",
  system_alert: "System alert",
  security_alert: "Security",
  integration_alert: "Integration",
  feedback_update: "Feedback",
};

export const NOTIFICATION_SECTION_CATEGORIES: Record<
  Exclude<NotificationSection, "all" | "unread" | "settings">,
  NotificationCategory[]
> = {
  mentions: ["mention", "comment"],
  tasks: ["task_assigned", "task_completed"],
  projects: ["project_updated"],
  finance: ["invoice_paid", "invoice_overdue", "billing_alert"],
  crm: ["crm_activity", "new_customer", "new_lead"],
  calendar: ["meeting_reminder", "calendar_invite"],
  system: [
    "system_update",
    "system_alert",
    "security_alert",
    "integration_alert",
    "kairos_suggestion",
    "ai_recommendation",
    "workspace_update",
    "team_invite",
    "document_shared",
    "feedback_update",
  ],
};

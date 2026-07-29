import { z } from "zod";

export const notificationCategorySchema = z.enum([
  "workspace_update",
  "invoice_paid",
  "invoice_overdue",
  "new_customer",
  "new_lead",
  "task_assigned",
  "team_invite",
  "kairos_suggestion",
  "billing_alert",
  "system_update",
  "security_alert",
]);
export type NotificationCategory = z.infer<typeof notificationCategorySchema>;

export const notificationPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export type UserNotificationPreferences = {
  userId: string;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  securityAlerts: boolean;
  billingAlerts: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserNotificationState = {
  id: string;
  userId: string;
  notificationId: string;
  readAt: string | null;
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
  isRead: boolean;
};

export const listNotificationsSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: notificationCategorySchema.optional(),
  unreadOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const deleteNotificationSchema = z.object({
  notificationId: z.string().uuid(),
});

export const updateNotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  billingAlerts: z.boolean().optional(),
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
  team_invite: "Team invite",
  kairos_suggestion: "Kairos",
  billing_alert: "Billing",
  system_update: "System",
  security_alert: "Security",
};

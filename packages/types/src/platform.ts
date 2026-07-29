import { z } from "zod";
import type { NotificationListItem } from "./notifications";

export const platformModuleSchema = z.enum([
  "dashboard",
  "content",
  "social",
  "website",
  "calendar",
  "leads",
  "client_portal",
  "finance",
  "digital_products",
  "email_marketing",
  "community",
  "ai_studio",
  "analytics",
  "workspace",
  "crm",
  "inbox",
  "chat",
  "billing",
  "assistant",
]);
export type PlatformModule = z.infer<typeof platformModuleSchema>;

export const workspaceNotificationTypeSchema = z.enum([
  "info",
  "success",
  "warning",
  "error",
  "task",
  "insight",
]);
export type WorkspaceNotificationType = z.infer<
  typeof workspaceNotificationTypeSchema
>;

export type WorkspaceNotification = {
  id: string;
  workspaceId: string;
  module: PlatformModule | string;
  type: WorkspaceNotificationType | string;
  category: string;
  priority: string;
  title: string;
  body: string | null;
  actionUrl: string | null;
  recipientUserId: string | null;
  readAt: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceActivityEvent = {
  id: string;
  workspaceId: string;
  module: PlatformModule | string;
  eventType: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  actorId: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type WorkspaceAiMemory = {
  id: string;
  workspaceId: string;
  sourceModule: PlatformModule | string;
  scope: string;
  fact: string;
  summary: string | null;
  importance: number;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DashboardInsight = {
  title: string;
  body: string;
  module: string;
  severity: "info" | "success" | "warning";
  actionUrl: string;
};

export type DashboardConversationItem = {
  id: string;
  title: string;
  model: string;
  provider: string;
  pinned: boolean;
  updatedAt: string;
  href: string;
};

export type DashboardLeadItem = {
  id: string;
  name: string;
  email: string | null;
  stage: string;
  source: string | null;
  updatedAt: string;
  href: string;
};

export type DashboardDealItem = {
  id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  href: string;
};

export type DashboardPipelineStage = {
  stage: string;
  count: number;
  value: number;
};

export type DashboardContentItem = {
  id: string;
  title: string;
  kind: "thread" | "draft" | "summary";
  subtitle: string;
  href: string;
  updatedAt: string;
};

export type DashboardAgendaItem = {
  id: string;
  title: string;
  kind: "task" | "event";
  at: string | null;
  href: string;
};

export type DashboardSnapshot = {
  workspace: {
    name: string;
    members: number;
    workspaces: number;
    pendingInvites: number;
    role: string;
  };
  kpis: {
    revenue: number;
    revenueToday: number;
    newCustomersToday: number;
    leads: number;
    openTasks: number;
    upcomingEvents: number;
    aiCredits: number;
    unread: number;
    openDeals: number;
  };
  today: {
    revenue: number;
    newCustomers: number;
    pendingTasks: number;
    meetings: number;
  };
  crm: {
    contacts: number;
    companies: number;
    openDeals: number;
    pipelineValue: number;
    activities: number;
    wonDeals: number;
    wonValue: number;
  };
  inbox: {
    unread: number;
    openThreads: number;
    openTasks: number;
    upcomingMeetings: number;
  };
  chat: {
    conversations: number;
  };
  finance: {
    pipelineValue: number;
    openDeals: number;
    wonDeals: number;
    wonValue: number;
    aiCredits: number;
    recentCredits: Array<{
      id: string;
      amount: number;
      reason: string;
      createdAt: string;
    }>;
  };
  growth: {
    contacts: number;
    companies: number;
    leads: number;
    openDeals: number;
    conversations: number;
    unread: number;
    members: number;
  };
  content: {
    aiDrafts: number;
    summarizedThreads: number;
    unreadThreads: number;
    items: DashboardContentItem[];
  };
  pipeline: DashboardPipelineStage[];
  leads: DashboardLeadItem[];
  deals: DashboardDealItem[];
  conversations: DashboardConversationItem[];
  agenda: DashboardAgendaItem[];
  notifications: NotificationListItem[];
  activity: WorkspaceActivityEvent[];
  memory: WorkspaceAiMemory[];
  insights: DashboardInsight[];
  tasks: Array<{
    id: string;
    title: string;
    dueAt: string | null;
    actionUrl: string;
  }>;
  events: Array<{
    id: string;
    title: string;
    startsAt: string;
    actionUrl: string;
  }>;
};

export const createWorkspaceNotificationSchema = z.object({
  module: z.string().trim().min(1).max(80),
  type: workspaceNotificationTypeSchema.default("info"),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(1000).optional().nullable(),
  actionUrl: z.string().trim().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const markWorkspaceNotificationReadSchema = z.object({
  notificationId: z.string().uuid(),
});

export const createWorkspaceActivityEventSchema = z.object({
  module: z.string().trim().min(1).max(80),
  eventType: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().max(1000).optional().nullable(),
  entityType: z.string().trim().max(120).optional().nullable(),
  entityId: z.string().uuid().optional().nullable(),
  actionUrl: z.string().trim().max(500).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createWorkspaceAiMemorySchema = z.object({
  sourceModule: z.string().trim().min(1).max(80).default("assistant"),
  scope: z.string().trim().min(1).max(80).default("workspace"),
  fact: z.string().trim().min(1).max(4000),
  summary: z.string().trim().max(1000).optional().nullable(),
  importance: z.number().int().min(1).max(5).default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWorkspaceNotificationInput = z.infer<
  typeof createWorkspaceNotificationSchema
>;
export type CreateWorkspaceActivityEventInput = z.infer<
  typeof createWorkspaceActivityEventSchema
>;
export type CreateWorkspaceAiMemoryInput = z.infer<
  typeof createWorkspaceAiMemorySchema
>;

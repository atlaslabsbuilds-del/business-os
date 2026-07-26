import { z } from "zod";

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
  title: string;
  body: string | null;
  actionUrl: string | null;
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

export type DashboardSnapshot = {
  workspace: {
    members: number;
    workspaces: number;
    pendingInvites: number;
    role: string;
  };
  kpis: {
    revenue: number;
    leads: number;
    openTasks: number;
    upcomingEvents: number;
    aiCredits: number;
  };
  crm: {
    contacts: number;
    companies: number;
    openDeals: number;
    pipelineValue: number;
    activities: number;
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
  notifications: WorkspaceNotification[];
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

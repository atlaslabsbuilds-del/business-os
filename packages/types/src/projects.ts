import { z } from "zod";

export const projectStatusSchema = z.enum([
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
]);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;

export const projectPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "urgent",
]);
export type ProjectPriority = z.infer<typeof projectPrioritySchema>;

export const projectTaskStatusSchema = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "review",
  "completed",
]);
export type ProjectTaskStatus = z.infer<typeof projectTaskStatusSchema>;

export type Project = {
  id: string;
  workspaceId: string;
  createdBy: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  tags: string[];
  teamName: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectTask = {
  id: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  assigneeId: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectPriority;
  dueAt: string | null;
  startAt: string | null;
  completedAt: string | null;
  estimateHours: number | null;
  progress: number;
  position: number;
  dependsOn: string[];
  checklist: Array<{ id: string; text: string; done: boolean }>;
  isMilestone: boolean;
  isRecurring: boolean;
  recurrenceRule: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectSubtask = {
  id: string;
  workspaceId: string;
  taskId: string;
  createdBy: string;
  title: string;
  isDone: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ProjectMember = {
  id: string;
  workspaceId: string;
  projectId: string;
  userId: string;
  role: "owner" | "manager" | "member" | "viewer";
  createdAt: string;
};

export type ProjectLabel = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectComment = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  taskId: string | null;
  createdBy: string;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectTimeLog = {
  id: string;
  workspaceId: string;
  projectId: string;
  taskId: string | null;
  userId: string;
  hours: number;
  note: string | null;
  loggedOn: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectReport = {
  id: string;
  workspaceId: string;
  projectId: string | null;
  createdBy: string;
  reportType: string;
  title: string;
  summary: string | null;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProjectSettings = {
  workspaceId: string;
  customStages: string[];
  defaultPriority: ProjectPriority;
  automationRules: Array<Record<string, unknown>>;
  permissions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ProjectDashboardStats = {
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  todayTasks: number;
  upcomingDeadlines: number;
  teamProductivity: number;
  averageProgress: number;
};

export type ProjectReportSnapshot = {
  healthScore: number;
  completionRate: number;
  velocity: number;
  totalHours: number;
  tasksByStatus: Array<{ status: ProjectTaskStatus; count: number }>;
  burndown: Array<{ day: string; remaining: number; completed: number }>;
};

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(8000).optional().nullable(),
  status: projectStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  teamName: z.string().trim().max(120).optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.string().uuid(),
  progress: z.number().int().min(0).max(100).optional(),
  isArchived: z.boolean().optional(),
});

export const createProjectTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(8000).optional().nullable(),
  status: projectTaskStatusSchema.optional(),
  priority: projectPrioritySchema.optional(),
  dueAt: z.string().optional().nullable(),
  startAt: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  estimateHours: z.number().min(0).optional().nullable(),
  isMilestone: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  dependsOn: z.array(z.string().uuid()).optional(),
});

export const updateProjectTaskSchema = createProjectTaskSchema
  .omit({ projectId: true })
  .partial()
  .extend({
    id: z.string().uuid(),
    progress: z.number().int().min(0).max(100).optional(),
    completedAt: z.string().optional().nullable(),
    checklist: z
      .array(
        z.object({
          id: z.string(),
          text: z.string(),
          done: z.boolean(),
        }),
      )
      .optional(),
  });

export const createSubtaskSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
});

export const updateProjectSettingsSchema = z.object({
  customStages: z.array(z.string().trim().min(1).max(40)).optional(),
  defaultPriority: projectPrioritySchema.optional(),
  automationRules: z.array(z.record(z.string(), z.unknown())).optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

export const createTimeLogSchema = z.object({
  projectId: z.string().uuid(),
  taskId: z.string().uuid().optional().nullable(),
  hours: z.number().min(0.1).max(24),
  note: z.string().trim().max(1000).optional().nullable(),
  loggedOn: z.string().optional(),
});

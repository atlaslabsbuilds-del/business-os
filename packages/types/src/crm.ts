import { z } from "zod";

export const crmLifecycleStageSchema = z.enum([
  "lead",
  "qualified",
  "customer",
  "churned",
  "other",
]);
export type CrmLifecycleStage = z.infer<typeof crmLifecycleStageSchema>;

export const crmDealStageSchema = z.enum([
  "lead",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost",
]);
export type CrmDealStage = z.infer<typeof crmDealStageSchema>;

export const crmActivityTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "task",
  "note",
  "other",
]);
export type CrmActivityType = z.infer<typeof crmActivityTypeSchema>;

export const crmEntityTypeSchema = z.enum([
  "contact",
  "company",
  "deal",
  "lead",
]);
export type CrmEntityType = z.infer<typeof crmEntityTypeSchema>;

export type CrmCompany = {
  id: string;
  workspaceId: string;
  name: string;
  domain: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  description: string | null;
  employeeCount: number | null;
  annualRevenue: number | null;
  ownerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmContact = {
  id: string;
  workspaceId: string;
  companyId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  lifecycleStage: CrmLifecycleStage;
  source: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  ownerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmDeal = {
  id: string;
  workspaceId: string;
  companyId: string | null;
  contactId: string | null;
  title: string;
  amount: number;
  currency: string;
  stage: CrmDealStage;
  probability: number;
  expectedCloseDate: string | null;
  products: string[];
  notes: string | null;
  ownerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmActivity = {
  id: string;
  workspaceId: string;
  type: CrmActivityType;
  subject: string;
  body: string | null;
  dueAt: string | null;
  completedAt: string | null;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  ownerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmNote = {
  id: string;
  workspaceId: string;
  body: string;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmTag = {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmTagging = {
  id: string;
  workspaceId: string;
  tagId: string;
  entityType: CrmEntityType;
  entityId: string;
  createdAt: string;
};

export type CrmTimelineItem =
  | { kind: "activity"; item: CrmActivity }
  | { kind: "note"; item: CrmNote }
  | { kind: "deal"; item: CrmDeal };

export type CrmDashboardStats = {
  contacts: number;
  companies: number;
  leads: number;
  qualifiedLeads: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  pipelineValue: number;
  conversionRate: number;
  salesThisMonth: number;
  activities: number;
};

export type CrmTask = {
  id: string;
  workspaceId: string;
  createdBy: string;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueAt: string | null;
  reminderAt: string | null;
  assigneeId: string | null;
  contactId: string | null;
  companyId: string | null;
  dealId: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CrmPipeline = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmPipelineStage = {
  id: string;
  workspaceId: string;
  pipelineId: string;
  name: string;
  slug: string;
  position: number;
  probability: number;
  isWon: boolean;
  isLost: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmSettings = {
  workspaceId: string;
  leadSources: string[];
  customFields: Array<Record<string, unknown>>;
  automationRules: Array<Record<string, unknown>>;
  defaultPipelineId: string | null;
  permissions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CrmReportSnapshot = {
  wonValue: number;
  lostValue: number;
  openValue: number;
  winRate: number;
  dealsByStage: Array<{ stage: CrmDealStage; count: number; value: number }>;
  salesByMonth: Array<{ month: string; won: number; lost: number }>;
};

export const crmPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type CrmPriority = z.infer<typeof crmPrioritySchema>;

export const crmTaskStatusSchema = z.enum([
  "open",
  "in_progress",
  "done",
  "cancelled",
]);
export type CrmTaskStatus = z.infer<typeof crmTaskStatusSchema>;

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(160),
  domain: z.string().trim().max(160).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  website: z.string().trim().max(240).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
  employeeCount: z.number().int().min(0).optional().nullable(),
  annualRevenue: z.number().min(0).optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.string().uuid(),
});

export const createContactSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional(),
  phone: z.string().trim().max(60).optional().nullable(),
  title: z.string().trim().max(120).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  lifecycleStage: crmLifecycleStageSchema.optional(),
  source: z.string().trim().max(120).optional().nullable(),
  priority: crmPrioritySchema.optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  id: z.string().uuid(),
});

export const createLeadSchema = createContactSchema.extend({
  lifecycleStage: z.literal("lead").optional().default("lead"),
});

export const createDealSchema = z.object({
  title: z.string().trim().min(1).max(200),
  amount: z.number().min(0).optional().default(0),
  currency: z.string().trim().min(3).max(8).optional().default("USD"),
  stage: crmDealStageSchema.optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  products: z.array(z.string().trim().min(1).max(120)).optional(),
  notes: z.string().trim().max(8000).optional().nullable(),
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
});

export const createCrmTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  status: crmTaskStatusSchema.optional(),
  priority: crmPrioritySchema.optional(),
  dueAt: z.string().optional().nullable(),
  reminderAt: z.string().optional().nullable(),
  assigneeId: z.string().uuid().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
});

export const updateCrmTaskSchema = createCrmTaskSchema.partial().extend({
  id: z.string().uuid(),
  completedAt: z.string().optional().nullable(),
});

export const createPipelineStageSchema = z.object({
  pipelineId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1).max(80).optional(),
  position: z.number().int().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  color: z.string().trim().max(20).optional(),
  isWon: z.boolean().optional(),
  isLost: z.boolean().optional(),
});

export const updateCrmSettingsSchema = z.object({
  leadSources: z.array(z.string().trim().min(1).max(80)).optional(),
  customFields: z.array(z.record(z.string(), z.unknown())).optional(),
  automationRules: z.array(z.record(z.string(), z.unknown())).optional(),
  defaultPipelineId: z.string().uuid().optional().nullable(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

export const createActivitySchema = z.object({
  type: crmActivityTypeSchema.optional().default("task"),
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().max(8000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  id: z.string().uuid(),
  completedAt: z.string().optional().nullable(),
});

export const createNoteSchema = z.object({
  body: z.string().trim().min(1).max(8000),
  contactId: z.string().uuid().optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().max(20).optional(),
});

export const assignTagSchema = z.object({
  tagId: z.string().uuid(),
  entityType: crmEntityTypeSchema,
  entityId: z.string().uuid(),
});

export const crmSearchSchema = z.object({
  query: z.string().trim().max(160).optional(),
  stage: crmLifecycleStageSchema.optional(),
  dealStage: crmDealStageSchema.optional(),
  companyId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
});

export const deleteCrmEntitySchema = z.object({
  id: z.string().uuid(),
});

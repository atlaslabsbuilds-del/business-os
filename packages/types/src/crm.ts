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
  openDeals: number;
  pipelineValue: number;
  activities: number;
};

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(160),
  domain: z.string().trim().max(160).optional().nullable(),
  industry: z.string().trim().max(120).optional().nullable(),
  website: z.string().trim().max(240).optional().nullable(),
  phone: z.string().trim().max(60).optional().nullable(),
  description: z.string().trim().max(4000).optional().nullable(),
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
});

export const updateDealSchema = createDealSchema.partial().extend({
  id: z.string().uuid(),
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

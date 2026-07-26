import { z } from "zod";

export const kairosAgentIdSchema = z.enum([
  "sales",
  "marketing",
  "content",
  "support",
  "finance",
  "operations",
  "analytics",
  "hr",
]);
export type KairosAgentId = z.infer<typeof kairosAgentIdSchema>;

export type WorkspaceAiSettings = {
  workspaceId: string;
  memoryEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KairosAgentRun = {
  id: string;
  workspaceId: string;
  agentId: KairosAgentId | string;
  title: string;
  prompt: string;
  status: "queued" | "running" | "completed" | "failed" | string;
  resultSummary: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AiOutputVersion = {
  id: string;
  workspaceId: string;
  entityType: string;
  entityId: string | null;
  title: string;
  content: string;
  versionNumber: number;
  isCurrent: boolean;
  createdBy: string | null;
  parentVersionId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceOnboardingProgress = {
  workspaceId: string;
  completedSteps: string[];
  celebratedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceAiSuggestion = {
  id: string;
  workspaceId: string;
  module: string;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  severity: "info" | "success" | "warning" | string;
  dismissedAt: string | null;
  createdBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export const updateWorkspaceAiMemorySchema = z.object({
  memoryId: z.string().uuid(),
  fact: z.string().trim().min(1).max(4000).optional(),
  summary: z.string().trim().max(1000).optional().nullable(),
  importance: z.number().int().min(1).max(5).optional(),
  scope: z.string().trim().min(1).max(80).optional(),
});

export const deleteWorkspaceAiMemorySchema = z.object({
  memoryId: z.string().uuid(),
});

export const setWorkspaceMemoryEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const createKairosAgentRunSchema = z.object({
  agentId: kairosAgentIdSchema,
  prompt: z.string().trim().min(1).max(4000),
  title: z.string().trim().min(1).max(160).optional(),
});

export const createAiOutputVersionSchema = z.object({
  entityType: z.string().trim().min(1).max(80),
  entityId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(50000),
  parentVersionId: z.string().uuid().optional().nullable(),
});

export const renameAiOutputVersionSchema = z.object({
  versionId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
});

export const restoreAiOutputVersionSchema = z.object({
  versionId: z.string().uuid(),
});

export const completeOnboardingStepSchema = z.object({
  stepId: z.string().trim().min(1).max(80),
});

export const dismissAiSuggestionSchema = z.object({
  suggestionId: z.string().uuid(),
});

export type UpdateWorkspaceAiMemoryInput = z.infer<
  typeof updateWorkspaceAiMemorySchema
>;
export type CreateKairosAgentRunInput = z.infer<typeof createKairosAgentRunSchema>;
export type CreateAiOutputVersionInput = z.infer<
  typeof createAiOutputVersionSchema
>;

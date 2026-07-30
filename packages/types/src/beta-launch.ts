import { z } from "zod";

export const workspaceTemplateKeySchema = z.enum([
  "startup",
  "agency",
  "saas",
  "marketing",
  "sales",
  "operations",
  "consulting",
  "blank",
]);
export type WorkspaceTemplateKey = z.infer<typeof workspaceTemplateKeySchema>;

export const betaEventCategorySchema = z.enum([
  "signup",
  "activation",
  "retention",
  "feature_usage",
  "ai_usage",
  "workspace_creation",
  "conversion",
  "support",
]);
export type BetaEventCategory = z.infer<typeof betaEventCategorySchema>;

export type WorkspaceBetaLaunchProfile = {
  workspaceId: string;
  templateKey: WorkspaceTemplateKey | string;
  launchStage: string;
  demoDataSeededAt: string | null;
  checklist: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BetaAnalyticsEvent = {
  id: string;
  workspaceId: string | null;
  userId: string | null;
  eventName: string;
  eventCategory: BetaEventCategory | string;
  source: string;
  path: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type BetaReleaseNote = {
  id: string;
  version: string;
  title: string;
  summary: string;
  highlights: string[];
  publishedAt: string;
  createdAt: string;
};

export const trackBetaAnalyticsEventSchema = z.object({
  eventName: z.string().trim().min(1).max(120),
  eventCategory: betaEventCategorySchema.default("feature_usage"),
  path: z.string().trim().max(300).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const upsertWorkspaceBetaProfileSchema = z.object({
  templateKey: workspaceTemplateKeySchema.default("blank"),
  launchStage: z.enum(["setup", "activated", "ready", "launched"]).default("setup"),
  checklist: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const seedDemoWorkspaceSchema = z.object({
  templateKey: workspaceTemplateKeySchema.default("startup"),
});

export type TrackBetaAnalyticsEventInput = z.infer<
  typeof trackBetaAnalyticsEventSchema
>;
export type UpsertWorkspaceBetaProfileInput = z.infer<
  typeof upsertWorkspaceBetaProfileSchema
>;

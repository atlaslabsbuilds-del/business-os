import { z } from "zod";

export const contentTypeSchema = z.enum([
  "linkedin",
  "instagram",
  "twitter",
  "threads",
  "blog",
  "email",
  "carousel",
]);
export type ContentType = z.infer<typeof contentTypeSchema>;

export const contentStatusSchema = z.enum([
  "draft",
  "scheduled",
  "published",
  "archived",
]);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

export type ContentAnalytics = {
  views: number;
  engagement: number;
  reach: number;
  clicks: number;
};

export type ContentItem = {
  id: string;
  workspaceId: string;
  createdBy: string;
  title: string;
  body: string;
  contentType: ContentType | string;
  status: ContentStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  tags: string[];
  aiGenerated: boolean;
  sourceItemId: string | null;
  analytics: ContentAnalytics;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ContentBrandVoice = {
  id: string;
  workspaceId: string;
  createdBy: string;
  tone: string;
  writingStyle: string;
  ctaPreferences: string;
  keywords: string[];
  audienceProfile: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentAsset = {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  assetType: string;
  url: string | null;
  storagePath: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type ContentTemplate = {
  id: string;
  workspaceId: string | null;
  createdBy: string | null;
  name: string;
  templateType: string;
  body: string;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ContentDashboardStats = {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;
  aiSuggestions: number;
  views: number;
  engagement: number;
  reach: number;
  clicks: number;
};

export const createContentItemSchema = z.object({
  title: z.string().trim().min(1).max(180).default("Untitled content"),
  body: z.string().max(50000).default(""),
  contentType: contentTypeSchema.default("linkedin"),
  status: contentStatusSchema.default("draft"),
  scheduledAt: z.string().datetime().optional().nullable(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  aiGenerated: z.boolean().optional(),
});

export const updateContentItemSchema = createContentItemSchema.partial().extend({
  id: z.string().uuid(),
});

export const generateContentSchema = z.object({
  contentType: contentTypeSchema,
  prompt: z.string().trim().min(3).max(4000),
});

export const updateBrandVoiceSchema = z.object({
  tone: z.string().max(500),
  writingStyle: z.string().max(1000),
  ctaPreferences: z.string().max(1000),
  keywords: z.array(z.string().trim().max(80)).max(50),
  audienceProfile: z.string().max(2000),
});

export type CreateContentItemInput = z.infer<typeof createContentItemSchema>;
export type UpdateContentItemInput = z.infer<typeof updateContentItemSchema>;
export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type UpdateBrandVoiceInput = z.infer<typeof updateBrandVoiceSchema>;

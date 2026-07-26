import { z } from "zod";

export const socialPlatformSchema = z.enum([
  "instagram",
  "linkedin",
  "twitter",
  "facebook",
  "youtube",
]);
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;

export const socialPostStatusSchema = z.enum([
  "draft",
  "queued",
  "scheduled",
  "published",
  "failed",
]);
export type SocialPostStatus = z.infer<typeof socialPostStatusSchema>;

export const socialApprovalStatusSchema = z.enum([
  "not_required",
  "pending",
  "approved",
  "rejected",
]);
export type SocialApprovalStatus = z.infer<typeof socialApprovalStatusSchema>;

export type SocialAccount = {
  id: string;
  workspaceId: string;
  platform: SocialPlatform;
  handle: string;
  displayName: string | null;
  status: "connected" | "disconnected" | "error";
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SocialPostAnalytics = {
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  clicks: number;
};

export type SocialPost = {
  id: string;
  workspaceId: string;
  createdBy: string;
  assignedTo: string | null;
  sourceContentId: string | null;
  title: string;
  body: string;
  media: unknown[];
  platforms: SocialPlatform[];
  status: SocialPostStatus;
  approvalStatus: SocialApprovalStatus;
  scheduledAt: string | null;
  publishedAt: string | null;
  failureReason: string | null;
  analytics: SocialPostAnalytics;
  createdAt: string;
  updatedAt: string;
};

export type SocialEngagement = {
  id: string;
  workspaceId: string;
  accountId: string | null;
  postId: string | null;
  engagementType: "comment" | "mention" | "message";
  authorName: string | null;
  body: string;
  status: "open" | "replied" | "archived";
  replySuggestion: string | null;
  createdAt: string;
};

export type SocialAnalytics = {
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
  clicks: number;
};

export type SocialDashboardStats = SocialAnalytics & {
  accounts: number;
  connectedAccounts: number;
  totalPosts: number;
  drafts: number;
  queued: number;
  scheduled: number;
  published: number;
  failed: number;
  openEngagement: number;
};

export const createSocialPostSchema = z.object({
  title: z.string().trim().min(1).max(180).default("Untitled social post"),
  body: z.string().max(30000).default(""),
  platforms: z.array(socialPlatformSchema).min(1).max(5),
  status: socialPostStatusSchema.default("draft"),
  scheduledAt: z.string().datetime().optional().nullable(),
  assignedTo: z.string().uuid().optional().nullable(),
});

export const updateSocialPostSchema = createSocialPostSchema.partial().extend({
  id: z.string().uuid(),
});

export const generateSocialSchema = z.object({
  platform: socialPlatformSchema,
  prompt: z.string().trim().min(3).max(3000),
});

export type CreateSocialPostInput = z.infer<typeof createSocialPostSchema>;
export type UpdateSocialPostInput = z.infer<typeof updateSocialPostSchema>;
export type GenerateSocialInput = z.infer<typeof generateSocialSchema>;

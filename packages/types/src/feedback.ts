import { z } from "zod";

export const feedbackCategorySchema = z.enum([
  "feature_request",
  "bug_report",
  "improvement",
  "general",
]);
export type FeedbackCategory = z.infer<typeof feedbackCategorySchema>;

export const feedbackPrioritySchema = z.enum([
  "low",
  "normal",
  "high",
  "urgent",
]);
export type FeedbackPriority = z.infer<typeof feedbackPrioritySchema>;

export const feedbackStatusSchema = z.enum([
  "submitted",
  "in_review",
  "planned",
  "in_progress",
  "completed",
  "rejected",
]);
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  feature_request: "Feature Request",
  bug_report: "Bug Report",
  improvement: "Improvement",
  general: "General Feedback",
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  rejected: "Rejected",
};

export const FEEDBACK_PRIORITY_LABELS: Record<FeedbackPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const ROADMAP_STATUSES = [
  "planned",
  "in_progress",
  "completed",
] as const satisfies readonly FeedbackStatus[];

export type FeedbackItem = {
  id: string;
  workspaceId: string;
  createdBy: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  screenshotPath: string | null;
  assigneeId: string | null;
  voteCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  reporterName?: string | null;
  reporterEmail?: string | null;
  assigneeName?: string | null;
  hasVoted?: boolean;
};

export type FeedbackVote = {
  id: string;
  feedbackId: string;
  userId: string;
  createdAt: string;
};

export const createFeedbackSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(5000),
  category: feedbackCategorySchema,
  priority: feedbackPrioritySchema.default("normal"),
});

export const updateFeedbackStatusSchema = z.object({
  feedbackId: z.string().uuid(),
  status: feedbackStatusSchema,
  assigneeId: z.string().uuid().nullable().optional(),
});

export const listFeedbackSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: feedbackCategorySchema.optional(),
  status: feedbackStatusSchema.optional(),
  priority: feedbackPrioritySchema.optional(),
  mineOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const voteFeedbackSchema = z.object({
  feedbackId: z.string().uuid(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackStatusInput = z.infer<typeof updateFeedbackStatusSchema>;
export type ListFeedbackInput = z.infer<typeof listFeedbackSchema>;

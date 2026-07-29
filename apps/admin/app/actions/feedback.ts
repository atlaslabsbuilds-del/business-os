"use server";

import { requireAdmin } from "@repo/auth/server";
import {
  listAllFeedbackForAdmin,
  updateFeedbackItem,
} from "@repo/database/feedback";
import { emitWorkspaceNotification } from "@repo/database/notifications";
import {
  FEEDBACK_STATUS_LABELS,
  feedbackCategorySchema,
  feedbackPrioritySchema,
  feedbackStatusSchema,
  updateFeedbackStatusSchema,
  type FeedbackItem,
} from "@repo/types";
import { z } from "zod";

export type AdminFeedbackResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const adminListSchema = z.object({
  query: z.string().trim().max(120).optional(),
  category: feedbackCategorySchema.optional(),
  status: feedbackStatusSchema.optional(),
  priority: feedbackPrioritySchema.optional(),
});

export async function listAdminFeedbackAction(
  input?: unknown,
): Promise<AdminFeedbackResult<{ items: FeedbackItem[] }>> {
  await requireAdmin();
  const parsed = adminListSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const items = await listAllFeedbackForAdmin(parsed.data);
    return { ok: true, data: { items } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load feedback",
    };
  }
}

export async function updateAdminFeedbackAction(
  input: unknown,
): Promise<AdminFeedbackResult<{ item: FeedbackItem }>> {
  const admin = await requireAdmin();
  const parsed = updateFeedbackStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const beforeList = await listAllFeedbackForAdmin({ limit: 200 });
    const before = beforeList.find((item) => item.id === parsed.data.feedbackId);

    const item = await updateFeedbackItem({
      feedbackId: parsed.data.feedbackId,
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId,
      useAdmin: true,
    });

    if (before && before.status !== item.status) {
      await emitWorkspaceNotification({
        workspaceId: item.workspaceId,
        module: "feedback",
        category: "feedback_update",
        title: `Feedback ${FEEDBACK_STATUS_LABELS[item.status].toLowerCase()}`,
        body: `"${item.title}" is now ${FEEDBACK_STATUS_LABELS[item.status]}.`,
        actionUrl: "/feedback",
        userId: admin.id,
        recipientUserId: item.createdBy,
        metadata: {
          feedbackId: item.id,
          from: before.status,
          to: item.status,
        },
      });
    }

    return { ok: true, data: { item } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update feedback",
    };
  }
}

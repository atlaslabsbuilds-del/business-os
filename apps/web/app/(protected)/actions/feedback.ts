"use server";

import { getUser } from "@repo/auth/server";
import { createAdminClient } from "@repo/database/admin";
import {
  createFeedbackItem,
  getFeedbackStats,
  listFeedbackItems,
  listRoadmapFeedback,
  updateFeedbackItem,
  voteOnFeedback,
} from "@repo/database/feedback";
import { emitWorkspaceNotification } from "@repo/database/notifications";
import { getMembershipRole } from "@repo/database/workspace";
import {
  createFeedbackSchema,
  FEEDBACK_STATUS_LABELS,
  listFeedbackSchema,
  updateFeedbackStatusSchema,
  voteFeedbackSchema,
  type FeedbackItem,
  type FeedbackStatus,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type FeedbackActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    role,
  };
}

export async function listFeedbackAction(
  input?: unknown,
): Promise<
  FeedbackActionResult<{
    items: FeedbackItem[];
    stats: Record<FeedbackStatus, number>;
  }>
> {
  const parsed = listFeedbackSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireContext();
    const [items, stats] = await Promise.all([
      listFeedbackItems({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        ...parsed.data,
      }),
      getFeedbackStats({
        workspaceId: ctx.workspaceId,
        userId: parsed.data.mineOnly ? ctx.userId : undefined,
      }),
    ]);
    return { ok: true, data: { items, stats } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load feedback",
    };
  }
}

export async function createFeedbackAction(input: {
  title: string;
  description: string;
  category: string;
  priority: string;
  screenshot?: File | null;
}): Promise<FeedbackActionResult<{ item: FeedbackItem }>> {
  const parsed = createFeedbackSchema.safeParse({
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    let screenshotPath: string | null = null;

    if (input.screenshot && input.screenshot.size > 0) {
      if (input.screenshot.size > 8 * 1024 * 1024) {
        return { ok: false, error: "Screenshot must be 8MB or smaller." };
      }
      if (
        !input.screenshot.type.startsWith("image/") &&
        input.screenshot.type !== "application/pdf"
      ) {
        return { ok: false, error: "Screenshots must be an image or PDF." };
      }
      const safeName = input.screenshot.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      screenshotPath = `${ctx.workspaceId}/${crypto.randomUUID()}-${safeName}`;
      const admin = createAdminClient();
      const upload = await admin.storage
        .from("feedback-screenshots")
        .upload(screenshotPath, input.screenshot, {
          contentType: input.screenshot.type,
          upsert: false,
        });
      if (upload.error) {
        return { ok: false, error: "Screenshot upload failed. Please try again." };
      }
    }

    const item = await createFeedbackItem({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      priority: parsed.data.priority,
      screenshotPath,
    });

    await emitWorkspaceNotification({
      workspaceId: ctx.workspaceId,
      module: "feedback",
      category: "feedback_update",
      title: "Feedback submitted",
      body: item.title,
      actionUrl: "/feedback",
      userId: ctx.userId,
      recipientUserId: ctx.userId,
      metadata: { feedbackId: item.id },
    });

    return { ok: true, data: { item } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to submit feedback",
    };
  }
}

export async function updateFeedbackStatusAction(
  input: unknown,
): Promise<FeedbackActionResult<{ item: FeedbackItem }>> {
  const parsed = updateFeedbackStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    if (ctx.role !== "owner" && ctx.role !== "admin") {
      return { ok: false, error: "Only workspace admins can update feedback status." };
    }

    const before = (
      await listFeedbackItems({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        limit: 200,
      })
    ).find((item) => item.id === parsed.data.feedbackId);

    const item = await updateFeedbackItem({
      workspaceId: ctx.workspaceId,
      feedbackId: parsed.data.feedbackId,
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId,
    });

    if (before && before.status !== item.status) {
      await emitWorkspaceNotification({
        workspaceId: ctx.workspaceId,
        module: "feedback",
        category: "feedback_update",
        title: `Feedback ${FEEDBACK_STATUS_LABELS[item.status].toLowerCase()}`,
        body: `"${item.title}" is now ${FEEDBACK_STATUS_LABELS[item.status]}.`,
        actionUrl: "/feedback",
        userId: ctx.userId,
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

export async function voteFeedbackAction(
  input: unknown,
): Promise<FeedbackActionResult<{ voted: boolean; voteCount: number }>> {
  const parsed = voteFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const user = await getUser();
    if (!user) return { ok: false, error: "Sign in to vote." };
    const result = await voteOnFeedback({
      feedbackId: parsed.data.feedbackId,
      userId: user.id,
    });
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to vote",
    };
  }
}

export async function listRoadmapAction(): Promise<
  FeedbackActionResult<{ items: FeedbackItem[] }>
> {
  try {
    const user = await getUser();
    const items = await listRoadmapFeedback({ userId: user?.id ?? null });
    return { ok: true, data: { items } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load roadmap",
    };
  }
}

"use server";

import {
  countUnreadNotificationsForUser,
  deleteNotificationForUser,
  getUserNotificationPreferences,
  listNotificationsForUser,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
  upsertUserNotificationPreferences,
} from "@repo/database/notifications";
import {
  deleteNotificationSchema,
  listNotificationsSchema,
  markNotificationReadSchema,
  updateNotificationPreferencesSchema,
  type NotificationListItem,
  type UserNotificationPreferences,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type NotificationsActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireContext() {
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Workspace required");
  return {
    workspaceId: context.active.workspace.id,
    userId: context.userId,
  };
}

export async function listNotificationsAction(
  input?: unknown,
): Promise<
  NotificationsActionResult<{
    notifications: NotificationListItem[];
    unreadCount: number;
  }>
> {
  const parsed = listNotificationsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    const [notifications, unreadCount] = await Promise.all([
      listNotificationsForUser({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        query: parsed.data.query,
        category: parsed.data.category,
        unreadOnly: parsed.data.unreadOnly,
        limit: parsed.data.limit,
      }),
      countUnreadNotificationsForUser({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
      }),
    ]);
    return { ok: true, data: { notifications, unreadCount } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load notifications",
    };
  }
}

export async function getUnreadNotificationCountAction(): Promise<
  NotificationsActionResult<{ unreadCount: number }>
> {
  try {
    const ctx = await requireContext();
    const unreadCount = await countUnreadNotificationsForUser({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
    return { ok: true, data: { unreadCount } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load count",
    };
  }
}

export async function markNotificationReadAction(
  input: unknown,
): Promise<NotificationsActionResult<{ read: true }>> {
  const parsed = markNotificationReadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    await markNotificationReadForUser({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      notificationId: parsed.data.notificationId,
    });
    return { ok: true, data: { read: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to mark read",
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<
  NotificationsActionResult<{ count: number }>
> {
  try {
    const ctx = await requireContext();
    const count = await markAllNotificationsReadForUser({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
    });
    return { ok: true, data: { count } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to mark all read",
    };
  }
}

export async function deleteNotificationAction(
  input: unknown,
): Promise<NotificationsActionResult<{ deleted: true }>> {
  const parsed = deleteNotificationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    await deleteNotificationForUser({
      userId: ctx.userId,
      notificationId: parsed.data.notificationId,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete",
    };
  }
}

export async function getNotificationPreferencesAction(): Promise<
  NotificationsActionResult<{ preferences: UserNotificationPreferences }>
> {
  try {
    const ctx = await requireContext();
    const preferences = await getUserNotificationPreferences({ userId: ctx.userId });
    return { ok: true, data: { preferences } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load preferences",
    };
  }
}

export async function updateNotificationPreferencesAction(
  input: unknown,
): Promise<
  NotificationsActionResult<{ preferences: UserNotificationPreferences }>
> {
  const parsed = updateNotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const ctx = await requireContext();
    const preferences = await upsertUserNotificationPreferences({
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { preferences } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update preferences",
    };
  }
}

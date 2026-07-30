import { Suspense } from "react";
import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
} from "@repo/database/notifications";
import { NotificationsCenterClient } from "../../../components/notifications/notifications-client";
import { NotificationsShell } from "../../../components/notifications/notifications-shell";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string }>;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const params = searchParams ? await searchParams : {};
  const section = params.section;
  const { active, userId } = context;
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser({
      workspaceId: active.workspace.id,
      userId,
      section:
        section === "unread" ||
        section === "mentions" ||
        section === "tasks" ||
        section === "projects" ||
        section === "finance" ||
        section === "crm" ||
        section === "calendar" ||
        section === "system"
          ? section
          : undefined,
      unreadOnly: section === "unread",
      limit: 50,
    }),
    countUnreadNotificationsForUser({
      workspaceId: active.workspace.id,
      userId,
    }),
  ]);

  return (
    <NotificationsShell>
      <Suspense
        fallback={
          <div className="h-40 animate-pulse rounded-2xl border border-border bg-elevated/60" />
        }
      >
        <NotificationsCenterClient
          workspaceId={active.workspace.id}
          userId={userId}
          initialNotifications={notifications}
          initialUnreadCount={unreadCount}
        />
      </Suspense>
    </NotificationsShell>
  );
}

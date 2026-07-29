import {
  countUnreadNotificationsForUser,
  listNotificationsForUser,
} from "@repo/database/notifications";
import { NotificationsCenterClient } from "../../../components/notifications/notifications-client";
import { NotificationsShell } from "../../../components/notifications/notifications-shell";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const { active, userId } = context;
  const [notifications, unreadCount] = await Promise.all([
    listNotificationsForUser({
      workspaceId: active.workspace.id,
      userId,
      limit: 50,
    }),
    countUnreadNotificationsForUser({
      workspaceId: active.workspace.id,
      userId,
    }),
  ]);

  return (
    <NotificationsShell>
      <NotificationsCenterClient
        workspaceId={active.workspace.id}
        userId={userId}
        initialNotifications={notifications}
        initialUnreadCount={unreadCount}
      />
    </NotificationsShell>
  );
}

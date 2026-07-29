import { getUserNotificationPreferences } from "@repo/database/notifications";
import { NotificationPreferencesForm } from "../../../../components/notifications/notification-preferences";
import { NotificationsShell } from "../../../../components/notifications/notifications-shell";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function NotificationPreferencesPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const preferences = await getUserNotificationPreferences({ userId: context.userId });

  return (
    <NotificationsShell>
      <NotificationPreferencesForm initialPreferences={preferences} />
    </NotificationsShell>
  );
}

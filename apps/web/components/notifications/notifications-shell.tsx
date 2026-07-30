import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { NotificationsNav } from "./notifications-nav";

export function NotificationsShell({
  title = "Notification Center",
  description = "In-app, email, push, and browser alerts across tasks, projects, finance, CRM, calendar, and security.",
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <ModulePageShell badge="Notifications" title={title} description={description}>
      <NotificationsNav />
      {children}
    </ModulePageShell>
  );
}

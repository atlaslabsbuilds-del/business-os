import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";

export function NotificationsShell({ children }: { children: ReactNode }) {
  return (
    <ModulePageShell
      badge="Notifications"
      title="Notification Center"
      description="Real workspace alerts across finance, CRM, inbox, Kairos, billing, and security."
      navItems={[
        { href: "/notifications", label: "Inbox", exact: true },
        { href: "/notifications/preferences", label: "Preferences" },
      ]}
    >
      {children}
    </ModulePageShell>
  );
}

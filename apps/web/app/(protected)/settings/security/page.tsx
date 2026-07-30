import { ModulePageShell } from "../../../../components/app/module-page-shell";
import { SecurityDashboardClient } from "../../../../components/security/security-dashboard";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  return (
    <ModulePageShell
      badge="Security"
      title="Security Dashboard"
      description="Sessions, login history, devices, API keys, audit logs, and 2FA-ready workspace controls."
      navItems={[
        { href: "/settings/security", label: "Overview", exact: true },
        { href: "/settings", label: "Workspace" },
        { href: "/notifications/preferences", label: "Notifications" },
        { href: "/team", label: "Members" },
        { href: "/integrations", label: "Integrations" },
        { href: "/billing", label: "Billing" },
      ]}
    >
      <SecurityDashboardClient />
    </ModulePageShell>
  );
}

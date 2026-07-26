import {
  IconBriefcase,
  IconCalendar,
  IconGlobe,
  IconLayout,
  IconMail,
  IconPen,
  IconSettings,
  IconShare,
  IconSparkles,
  IconUsers,
} from "@repo/ui/icons";
import { ProtectedAppShell } from "../../components/app/protected-app-shell";
import { resolveActiveWorkspace } from "../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return children;
  }

  const { active, memberships, email } = context;
  const canInvite = active.role === "owner" || active.role === "admin";

  return (
    <ProtectedAppShell
      workspaceName={active.workspace.name}
      workspaceId={active.workspace.id}
      email={email}
      role={active.role}
      canInvite={canInvite}
      memberships={memberships}
      activeWorkspaceId={active.workspace.id}
      navItems={[
        { href: "/dashboard", label: "Dashboard", icon: <IconLayout /> },
        { href: "/chat", label: "Chat", icon: <IconSparkles /> },
        { href: "/crm", label: "CRM", icon: <IconBriefcase /> },
        { href: "/inbox", label: "Inbox", icon: <IconMail /> },
        { href: "/content", label: "Content OS", icon: <IconPen /> },
        { href: "/social", label: "Social OS", icon: <IconShare /> },
        { href: "/website", label: "Website OS", icon: <IconGlobe /> },
        { href: "/calendar", label: "Calendar OS", icon: <IconCalendar /> },
        { href: "/team", label: "Team", icon: <IconUsers /> },
        { href: "/settings", label: "Settings", icon: <IconSettings /> },
      ]}
    >
      {children}
    </ProtectedAppShell>
  );
}

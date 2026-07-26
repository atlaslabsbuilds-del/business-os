import { AppShell } from "@repo/ui/app-shell";
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
import { InviteMemberModal } from "../../components/workspace/invite-member-modal";
import { WorkspaceSwitcher } from "../../components/workspace/workspace-switcher";
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
    <AppShell
      brand="Business OS"
      brandHref="/dashboard"
      title={active.workspace.name}
      userEmail={email}
      sidebarTop={
        <WorkspaceSwitcher
          workspaces={memberships}
          activeWorkspaceId={active.workspace.id}
        />
      }
      toolbar={
        <InviteMemberModal
          workspaceId={active.workspace.id}
          canInvite={canInvite}
        />
      }
      navItems={[
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: <IconLayout />,
        },
        {
          href: "/chat",
          label: "Chat",
          icon: <IconSparkles />,
        },
        {
          href: "/crm",
          label: "CRM",
          icon: <IconBriefcase />,
        },
        {
          href: "/inbox",
          label: "Inbox",
          icon: <IconMail />,
        },
        {
          href: "/content",
          label: "Content OS",
          icon: <IconPen />,
        },
        {
          href: "/social",
          label: "Social OS",
          icon: <IconShare />,
        },
        {
          href: "/website",
          label: "Website OS",
          icon: <IconGlobe />,
        },
        {
          href: "/calendar",
          label: "Calendar OS",
          icon: <IconCalendar />,
        },
        {
          href: "/team",
          label: "Team",
          icon: <IconUsers />,
        },
        {
          href: "/settings",
          label: "Settings",
          icon: <IconSettings />,
        },
      ]}
    >
      {children}
    </AppShell>
  );
}

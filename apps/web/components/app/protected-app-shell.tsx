"use client";

import type { ReactNode } from "react";
import type { WorkspaceMembership } from "@repo/types";
import { AppShell, type AppShellNavItem } from "@repo/ui/app-shell";
import { InviteMemberModal } from "../workspace/invite-member-modal";
import { WorkspaceSwitcher } from "../workspace/workspace-switcher";
import { AppChromeProvider } from "./app-chrome-provider";
import { AppCommandPalette, CommandPaletteTrigger } from "./app-command-palette";
import { AppHelpButton } from "./app-help-button";
import { AppNotificationsCenter } from "./app-notifications-center";
import { AppProfileMenu } from "./app-profile-menu";
import { AppQuickActionsPanel } from "./app-quick-actions-panel";
import { AppToastStack } from "./app-toast-stack";
import { PageTransition } from "./page-transition";
import { KairosFab } from "../kairos/kairos-fab";
import { KairosChromeOverlays } from "../kairos/kairos-chrome-overlays";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function ProtectedAppShell({
  workspaceName,
  workspaceId,
  email,
  role,
  canInvite,
  memberships,
  activeWorkspaceId,
  navItems,
  children,
}: {
  workspaceName: string;
  workspaceId: string;
  email: string | null;
  role: string;
  canInvite: boolean;
  memberships: WorkspaceMembership[];
  activeWorkspaceId: string;
  navItems: AppShellNavItem[];
  children: ReactNode;
}) {
  return (
    <AppChromeProvider>
      <AppShell
        brand="VANDERBASE"
        brandMark={<VanderBaseLogo compact />}
        brandHref="/dashboard"
        title={workspaceName}
        userEmail={email}
        navItems={navItems}
        sidebarTop={
          <WorkspaceSwitcher workspaces={memberships} activeWorkspaceId={activeWorkspaceId} />
        }
        searchSlot={<CommandPaletteTrigger />}
        toolbar={
          <>
            <AppQuickActionsPanel />
            <AppNotificationsCenter />
            <InviteMemberModal workspaceId={workspaceId} canInvite={canInvite} />
            <span className="hidden sm:inline">
              <AppProfileMenu email={email} role={role} />
            </span>
          </>
        }
        helpSlot={<AppHelpButton />}
      >
        <PageTransition>{children}</PageTransition>
      </AppShell>
      <AppCommandPalette />
      <AppToastStack />
      <KairosFab />
      <KairosChromeOverlays />
    </AppChromeProvider>
  );
}

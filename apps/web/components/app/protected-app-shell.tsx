"use client";

import type { ReactNode } from "react";
import type { WorkspaceMembership } from "@repo/types";
import { AppShell, type AppShellNavItem } from "@repo/ui/app-shell";
import { InviteMemberModal } from "../workspace/invite-member-modal";
import { WorkspaceSwitcher } from "../workspace/workspace-switcher";
import { AppChromeProvider } from "./app-chrome-provider";
import { AppCommandPalette, CommandPaletteTrigger } from "./app-command-palette";
import { AppErrorBoundary } from "./app-error-boundary";
import { AppHelpButton } from "./app-help-button";
import { AppNotificationsCenter } from "./app-notifications-center";
import { AppProfileMenu } from "./app-profile-menu";
import { AppQuickActionsPanel } from "./app-quick-actions-panel";
import { AppToastStack } from "./app-toast-stack";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { PageTransition } from "./page-transition";
import { BetaAnalyticsTracker } from "../analytics/beta-analytics-tracker";
import { KairosFab } from "../kairos/kairos-fab";
import { KairosChromeOverlays } from "../kairos/kairos-chrome-overlays";
import { KairosChatPanel, KairosChatProvider } from "../kairos/chat";
import { VanderBaseLogo } from "../branding/vanderbase-logo";
import { FeedbackWidget } from "../feedback/feedback-widget";
import { ProductTour } from "../onboarding/product-tour";
import { PwaRegister } from "../pwa/pwa-register";
import { useNotificationsRealtime, useUnreadNotificationCount } from "../../lib/notifications-realtime";

export function ProtectedAppShell({
  workspaceName,
  workspaceId,
  userId,
  email,
  role,
  canInvite,
  memberships,
  activeWorkspaceId,
  navItems,
  initialUnreadCount = 0,
  children,
}: {
  workspaceName: string;
  workspaceId: string;
  userId: string;
  email: string | null;
  role: string;
  canInvite: boolean;
  memberships: WorkspaceMembership[];
  activeWorkspaceId: string;
  navItems: AppShellNavItem[];
  initialUnreadCount?: number;
  children: ReactNode;
}) {
  const { count, setCount } = useUnreadNotificationCount({
    workspaceId,
    initialCount: initialUnreadCount,
  });

  useNotificationsRealtime({
    workspaceId,
    userId,
    enabled: true,
    onUnreadCountChange: setCount,
  });

  const navWithBadge = navItems.map((item) =>
    item.href === "/notifications" ? { ...item, badge: count } : item,
  );

  return (
    <KairosChatProvider>
      <AppChromeProvider
        workspaceContext={{
          workspaceId,
          organizationName: workspaceName,
          userEmail: email,
        }}
      >
        <AppShell
          brand="VanderBase"
          brandMark={<VanderBaseLogo size="sm" className="max-w-full" />}
          brandMarkCollapsed={<VanderBaseLogo variant="icon" size="md" />}
          brandHref="/dashboard"
          title={workspaceName}
          userEmail={email}
          navItems={navWithBadge}
          sidebarTop={
            <WorkspaceSwitcher workspaces={memberships} activeWorkspaceId={activeWorkspaceId} />
          }
          searchSlot={<CommandPaletteTrigger />}
          toolbar={
            <>
              <AppQuickActionsPanel />
              <AppNotificationsCenter
                workspaceId={workspaceId}
                userId={userId}
                initialUnreadCount={count}
              />
              <InviteMemberModal workspaceId={workspaceId} canInvite={canInvite} />
              <span className="hidden sm:inline">
                <AppProfileMenu email={email} role={role} />
              </span>
            </>
          }
          helpSlot={<AppHelpButton />}
        >
          <AppErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </AppErrorBoundary>
        </AppShell>
        <MobileBottomNav items={navWithBadge} />
        <BetaAnalyticsTracker />
        <PwaRegister />
        <ProductTour />
        <AppCommandPalette />
        <AppToastStack />
        <KairosFab />
        <FeedbackWidget />
        <KairosChatPanel />
        <KairosChromeOverlays />
      </AppChromeProvider>
    </KairosChatProvider>
  );
}

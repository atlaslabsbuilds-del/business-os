import { getDashboardSnapshot } from "@repo/database/dashboard";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import {
  AiCommandCenter,
  ContentOverview,
  FinanceSnapshot,
  GrowthAnalytics,
  KpiCards,
  LeadsPipeline,
  NotificationsPanel,
  QuickActions,
  RecentConversations,
  TodaysAgenda,
  WelcomeHeader,
} from "../../../components/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, email, memberships, userId } = context;
  const snapshot = await getDashboardSnapshot({
    workspaceId: active.workspace.id,
    userId,
    membershipCount: memberships.length,
    role: active.role,
    workspaceName: active.workspace.name,
  });

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <WelcomeHeader
        workspaceName={snapshot.workspace.name}
        email={email}
        role={snapshot.workspace.role}
        members={snapshot.workspace.members}
        pendingInvites={snapshot.workspace.pendingInvites}
      />

      <KpiCards snapshot={snapshot} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <AiCommandCenter snapshot={snapshot} />
        <TodaysAgenda snapshot={snapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RecentConversations snapshot={snapshot} />
        <ContentOverview snapshot={snapshot} />
        <FinanceSnapshot snapshot={snapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LeadsPipeline snapshot={snapshot} />
        <GrowthAnalytics snapshot={snapshot} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <QuickActions />
        <NotificationsPanel snapshot={snapshot} />
      </div>
    </div>
  );
}

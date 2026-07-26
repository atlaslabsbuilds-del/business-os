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
import { ActivityTimeline } from "../../../components/ai/activity-timeline";
import { KairosSuggestions } from "../../../components/ai/kairos-suggestions";
import { OnboardingChecklist } from "../../../components/ai/onboarding-checklist";

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

      <OnboardingChecklist compact />
      <KairosSuggestions />

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

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Workspace timeline
            </p>
            <h2 className="text-lg font-semibold">Recent activity</h2>
          </div>
          <a href="/ai/activity" className="text-xs font-semibold text-primary hover:underline">
            Open full timeline
          </a>
        </div>
        <ActivityTimeline initialEvents={snapshot.activity.slice(0, 12)} />
      </section>
    </div>
  );
}

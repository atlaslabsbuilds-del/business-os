import {
  getFeedbackStats,
  listFeedbackItems,
} from "@repo/database/feedback";
import {
  FeedbackList,
  FeedbackStatusCards,
} from "../../../../components/feedback/feedback-client";
import { FeedbackShell } from "../../../../components/feedback/feedback-shell";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function MyFeedbackPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  const canManage =
    context.active.role === "owner" || context.active.role === "admin";

  const [items, stats] = await Promise.all([
    listFeedbackItems({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      mineOnly: !canManage,
      limit: 100,
    }),
    getFeedbackStats({
      workspaceId: context.active.workspace.id,
      userId: canManage ? undefined : context.userId,
    }),
  ]);

  return (
    <FeedbackShell>
      <div className="space-y-6">
        <FeedbackStatusCards stats={stats} />
        <FeedbackList
          items={items}
          canManage={canManage}
          emptyTitle="No feedback yet"
          emptyBody="When you submit feedback, it will appear here with live status updates."
        />
      </div>
    </FeedbackShell>
  );
}

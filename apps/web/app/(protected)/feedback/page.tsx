import Link from "next/link";
import { listFeedbackItems } from "@repo/database/feedback";
import { Button } from "@repo/ui/button";
import { FeedbackSubmitForm } from "../../../components/feedback/feedback-client";
import { FeedbackShell } from "../../../components/feedback/feedback-shell";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  // Warm query ensures table access works for this workspace after migration.
  await listFeedbackItems({
    workspaceId: context.active.workspace.id,
    userId: context.userId,
    mineOnly: true,
    limit: 1,
  }).catch(() => []);

  return (
    <FeedbackShell
      actions={
        <Link href="/feedback/mine">
          <Button variant="secondary" size="sm">
            My feedback
          </Button>
        </Link>
      }
    >
      <FeedbackSubmitForm />
    </FeedbackShell>
  );
}

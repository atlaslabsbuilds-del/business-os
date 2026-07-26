import { redirect } from "next/navigation";
import {
  getSocialDashboardStats,
  listSocialAccounts,
  listSocialEngagement,
  listSocialPosts,
} from "@repo/database/social";
import { SocialShell } from "../../../components/social";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const workspaceId = context.active.workspace.id;
  const [stats, accounts, posts, engagement] = await Promise.all([
    getSocialDashboardStats({ workspaceId }),
    listSocialAccounts({ workspaceId }),
    listSocialPosts({ workspaceId, limit: 100 }),
    listSocialEngagement({ workspaceId, status: "open" }),
  ]);
  return (
    <SocialShell
      stats={stats}
      accounts={accounts}
      posts={posts}
      engagement={engagement}
    />
  );
}

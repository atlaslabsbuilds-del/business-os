import { redirect } from "next/navigation";
import {
  getContentBrandVoice,
  getContentDashboardStats,
  listContentAssets,
  listContentItems,
  listContentTemplates,
} from "@repo/database/content";
import { ContentShell } from "../../../components/content";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const workspaceId = context.active.workspace.id;
  const [stats, items, voice, assets, templates] = await Promise.all([
    getContentDashboardStats({ workspaceId }),
    listContentItems({ workspaceId, limit: 100 }),
    getContentBrandVoice({ workspaceId }),
    listContentAssets({ workspaceId }),
    listContentTemplates({ workspaceId }),
  ]);

  return (
    <ContentShell
      stats={stats}
      items={items}
      voice={voice}
      assets={assets}
      templates={templates}
    />
  );
}

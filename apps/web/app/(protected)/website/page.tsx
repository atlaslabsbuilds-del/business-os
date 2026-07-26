import { redirect } from "next/navigation";
import {
  getWebsiteDashboardStats,
  listWebsiteDomains,
  listWebsiteForms,
  listWebsiteLinks,
  listWebsitePages,
  listWebsiteProjects,
} from "@repo/database/website";
import { WebsiteShell } from "../../../components/website";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function WebsitePage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const workspaceId = context.active.workspace.id;
  const [stats, projects, pages, links, forms, domains] = await Promise.all([
    getWebsiteDashboardStats({ workspaceId }),
    listWebsiteProjects({ workspaceId }),
    listWebsitePages({ workspaceId }),
    listWebsiteLinks({ workspaceId }),
    listWebsiteForms({ workspaceId }),
    listWebsiteDomains({ workspaceId }),
  ]);
  return (
    <WebsiteShell
      stats={stats}
      projects={projects}
      pages={pages}
      links={links}
      forms={forms}
      domains={domains}
    />
  );
}

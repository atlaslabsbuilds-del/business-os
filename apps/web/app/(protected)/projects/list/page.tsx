import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getProjectsModuleData } from "../../actions/projects";
import { ProjectsShell } from "../../../../components/projects/projects-shell";
import { ProjectsListPanel } from "../../../../components/projects/projects-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  return (
    <ProjectsShell title="Projects" description="Projects list with search, priority, status, tags, archive, duplicate, and delete.">
      <ProjectsListPanel projects={data.projects} />
    </ProjectsShell>
  );
}

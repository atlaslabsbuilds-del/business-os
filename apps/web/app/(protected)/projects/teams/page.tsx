import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getProjectsModuleData } from "../../actions/projects";
import { ProjectsShell } from "../../../../components/projects/projects-shell";
import { ProjectsTeamsPanel } from "../../../../components/projects/projects-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teams" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  return (
    <ProjectsShell title="Teams" description="Project membership and role overview.">
      <ProjectsTeamsPanel projects={data.projects} members={data.members} />
    </ProjectsShell>
  );
}

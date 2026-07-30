import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getProjectsModuleData } from "../../actions/projects";
import { ProjectsShell } from "../../../../components/projects/projects-shell";
import { ProjectsTasksPanel } from "../../../../components/projects/projects-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tasks" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  return (
    <ProjectsShell title="Tasks" description="Task list with priority, labels, milestones, recurring flags, and due dates.">
      <ProjectsTasksPanel projects={data.projects} tasks={data.tasks} />
    </ProjectsShell>
  );
}

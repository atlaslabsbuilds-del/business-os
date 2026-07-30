import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { getProjectsModuleData } from "../../actions/projects";
import { ProjectsShell } from "../../../../components/projects/projects-shell";
import { ProjectsKanbanBoard } from "../../../../components/projects/projects-extra";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kanban" };

export default async function Page() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  return (
    <ProjectsShell title="Kanban" description="Drag-and-drop board across backlog to completed.">
      <ProjectsKanbanBoard tasks={data.tasks} />
    </ProjectsShell>
  );
}

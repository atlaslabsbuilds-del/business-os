import { redirect } from "next/navigation";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getProjectsModuleData } from "../actions/projects";
import { ProjectsShell } from "../../../components/projects/projects-shell";
import { ProjectsAiInsights } from "../../../components/projects/projects-extra";

export const dynamic = "force-dynamic";

export default async function ProjectsOverviewPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const data = await getProjectsModuleData();
  const cards = [
    ["Active projects", data.stats.activeProjects],
    ["Completed projects", data.stats.completedProjects],
    ["Overdue tasks", data.stats.overdueTasks],
    ["Today's tasks", data.stats.todayTasks],
    ["Upcoming deadlines", data.stats.upcomingDeadlines],
    ["Team productivity", `${data.stats.teamProductivity}%`],
    ["Project progress", `${data.stats.averageProgress}%`],
  ] as const;

  return (
    <ProjectsShell title="Projects Overview" description="Active delivery, deadlines, and AI-native project coaching.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Live workspace metric</CardDescription>
            </CardHeader>
            <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          </Card>
        ))}
      </div>
      <ProjectsAiInsights stats={data.stats} />
    </ProjectsShell>
  );
}

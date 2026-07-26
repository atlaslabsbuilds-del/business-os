import type { DashboardSnapshot } from "@repo/types";

export function buildDashboardAiContext(snapshot: DashboardSnapshot): string {
  const insightLines = snapshot.insights
    .map((insight) => `- ${insight.title}: ${insight.body}`)
    .join("\n");
  const memoryLines = snapshot.memory
    .slice(0, 5)
    .map((memory) => `- ${memory.summary ?? memory.fact}`)
    .join("\n");

  return [
    "Personal Brand OS workspace dashboard context:",
    `Revenue pipeline: ${snapshot.kpis.revenue}`,
    `Leads: ${snapshot.kpis.leads}`,
    `Open tasks: ${snapshot.kpis.openTasks}`,
    `Upcoming events: ${snapshot.kpis.upcomingEvents}`,
    `Unread inbox threads: ${snapshot.inbox.unread}`,
    `AI credits: ${snapshot.kpis.aiCredits}`,
    "",
    "Current AI insights:",
    insightLines || "- No active insights",
    "",
    "Persisted workspace memory:",
    memoryLines || "- No saved memory yet",
  ].join("\n");
}

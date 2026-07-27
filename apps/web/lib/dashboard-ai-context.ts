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
    "VanderBase workspace dashboard context:",
    `Workspace: ${snapshot.workspace.name}`,
    `Revenue pipeline: ${snapshot.kpis.revenue}`,
    `Won revenue: ${snapshot.finance.wonValue}`,
    `Leads: ${snapshot.kpis.leads}`,
    `Open deals: ${snapshot.kpis.openDeals}`,
    `Open tasks: ${snapshot.kpis.openTasks}`,
    `Upcoming events: ${snapshot.kpis.upcomingEvents}`,
    `Unread inbox threads: ${snapshot.inbox.unread}`,
    `AI drafts: ${snapshot.content.aiDrafts}`,
    `AI credits: ${snapshot.kpis.aiCredits}`,
    `Conversations: ${snapshot.chat.conversations}`,
    "",
    "Current AI insights:",
    insightLines || "- No active insights",
    "",
    "Persisted workspace memory:",
    memoryLines || "- No saved memory yet",
  ].join("\n");
}

import type { DashboardInsight, DashboardSnapshot } from "@repo/types";
import {
  getCrmDashboardStats,
} from "./crm";
import {
  getInboxDashboardStats,
  listInboxCalendarEvents,
  listInboxTasks,
} from "./inbox";
import { listConversations } from "./chat";
import { getWorkspaceCredits, listCreditTransactions } from "./credits";
import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "./workspace";
import { listWorkspaceActivityEvents } from "./activity";
import { listWorkspaceNotifications } from "./notifications";
import { listWorkspaceAiMemory } from "./workspace-memory";

function buildInsights(input: {
  leads: number;
  openTasks: number;
  upcomingEvents: number;
  unread: number;
  aiCredits: number;
  pipelineValue: number;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  if (input.leads > 0) {
    insights.push({
      title: "Lead momentum is building",
      body: `${input.leads} lead${input.leads === 1 ? "" : "s"} are ready for follow-up in your workspace.`,
      module: "leads",
      severity: "success",
      actionUrl: "/crm/leads",
    });
  }

  if (input.openTasks > 0) {
    insights.push({
      title: "Tasks need attention",
      body: `${input.openTasks} open task${input.openTasks === 1 ? "" : "s"} are waiting across inbox and client workflows.`,
      module: "calendar",
      severity: "warning",
      actionUrl: "/inbox/tasks",
    });
  }

  if (input.upcomingEvents > 0) {
    insights.push({
      title: "Calendar is active",
      body: `${input.upcomingEvents} upcoming meeting${input.upcomingEvents === 1 ? "" : "s"} are on deck.`,
      module: "calendar",
      severity: "info",
      actionUrl: "/inbox/calendar",
    });
  }

  if (input.unread > 0) {
    insights.push({
      title: "Inbox has new opportunities",
      body: `${input.unread} unread thread${input.unread === 1 ? "" : "s"} may contain leads, tasks, or client updates.`,
      module: "inbox",
      severity: "info",
      actionUrl: "/inbox",
    });
  }

  if (input.aiCredits < 1000) {
    insights.push({
      title: "AI credits are running low",
      body: "Top up billing soon to keep smart replies, summaries, and assistant workflows available.",
      module: "billing",
      severity: "warning",
      actionUrl: "/settings",
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Workspace foundation is healthy",
      body: "Your core systems are connected. Add content, lead generation, and client workflows as you grow.",
      module: "dashboard",
      severity: "success",
      actionUrl: "/dashboard",
    });
  }

  if (input.pipelineValue > 0 && insights.length < 5) {
    insights.push({
      title: "Revenue pipeline is visible",
      body: `$${input.pipelineValue.toLocaleString()} is currently tracked in open deals.`,
      module: "finance",
      severity: "success",
      actionUrl: "/crm/deals",
    });
  }

  return insights.slice(0, 5);
}

export async function getDashboardSnapshot(input: {
  workspaceId: string;
  userId: string;
  membershipCount: number;
  role: string;
}): Promise<DashboardSnapshot> {
  const [
    crm,
    inbox,
    credits,
    creditTransactions,
    conversations,
    members,
    invitations,
    tasks,
    events,
    notifications,
    activity,
    memory,
  ] = await Promise.all([
    getCrmDashboardStats({ workspaceId: input.workspaceId }),
    getInboxDashboardStats({ workspaceId: input.workspaceId }),
    getWorkspaceCredits({ workspaceId: input.workspaceId }),
    listCreditTransactions({ workspaceId: input.workspaceId, limit: 5 }),
    listConversations({ workspaceId: input.workspaceId, userId: input.userId }),
    listWorkspaceMembers(input.workspaceId),
    listWorkspaceInvitations(input.workspaceId),
    listInboxTasks({
      workspaceId: input.workspaceId,
      status: "open",
    }),
    listInboxCalendarEvents({
      workspaceId: input.workspaceId,
      upcomingOnly: true,
    }),
    listWorkspaceNotifications({
      workspaceId: input.workspaceId,
      limit: 5,
    }),
    listWorkspaceActivityEvents({
      workspaceId: input.workspaceId,
      limit: 8,
    }),
    listWorkspaceAiMemory({
      workspaceId: input.workspaceId,
      limit: 5,
    }),
  ]);

  const pendingInvites = invitations.filter(
    (invitation) => invitation.status === "pending",
  ).length;
  const openTasks = tasks.slice(0, 5);
  const upcomingEvents = events
    .filter((event) => event.status === "scheduled")
    .slice(0, 5);

  return {
    workspace: {
      members: members.length,
      workspaces: input.membershipCount,
      pendingInvites,
      role: input.role,
    },
    kpis: {
      revenue: crm.pipelineValue,
      leads: crm.leads,
      openTasks: inbox.tasksOpen,
      upcomingEvents: inbox.upcomingMeetings,
      aiCredits: credits.balance,
    },
    crm: {
      contacts: crm.contacts,
      companies: crm.companies,
      openDeals: crm.openDeals,
      pipelineValue: crm.pipelineValue,
      activities: crm.activities,
    },
    inbox: {
      unread: inbox.unread,
      openThreads: inbox.openThreads,
      openTasks: inbox.tasksOpen,
      upcomingMeetings: inbox.upcomingMeetings,
    },
    chat: {
      conversations: conversations.length,
    },
    notifications,
    activity: activity.length > 0
      ? activity
      : creditTransactions.map((transaction) => ({
          id: transaction.id,
          workspaceId: transaction.workspaceId,
          module: "billing",
          eventType: "credit_transaction",
          title: transaction.reason.replaceAll("_", " "),
          body: `${transaction.amount > 0 ? "+" : ""}${transaction.amount} AI credits`,
          entityType: "credit_transaction",
          entityId: transaction.id,
          actorId: transaction.userId,
          actionUrl: "/settings",
          metadata: transaction.metadata,
          createdAt: transaction.createdAt,
        })),
    memory,
    insights: buildInsights({
      leads: crm.leads,
      openTasks: inbox.tasksOpen,
      upcomingEvents: inbox.upcomingMeetings,
      unread: inbox.unread,
      aiCredits: credits.balance,
      pipelineValue: crm.pipelineValue,
    }),
    tasks: openTasks.map((task) => ({
      id: task.id,
      title: task.title,
      dueAt: task.dueAt,
      actionUrl: task.threadId ? `/inbox/threads/${task.threadId}` : "/inbox/tasks",
    })),
    events: upcomingEvents.map((event) => ({
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      actionUrl: event.threadId
        ? `/inbox/threads/${event.threadId}`
        : "/inbox/calendar",
    })),
  };
}

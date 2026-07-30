import "server-only";

import { z } from "zod";
import {
  countUnreadNotificationsForUser,
  emitKairosAlert,
  getSecurityDashboardSnapshot,
  listNotificationsForUser,
  listWorkspaceActivityEvents,
  listWorkspaceMembers,
} from "@repo/database";
import type { KairosToolDefinition } from "./types";

export function buildKairosPlatformTools(): KairosToolDefinition[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Array<KairosToolDefinition<any, any>> = [
    {
      name: "showUnreadNotifications",
      description: "Show unread notifications for the current user",
      requiredRole: "Viewer",
      schema: z.object({}),
      execute: async (ctx) => {
        const [notifications, unreadCount] = await Promise.all([
          listNotificationsForUser({
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
            unreadOnly: true,
            limit: 20,
          }),
          countUnreadNotificationsForUser({
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
          }),
        ]);
        return {
          unreadCount,
          items: notifications.map((item) => ({
            id: item.id,
            title: item.title,
            category: item.category,
            priority: item.priority,
            actionUrl: item.actionUrl,
          })),
        };
      },
    },
    {
      name: "summarizeTodaysActivity",
      description: "Summarize today's workspace activity",
      requiredRole: "Viewer",
      schema: z.object({}),
      execute: async (ctx) => {
        const since = new Date();
        since.setHours(0, 0, 0, 0);
        const events = await listWorkspaceActivityEvents({
          workspaceId: ctx.workspaceId,
          since: since.toISOString(),
          limit: 40,
        });
        const byModule = new Map<string, number>();
        for (const event of events) {
          byModule.set(event.module, (byModule.get(event.module) ?? 0) + 1);
        }
        return {
          count: events.length,
          byModule: Object.fromEntries(byModule),
          highlights: events.slice(0, 8).map((event) => event.title),
          summary:
            events.length === 0
              ? "No activity recorded today yet."
              : `Today: ${events.length} events across ${byModule.size} modules.`,
        };
      },
    },
    {
      name: "reviewSecurity",
      description: "Review workspace security posture",
      requiredRole: "Manager",
      schema: z.object({}),
      execute: async (ctx) => {
        const snapshot = await getSecurityDashboardSnapshot({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
        });
        return {
          score: snapshot.score,
          mfaRequired: snapshot.settings.mfaRequired,
          activeSessions: snapshot.sessions.length,
          apiKeys: snapshot.apiKeys.length,
          recentAudits: snapshot.auditLogs.slice(0, 5).map((item) => item.eventType),
          recommendation: snapshot.settings.mfaRequired
            ? "MFA is required. Review active sessions regularly."
            : "Enable MFA requirement for stronger account protection.",
        };
      },
    },
    {
      name: "optimizeWorkspace",
      description: "Suggest workspace optimizations from usage signals",
      requiredRole: "Manager",
      schema: z.object({}),
      execute: async (ctx) => {
        const [unread, activity, members] = await Promise.all([
          countUnreadNotificationsForUser({
            workspaceId: ctx.workspaceId,
            userId: ctx.userId,
          }),
          listWorkspaceActivityEvents({
            workspaceId: ctx.workspaceId,
            limit: 30,
          }),
          listWorkspaceMembers(ctx.workspaceId),
        ]);
        const tips = [
          unread > 10 ? `Clear ${unread} unread notifications to reduce noise.` : null,
          activity.length < 5
            ? "Activity is light — connect integrations or invite teammates."
            : null,
          members.length < 2
            ? "Invite at least one teammate to unlock collaboration."
            : null,
          "Review /settings/security and notification preferences weekly.",
        ].filter(Boolean);
        return { tips, unread, activityCount: activity.length, members: members.length };
      },
    },
    {
      name: "improveProductivity",
      description: "Suggest productivity improvements",
      requiredRole: "Viewer",
      schema: z.object({}),
      execute: async (ctx) => {
        const unread = await countUnreadNotificationsForUser({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
        });
        return {
          suggestions: [
            unread > 0
              ? `Triage ${unread} unread notifications first.`
              : "Inbox is clear — batch focus on projects and CRM follow-ups.",
            "Use Kairos for meeting agendas and overdue task sweeps.",
            "Enable quiet hours to protect deep-work blocks.",
          ],
        };
      },
    },
    {
      name: "findInactiveMembers",
      description: "Find workspace members who may be inactive",
      requiredRole: "Manager",
      schema: z.object({}),
      execute: async (ctx) => {
        const members = await listWorkspaceMembers(ctx.workspaceId);
        const events = await listWorkspaceActivityEvents({
          workspaceId: ctx.workspaceId,
          limit: 100,
        });
        const activeActors = new Set(
          events.map((event) => event.actorId).filter(Boolean) as string[],
        );
        const inactive = members
          .filter((member) => !activeActors.has(member.userId))
          .map((member) => ({
            userId: member.userId,
            role: member.role,
            email: member.email ?? null,
          }));
        return {
          inactiveCount: inactive.length,
          inactive,
          note: "Based on recent workspace activity actors — not auth login timestamps.",
        };
      },
    },
    {
      name: "notifyKairosAlert",
      description: "Create a Kairos AI alert notification for the workspace",
      requiredRole: "Manager",
      schema: z.object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(500),
        actionUrl: z.string().max(300).optional(),
      }),
      execute: async (ctx, input) => {
        const notification = await emitKairosAlert({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title,
          body: input.body,
          actionUrl: input.actionUrl,
        });
        return {
          created: Boolean(notification),
          notificationId: notification?.id ?? null,
        };
      },
    },
  ];

  return tools;
}

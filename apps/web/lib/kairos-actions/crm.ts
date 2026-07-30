import "server-only";

import { z } from "zod";
import {
  createDeal,
  getCrmDashboardStats,
  getCrmReportSnapshot,
  getCustomerTimeline,
  listContacts,
  listDeals,
  listLeads,
  listNotes,
} from "@repo/database";
import type { KairosToolDefinition } from "./types";

function contactName(contact: {
  firstName: string;
  lastName: string;
}): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
}

export function buildKairosCrmTools(): KairosToolDefinition[] {
  // Heterogeneous Zod schemas across CRM tools.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: Array<KairosToolDefinition<any, any>> = [
    {
      name: "showHotLeads",
      description: "Show high-priority or recently updated leads",
      requiredRole: "Sales",
      schema: z.object({ limit: z.number().int().min(1).max(20).optional() }),
      integrations: ["HubSpot"],
      execute: async (ctx, input) => {
        const leads = await listLeads({ workspaceId: ctx.workspaceId });
        const hot = [...leads]
          .sort((a, b) => {
            const priorityRank = { urgent: 4, high: 3, medium: 2, low: 1 };
            const byPriority =
              (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0);
            if (byPriority !== 0) return byPriority;
            return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
          })
          .slice(0, input.limit ?? 8)
          .map((lead) => ({
            id: lead.id,
            name: contactName(lead),
            email: lead.email,
            priority: lead.priority,
            source: lead.source,
          }));
        return { leads: hot, count: hot.length };
      },
    },
    {
      name: "summarizeCustomerHistory",
      description: "Summarize CRM timeline and notes for a customer",
      requiredRole: "Sales",
      schema: z.object({
        contactId: z.string().uuid().optional(),
        customerName: z.string().trim().max(120).optional(),
      }),
      integrations: ["HubSpot"],
      execute: async (ctx, input) => {
        let contactId = input.contactId;
        if (!contactId && input.customerName) {
          const contacts = await listContacts({
            workspaceId: ctx.workspaceId,
            query: input.customerName,
            limit: 1,
          });
          contactId = contacts[0]?.id;
        }
        if (!contactId) {
          throw new Error("Provide a customer name or contactId to summarize.");
        }
        const [timeline, notes, contact] = await Promise.all([
          getCustomerTimeline({
            workspaceId: ctx.workspaceId,
            contactId,
          }),
          listNotes({ workspaceId: ctx.workspaceId, contactId }),
          listContacts({ workspaceId: ctx.workspaceId }).then((rows) =>
            rows.find((row) => row.id === contactId),
          ),
        ]);
        const summary = [
          `${contact ? contactName(contact) : "Customer"} has ${timeline.length} timeline events and ${notes.length} notes.`,
          timeline
            .slice(0, 5)
            .map((item) => {
              if (item.kind === "activity") return `Activity: ${item.item.subject}`;
              if (item.kind === "note") return `Note: ${item.item.body.slice(0, 80)}`;
              return `Deal: ${item.item.title} (${item.item.stage})`;
            })
            .join(" · ") || "No recent history yet.",
        ].join(" ");
        return { contactId, summary, timelineCount: timeline.length, notesCount: notes.length };
      },
    },
    {
      name: "predictDealClosures",
      description: "Predict which open deals are most likely to close",
      requiredRole: "Sales",
      schema: z.object({ limit: z.number().int().min(1).max(20).optional() }),
      integrations: ["HubSpot", "Salesforce"],
      execute: async (ctx, input) => {
        const deals = await listDeals({ workspaceId: ctx.workspaceId });
        const open = deals.filter(
          (deal) => deal.stage !== "won" && deal.stage !== "lost",
        );
        const ranked = [...open]
          .map((deal) => {
            const stageBoost =
              deal.stage === "negotiation"
                ? 20
                : deal.stage === "proposal"
                  ? 10
                  : deal.stage === "qualified"
                    ? 5
                    : 0;
            const score = Math.min(99, deal.probability + stageBoost);
            return {
              id: deal.id,
              title: deal.title,
              amount: deal.amount,
              stage: deal.stage,
              probability: deal.probability,
              predictedCloseScore: score,
              reason:
                score >= 70
                  ? "High probability with late-stage momentum"
                  : "Needs nurturing or stage progression",
            };
          })
          .sort((a, b) => b.predictedCloseScore - a.predictedCloseScore)
          .slice(0, input.limit ?? 5);
        return { deals: ranked };
      },
    },
    {
      name: "generateFollowUpEmail",
      description: "Generate a follow-up email draft for a CRM contact",
      requiredRole: "Sales",
      schema: z.object({
        contactId: z.string().uuid().optional(),
        customerName: z.string().trim().max(120).optional(),
        topic: z.string().trim().max(200).optional(),
      }),
      integrations: ["Gmail", "Outlook"],
      execute: async (ctx, input) => {
        let contactId = input.contactId;
        let name = input.customerName ?? "there";
        if (!contactId && input.customerName) {
          const contacts = await listContacts({
            workspaceId: ctx.workspaceId,
            query: input.customerName,
            limit: 1,
          });
          contactId = contacts[0]?.id;
          if (contacts[0]) name = contactName(contacts[0]);
        }
        const topic = input.topic || "our recent conversation";
        const body = [
          `Hi ${name.split(" ")[0] || "there"},`,
          "",
          `I wanted to follow up on ${topic}. Happy to answer any questions and share next steps when you're ready.`,
          "",
          "Best,",
          "Kairos",
        ].join("\n");
        return {
          contactId: contactId ?? null,
          subject: `Following up on ${topic}`,
          body,
        };
      },
    },
    {
      name: "findInactiveCustomers",
      description: "Find customers/leads with no recent CRM activity",
      requiredRole: "Sales",
      schema: z.object({
        days: z.number().int().min(7).max(365).optional(),
        limit: z.number().int().min(1).max(30).optional(),
      }),
      execute: async (ctx, input) => {
        const days = input.days ?? 30;
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        const contacts = await listContacts({ workspaceId: ctx.workspaceId });
        const inactive = contacts
          .filter((contact) => Date.parse(contact.updatedAt) < cutoff)
          .slice(0, input.limit ?? 10)
          .map((contact) => ({
            id: contact.id,
            name: contactName(contact),
            email: contact.email,
            lifecycleStage: contact.lifecycleStage,
            lastUpdated: contact.updatedAt,
          }));
        return { days, customers: inactive, count: inactive.length };
      },
    },
    {
      name: "suggestNextSalesActions",
      description: "Suggest next sales actions from CRM dashboard and pipeline data",
      requiredRole: "Sales",
      schema: z.object({}),
      execute: async (ctx) => {
        const [stats, report, hotDeals] = await Promise.all([
          getCrmDashboardStats({ workspaceId: ctx.workspaceId }),
          getCrmReportSnapshot({ workspaceId: ctx.workspaceId }),
          listDeals({ workspaceId: ctx.workspaceId }),
        ]);
        const negotiation = hotDeals.filter((deal) => deal.stage === "negotiation");
        const actions = [
          stats.qualifiedLeads > 0
            ? `Convert ${Math.min(5, stats.qualifiedLeads)} qualified leads into deals.`
            : "Qualify more leads before expanding pipeline volume.",
          negotiation.length > 0
            ? `Close or advance ${negotiation.length} negotiation-stage deals.`
            : "Move proposal deals into negotiation with clear next meetings.",
          report.winRate < 40
            ? "Review lost-deal notes and tighten qualification criteria."
            : "Protect the current win rate by prioritizing high-probability opportunities.",
          stats.salesThisMonth === 0
            ? "Book follow-ups this week to create month-to-date closed revenue."
            : `Build on ${stats.salesThisMonth.toFixed(0)} in month-to-date sales.`,
        ];
        return { actions, stats, winRate: report.winRate };
      },
    },
    {
      name: "createDealQuick",
      description: "Create a new CRM deal quickly from natural language",
      requiredRole: "Sales",
      schema: z.object({
        title: z.string().trim().min(1).max(200),
        amount: z.number().min(0).optional(),
        contactId: z.string().uuid().optional(),
      }),
      integrations: ["HubSpot", "Salesforce"],
      execute: async (ctx, input) => {
        const deal = await createDeal({
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          title: input.title,
          amount: input.amount ?? 0,
          contactId: input.contactId,
          stage: "lead",
        });
        return { deal };
      },
    },
  ];

  return tools;
}

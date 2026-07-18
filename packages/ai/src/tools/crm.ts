import { z } from "zod";
import type { RegisteredTool } from "./tool";
import { defineTool } from "./tool";

/**
 * Injectable CRM data access for AI tools.
 * Product modules wire these to @repo/database/crm.
 */
export type CrmToolDeps = {
  listContacts?: (input: {
    workspaceId: string;
    query?: string;
    stage?: string;
    limit?: number;
  }) => Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      lifecycleStage: string;
      companyId: string | null;
    }>
  >;
  createLead?: (input: {
    workspaceId: string;
    userId: string;
    firstName: string;
    lastName?: string;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
  }) => Promise<{ id: string; firstName: string; lastName: string }>;
  updateDeal?: (input: {
    workspaceId: string;
    id: string;
    title?: string;
    amount?: number;
    stage?: string;
    probability?: number;
  }) => Promise<{
    id: string;
    title: string;
    stage: string;
    amount: number;
  }>;
  searchCompany?: (input: {
    workspaceId: string;
    query: string;
    limit?: number;
  }) => Promise<
    Array<{
      id: string;
      name: string;
      domain: string | null;
      industry: string | null;
    }>
  >;
  getCustomerTimeline?: (input: {
    workspaceId: string;
    contactId: string;
  }) => Promise<
    Array<{
      kind: string;
      id: string;
      title: string;
      createdAt: string;
    }>
  >;
  createContact?: (input: {
    workspaceId: string;
    userId: string;
    firstName: string;
    lastName?: string;
    email?: string | null;
    lifecycleStage?: string;
  }) => Promise<{ id: string }>;
  listDeals?: (input: {
    workspaceId: string;
    stage?: string;
    query?: string;
  }) => Promise<
    Array<{
      id: string;
      title: string;
      stage: string;
      amount: number;
    }>
  >;
};

/**
 * Registers Actora CRM tools for the AI Tool Registry.
 * Every CRM capability the model needs is exposed here.
 */
export function createCrmTools(deps: CrmToolDeps = {}): RegisteredTool[] {
  return [
    defineTool({
      name: "crm.listContacts",
      description: "List CRM contacts in the active workspace, optionally filtered",
      permissions: ["crm:read", "workspace:read"],
      parameters: z.object({
        query: z.string().trim().max(160).optional(),
        stage: z
          .enum(["lead", "qualified", "customer", "churned", "other"])
          .optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.listContacts) {
          return { contacts: [], note: "CRM listContacts not configured" };
        }
        const contacts = await deps.listContacts({
          workspaceId: context.workspaceId,
          query: args.query,
          stage: args.stage,
          limit: args.limit,
        });
        return {
          count: contacts.length,
          contacts: contacts.slice(0, args.limit ?? contacts.length),
        };
      },
    }),

    defineTool({
      name: "crm.createLead",
      description: "Create a new CRM lead (contact in lead stage)",
      permissions: ["crm:write", "workspace:write"],
      parameters: z.object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().max(80).optional(),
        email: z.string().trim().email().optional().nullable(),
        phone: z.string().trim().max(60).optional().nullable(),
        source: z.string().trim().max(120).optional().nullable(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.createLead) {
          return { created: false, note: "CRM createLead not configured" };
        }
        const lead = await deps.createLead({
          workspaceId: context.workspaceId,
          userId: context.userId,
          firstName: args.firstName,
          lastName: args.lastName,
          email: args.email,
          phone: args.phone,
          source: args.source,
        });
        return { created: true, lead };
      },
    }),

    defineTool({
      name: "crm.updateDeal",
      description: "Update a CRM deal stage, amount, or title",
      permissions: ["crm:write", "workspace:write"],
      parameters: z.object({
        id: z.string().uuid(),
        title: z.string().trim().min(1).max(200).optional(),
        amount: z.number().min(0).optional(),
        stage: z
          .enum(["qualified", "proposal", "negotiation", "won", "lost"])
          .optional(),
        probability: z.number().int().min(0).max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.updateDeal) {
          return { updated: false, note: "CRM updateDeal not configured" };
        }
        const deal = await deps.updateDeal({
          workspaceId: context.workspaceId,
          id: args.id,
          title: args.title,
          amount: args.amount,
          stage: args.stage,
          probability: args.probability,
        });
        return { updated: true, deal };
      },
    }),

    defineTool({
      name: "crm.searchCompany",
      description: "Search CRM companies by name or domain",
      permissions: ["crm:read", "workspace:read"],
      parameters: z.object({
        query: z.string().trim().min(1).max(160),
        limit: z.number().int().positive().max(50).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.searchCompany) {
          return { companies: [], note: "CRM searchCompany not configured" };
        }
        const companies = await deps.searchCompany({
          workspaceId: context.workspaceId,
          query: args.query,
          limit: args.limit ?? 10,
        });
        return { count: companies.length, companies };
      },
    }),

    defineTool({
      name: "crm.getCustomerTimeline",
      description:
        "Get a customer's CRM timeline: activities, notes, and related deals",
      permissions: ["crm:read", "workspace:read"],
      parameters: z.object({
        contactId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.getCustomerTimeline) {
          return { items: [], note: "CRM getCustomerTimeline not configured" };
        }
        const items = await deps.getCustomerTimeline({
          workspaceId: context.workspaceId,
          contactId: args.contactId,
        });
        return { contactId: args.contactId, count: items.length, items };
      },
    }),

    defineTool({
      name: "crm.listDeals",
      description: "List CRM deals in the active workspace",
      permissions: ["crm:read", "workspace:read"],
      parameters: z.object({
        stage: z
          .enum(["qualified", "proposal", "negotiation", "won", "lost"])
          .optional(),
        query: z.string().trim().max(160).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.listDeals) {
          return { deals: [], note: "CRM listDeals not configured" };
        }
        const deals = await deps.listDeals({
          workspaceId: context.workspaceId,
          stage: args.stage,
          query: args.query,
        });
        return { count: deals.length, deals };
      },
    }),
  ];
}

/**
 * Register CRM tools onto an existing registry (idempotent for name conflicts).
 */
export function registerCrmTools(
  registry: {
    has: (name: string) => boolean;
    register: (tool: RegisteredTool) => unknown;
  },
  deps: CrmToolDeps = {},
): string[] {
  const registered: string[] = [];
  for (const tool of createCrmTools(deps)) {
    if (!registry.has(tool.name)) {
      registry.register(tool);
      registered.push(tool.name);
    }
  }
  return registered;
}

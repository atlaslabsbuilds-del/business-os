import { z } from "zod";
import {
  createAiReplyDraft,
  createContact,
  createDeal,
  createFinanceInvoice,
  createInboxTask,
  createLead,
  createNote,
  createWorkspaceActivityEvent,
  deleteContact,
  deleteDeal,
  getDashboardSnapshot,
  listContacts,
  listDeals,
  listFinanceInvoices,
  listWorkspaceActivityEvents,
  scheduleInboxMeeting,
  updateDeal,
  updateFinanceInvoiceStatus,
} from "@repo/database";
import { parseKairosActionCommand } from "./parser";
import { KairosToolRegistry } from "./registry";
import { buildKairosIntegrationTools } from "./integrations";
import type {
  KairosActionExecutionContext,
  KairosActionResponse,
  KairosTimelineItem,
  KairosToolDefinition,
} from "./types";

const toolRegistry = new KairosToolRegistry();

function truncate(input: string, max = 240): string {
  if (input.length <= max) return input;
  return `${input.slice(0, max - 1)}…`;
}

function registerTool<TInput, TResult>(tool: KairosToolDefinition<TInput, TResult>) {
  if (!toolRegistry.get(tool.name)) {
    toolRegistry.register(tool);
  }
}

function ensureDefaultKairosTools() {
  if (toolRegistry.list().length > 0) return;

  registerTool({
    name: "createCustomer",
    description: "Create a new CRM customer",
    requiredRole: "Sales",
    schema: z.object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().max(80).optional(),
      email: z.string().trim().email().optional(),
    }),
    integrations: ["HubSpot"],
    execute: async (ctx, input) => {
      const contact = await createContact({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
      });
      return { contact };
    },
  });

  registerTool({
    name: "createLead",
    description: "Create a new CRM lead",
    requiredRole: "Sales",
    schema: z.object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().max(80).optional(),
      email: z.string().trim().email().optional(),
      source: z.string().trim().max(120).optional(),
    }),
    integrations: ["HubSpot"],
    execute: async (ctx, input) => {
      const lead = await createLead({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email ?? null,
        source: input.source ?? "kairos",
      });
      return { lead };
    },
  });

  registerTool({
    name: "createDeal",
    description: "Create a CRM deal",
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
      });
      return { deal };
    },
  });

  registerTool({
    name: "updateDealStage",
    description: "Update stage of an existing deal",
    requiredRole: "Sales",
    schema: z.object({
      dealId: z.string().uuid(),
      stage: z.enum(["qualified", "proposal", "negotiation", "won", "lost"]),
    }),
    integrations: ["HubSpot", "Salesforce"],
    execute: async (ctx, input) => {
      const deal = await updateDeal({
        workspaceId: ctx.workspaceId,
        id: input.dealId,
        stage: input.stage,
      });
      return { deal };
    },
  });

  registerTool({
    name: "createInvoice",
    description: "Create finance invoice",
    requiredRole: "Manager",
    schema: z.object({
      customerName: z.string().trim().min(1).max(120),
      customerId: z.string().uuid().optional(),
      amount: z.number().min(0).optional(),
      notes: z.string().trim().max(1000).optional(),
    }),
    integrations: ["Stripe", "Razorpay"],
    execute: async (ctx, input) => {
      const invoice = await createFinanceInvoice({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        invoiceNumber: `INV-${Date.now()}`,
        customerName: input.customerName,
        customerId: input.customerId ?? null,
        items: [
          {
            description: "Kairos-generated invoice item",
            quantity: 1,
            unitPrice: input.amount ?? 0,
            amount: input.amount ?? 0,
          },
        ],
        notes: input.notes ?? "Created by Kairos",
      });
      return { invoice };
    },
  });

  registerTool({
    name: "scheduleMeeting",
    description: "Schedule a workspace meeting event",
    requiredRole: "Sales",
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      startsAt: z.string().min(1),
      endsAt: z.string().min(1),
      location: z.string().trim().max(240).optional(),
      threadId: z.string().uuid().optional(),
    }),
    integrations: ["Google Calendar"],
    execute: async (ctx, input) => {
      const event = await scheduleInboxMeeting({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        threadId: input.threadId ?? null,
        title: input.title,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        location: input.location ?? null,
      });
      return { event };
    },
  });

  registerTool({
    name: "createTask",
    description: "Create an inbox task",
    requiredRole: "Sales",
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().max(4000).optional(),
      dueAt: z.string().optional(),
      threadId: z.string().uuid().optional(),
    }),
    integrations: ["Linear", "Notion"],
    execute: async (ctx, input) => {
      const task = await createInboxTask({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        threadId: input.threadId ?? null,
        title: input.title,
        description: input.description ?? null,
        dueAt: input.dueAt ?? null,
      });
      return { task };
    },
  });

  registerTool({
    name: "assignTask",
    description: "Assign a task to the current operator",
    requiredRole: "Sales",
    schema: z.object({
      title: z.string().trim().min(1).max(200),
      threadId: z.string().uuid().optional(),
    }),
    integrations: ["Linear", "Notion"],
    execute: async (ctx, input) => {
      const task = await createInboxTask({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        threadId: input.threadId ?? null,
        title: input.title,
        description: `Assigned by Kairos to ${ctx.userEmail ?? "current user"}.`,
      });
      return { task, assignedTo: ctx.userId };
    },
  });

  registerTool({
    name: "sendFollowUpEmailDraft",
    description: "Create a follow-up email draft only",
    requiredRole: "Sales",
    schema: z.object({
      threadId: z.string().uuid(),
      body: z.string().trim().min(1).max(12000),
    }),
    integrations: ["Gmail"],
    execute: async (ctx, input) => {
      const draft = await createAiReplyDraft({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        threadId: input.threadId,
        style: "professional",
        body: input.body,
        metadata: {
          source: "kairos-actions",
          draftOnly: true,
        },
      });
      return { draft };
    },
  });

  registerTool({
    name: "addCrmNote",
    description: "Add note to CRM record",
    requiredRole: "Sales",
    schema: z.object({
      body: z.string().trim().min(1).max(8000),
      contactId: z.string().uuid().optional(),
      dealId: z.string().uuid().optional(),
      companyId: z.string().uuid().optional(),
    }),
    integrations: ["HubSpot"],
    execute: async (ctx, input) => {
      const note = await createNote({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        body: input.body,
        contactId: input.contactId ?? null,
        dealId: input.dealId ?? null,
        companyId: input.companyId ?? null,
      });
      return { note };
    },
  });

  registerTool({
    name: "searchCustomer",
    description: "Search CRM customers",
    requiredRole: "Viewer",
    schema: z.object({
      query: z.string().trim().max(160).optional(),
    }),
    integrations: ["HubSpot"],
    execute: async (ctx, input) => {
      const contacts = await listContacts({
        workspaceId: ctx.workspaceId,
        query: input.query,
        limit: 20,
      });
      return { count: contacts.length, contacts };
    },
  });

  registerTool({
    name: "searchDeals",
    description: "Search CRM deals",
    requiredRole: "Viewer",
    schema: z.object({
      query: z.string().trim().max(160).optional(),
    }),
    integrations: ["HubSpot", "Salesforce"],
    execute: async (ctx, input) => {
      const deals = await listDeals({
        workspaceId: ctx.workspaceId,
        query: input.query,
      });
      return { count: deals.length, deals };
    },
  });

  registerTool({
    name: "searchInvoices",
    description: "Search workspace invoices",
    requiredRole: "Viewer",
    schema: z.object({
      query: z.string().trim().max(100).optional(),
    }),
    integrations: ["Stripe", "Razorpay"],
    execute: async (ctx, input) => {
      const invoices = await listFinanceInvoices({
        workspaceId: ctx.workspaceId,
        query: input.query,
      });
      return { count: invoices.length, invoices };
    },
  });

  registerTool({
    name: "showDashboardSummary",
    description: "Show workspace dashboard summary",
    requiredRole: "Viewer",
    schema: z.object({}),
    integrations: ["Slack", "GitHub", "Linear"],
    execute: async (ctx) => {
      const snapshot = await getDashboardSnapshot({
        workspaceId: ctx.workspaceId,
        userId: ctx.userId,
        membershipCount: 1,
        role: ctx.workspaceRole,
        workspaceName: ctx.workspaceName,
      });
      return {
        workspace: snapshot.workspace,
        kpis: snapshot.kpis,
        crm: snapshot.crm,
        inbox: snapshot.inbox,
        finance: snapshot.finance,
      };
    },
  });

  registerTool({
    name: "deleteCustomer",
    description: "Delete customer from CRM",
    requiredRole: "Admin",
    destructive: true,
    confirmation: {
      title: "Delete customer?",
      body: "This permanently removes the customer from CRM.",
    },
    schema: z.object({
      id: z.string().uuid(),
    }),
    integrations: ["HubSpot"],
    execute: async (ctx, input) => {
      await deleteContact({
        workspaceId: ctx.workspaceId,
        id: input.id,
      });
      return { deleted: true, id: input.id };
    },
  });

  registerTool({
    name: "deleteDeal",
    description: "Delete deal from CRM",
    requiredRole: "Admin",
    destructive: true,
    confirmation: {
      title: "Delete deal?",
      body: "This permanently removes the deal from your pipeline.",
    },
    schema: z.object({
      id: z.string().uuid(),
    }),
    integrations: ["HubSpot", "Salesforce"],
    execute: async (ctx, input) => {
      await deleteDeal({
        workspaceId: ctx.workspaceId,
        id: input.id,
      });
      return { deleted: true, id: input.id };
    },
  });

  registerTool({
    name: "deleteInvoice",
    description: "Cancel an invoice (safe replacement for hard-delete)",
    requiredRole: "Admin",
    destructive: true,
    confirmation: {
      title: "Delete invoice?",
      body:
        "VanderBase uses a safe delete for invoices. Kairos will set status to cancelled.",
    },
    schema: z.object({
      id: z.string().uuid(),
    }),
    integrations: ["Stripe", "Razorpay"],
    execute: async (ctx, input) => {
      const invoice = await updateFinanceInvoiceStatus({
        workspaceId: ctx.workspaceId,
        id: input.id,
        status: "cancelled",
      });
      return { cancelled: true, invoice };
    },
  });

  for (const tool of buildKairosIntegrationTools()) {
    registerTool(tool);
  }
}

async function buildTimeline(
  workspaceId: string,
  userId: string,
): Promise<KairosTimelineItem[]> {
  const events = await listWorkspaceActivityEvents({
    workspaceId,
    actorId: userId,
    module: "ai",
    limit: 20,
  });
  return events
    .filter((event) => event.eventType.startsWith("kairos_action_"))
    .slice(0, 12)
    .map((event) => {
      const metadataTool =
        typeof event.metadata.tool === "string"
          ? event.metadata.tool
          : "unknown";
      const metadataResult =
        typeof event.metadata.result === "string"
          ? event.metadata.result
          : event.body ?? "";
      return {
        id: event.id,
        timestamp: event.createdAt,
        userId: event.actorId ?? userId,
        tool: metadataTool,
        status: event.eventType.endsWith("completed") ? "completed" : "failed",
        result: metadataResult,
      };
    });
}

async function logActionEvent(input: {
  context: KairosActionExecutionContext;
  tool: string;
  status: "completed" | "failed";
  result: string;
  entityId?: string | null;
}): Promise<void> {
  await createWorkspaceActivityEvent({
    workspaceId: input.context.workspaceId,
    module: "ai",
    eventType: `kairos_action_${input.status}`,
    title:
      input.status === "completed"
        ? `Kairos executed ${input.tool}`
        : `Kairos failed ${input.tool}`,
    body: truncate(input.result),
    entityType: "kairos_tool",
    entityId: input.entityId ?? null,
    userId: input.context.userId,
    actionUrl: "/chat",
    metadata: {
      tool: input.tool,
      result: truncate(input.result, 1000),
      role: input.context.agentRole,
    },
  });
}

export async function executeKairosActionCommand(input: {
  context: KairosActionExecutionContext;
  command: string;
  confirm?: boolean;
}): Promise<KairosActionResponse> {
  ensureDefaultKairosTools();
  const parsed = parseKairosActionCommand({
    command: input.command,
    selectedRecords: input.context.selectedRecords,
  });

  if (!parsed) {
    return {
      ok: false,
      status: "no_match",
      phase: "failed",
      message: "No matching business action found.",
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  }

  const tool = toolRegistry.get(parsed.tool);
  if (!tool) {
    return {
      ok: false,
      status: "failed",
      phase: "failed",
      message: `Tool not registered: ${parsed.tool}`,
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  }

  if (!toolRegistry.canExecute(tool, input.context)) {
    const message = `${input.context.agentRole} role cannot execute ${tool.name}.`;
    await logActionEvent({
      context: input.context,
      tool: tool.name,
      status: "failed",
      result: message,
    });
    return {
      ok: false,
      status: "unauthorized",
      phase: "failed",
      action: {
        tool: tool.name,
        label: parsed.label,
        destructive: Boolean(tool.destructive),
      },
      message,
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  }

  if (tool.destructive && !input.confirm) {
    return {
      ok: false,
      status: "confirmation_required",
      phase: "failed",
      action: {
        tool: tool.name,
        label: parsed.label,
        destructive: true,
      },
      message: "Confirmation required before destructive action.",
      confirmation: tool.confirmation ?? {
        title: "Confirm destructive action",
        body: "This action cannot be undone.",
      },
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  }

  try {
    const result = await toolRegistry.execute(tool, input.context, parsed.input);
    await logActionEvent({
      context: input.context,
      tool: tool.name,
      status: "completed",
      result: JSON.stringify(result),
    });
    return {
      ok: true,
      status: "completed",
      phase: "completed",
      action: {
        tool: tool.name,
        label: parsed.label,
        destructive: Boolean(tool.destructive),
      },
      result,
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    await logActionEvent({
      context: input.context,
      tool: tool.name,
      status: "failed",
      result: message,
    });
    return {
      ok: false,
      status: message.toLowerCase().includes("invalid")
        ? "validation_failed"
        : "failed",
      phase: "failed",
      action: {
        tool: tool.name,
        label: parsed.label,
        destructive: Boolean(tool.destructive),
      },
      message,
      timeline: await buildTimeline(input.context.workspaceId, input.context.userId),
    };
  }
}

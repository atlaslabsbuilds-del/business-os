import { z } from "zod";
import { defineTool, type RegisteredTool } from "./tool";

export type InboxToolDeps = {
  listThreads?: (input: {
    workspaceId: string;
    query?: string;
    status?: string;
    unreadOnly?: boolean;
    limit?: number;
  }) => Promise<
    Array<{
      id: string;
      subject: string;
      snippet: string;
      status: string;
      isUnread: boolean;
      provider?: string;
      lastMessageAt: string;
    }>
  >;
  summarize?: (input: {
    workspaceId: string;
    userId: string;
    threadId: string;
  }) => Promise<{ summary: string; credits?: number }>;
  reply?: (input: {
    workspaceId: string;
    userId: string;
    threadId: string;
    body?: string;
    useSmartReply?: boolean;
  }) => Promise<{ messageId: string; body: string }>;
  archive?: (input: {
    workspaceId: string;
    threadId: string;
  }) => Promise<{ archived: true }>;
  createTask?: (input: {
    workspaceId: string;
    userId: string;
    threadId?: string;
    title: string;
    description?: string | null;
    dueAt?: string | null;
  }) => Promise<{ id: string; title: string }>;
  scheduleMeeting?: (input: {
    workspaceId: string;
    userId: string;
    threadId?: string;
    title: string;
    startsAt: string;
    endsAt: string;
    location?: string | null;
  }) => Promise<{ id: string; title: string; startsAt: string }>;
  smartReply?: (input: {
    workspaceId: string;
    userId?: string;
    threadId: string;
    tone?: "professional" | "friendly" | "concise" | "detailed";
  }) => Promise<{ reply: string; tone?: string; draftId?: string }>;
  detectMeeting?: (input: {
    workspaceId: string;
    threadId: string;
  }) => Promise<{
    detected: boolean;
    confidence: number;
    suggestedTitle?: string;
  }>;
};

export function createInboxTools(deps: InboxToolDeps = {}): RegisteredTool[] {
  return [
    defineTool({
      name: "inbox.listThreads",
      description: "List unified inbox threads for the active workspace",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        query: z.string().trim().max(200).optional(),
        status: z.enum(["open", "archived", "trashed", "spam"]).optional(),
        unreadOnly: z.boolean().optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.listThreads) {
          return { threads: [], note: "inbox.listThreads not configured" };
        }
        const threads = await deps.listThreads({
          workspaceId: context.workspaceId,
          query: args.query,
          status: args.status,
          unreadOnly: args.unreadOnly,
          limit: args.limit,
        });
        return {
          count: threads.length,
          threads: threads.slice(0, args.limit ?? threads.length),
        };
      },
    }),

    defineTool({
      name: "inbox.summarize",
      description: "Generate an AI summary for an inbox thread",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.summarize) {
          return { summary: null, note: "inbox.summarize not configured" };
        }
        return deps.summarize({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
        });
      },
    }),

    defineTool({
      name: "inbox.reply",
      description: "Reply to an inbox thread, optionally with a smart AI draft",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
        body: z.string().trim().max(20000).optional(),
        useSmartReply: z.boolean().optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.reply) {
          return { sent: false, note: "inbox.reply not configured" };
        }
        const result = await deps.reply({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
          body: args.body,
          useSmartReply: args.useSmartReply ?? !args.body,
        });
        return { sent: true, ...result };
      },
    }),

    defineTool({
      name: "inbox.archive",
      description: "Archive an inbox thread",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.archive) {
          return { archived: false, note: "inbox.archive not configured" };
        }
        return deps.archive({
          workspaceId: context.workspaceId,
          threadId: args.threadId,
        });
      },
    }),

    defineTool({
      name: "inbox.createTask",
      description: "Create a task from an inbox thread",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(200),
        description: z.string().trim().max(4000).optional().nullable(),
        dueAt: z.string().optional().nullable(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.createTask) {
          return { created: false, note: "inbox.createTask not configured" };
        }
        const task = await deps.createTask({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
          title: args.title,
          description: args.description,
          dueAt: args.dueAt,
        });
        return { created: true, task };
      },
    }),

    defineTool({
      name: "inbox.scheduleMeeting",
      description: "Schedule a calendar meeting linked to an inbox thread",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid().optional(),
        title: z.string().trim().min(1).max(200),
        startsAt: z.string().min(1),
        endsAt: z.string().min(1),
        location: z.string().trim().max(240).optional().nullable(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.scheduleMeeting) {
          return {
            scheduled: false,
            note: "inbox.scheduleMeeting not configured",
          };
        }
        const event = await deps.scheduleMeeting({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
          title: args.title,
          startsAt: args.startsAt,
          endsAt: args.endsAt,
          location: args.location,
        });
        return { scheduled: true, event };
      },
    }),

    defineTool({
      name: "inbox.smartReply",
      description:
        "Generate a smart AI reply (professional/friendly/concise/detailed), create a Gmail draft, and save draft history",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
        tone: z
          .enum(["professional", "friendly", "concise", "detailed"])
          .optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.smartReply) {
          return { reply: null, note: "inbox.smartReply not configured" };
        }
        return deps.smartReply({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
          tone: args.tone,
        });
      },
    }),

    defineTool({
      name: "inbox.detectMeeting",
      description: "Detect whether an inbox thread is about scheduling a meeting",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.detectMeeting) {
          return { detected: false, note: "inbox.detectMeeting not configured" };
        }
        return deps.detectMeeting({
          workspaceId: context.workspaceId,
          threadId: args.threadId,
        });
      },
    }),
  ];
}

export function registerInboxTools(
  registry: {
    has: (name: string) => boolean;
    register: (tool: RegisteredTool) => unknown;
  },
  deps: InboxToolDeps = {},
): string[] {
  const registered: string[] = [];
  for (const tool of createInboxTools(deps)) {
    if (!registry.has(tool.name)) {
      registry.register(tool);
      registered.push(tool.name);
    }
  }
  return registered;
}

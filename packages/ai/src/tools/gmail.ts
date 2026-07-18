import { z } from "zod";
import { defineTool, type RegisteredTool } from "./tool";

export type GmailToolDeps = {
  sync?: (input: {
    workspaceId: string;
    userId: string;
    accountId: string;
    full?: boolean;
  }) => Promise<{
    mode: "full" | "incremental";
    threadsUpserted: number;
    messagesUpserted: number;
    labelsUpserted: number;
    attachmentsUpserted: number;
    historyId: string | null;
    summariesGenerated: number;
    tasksCreated: number;
    meetingsScheduled: number;
    linkedContacts: number;
    errors: Array<{ message: string; retries: number; at: string }>;
    progress: Record<string, unknown>;
  }>;
  listThreads?: (input: {
    workspaceId: string;
    accountId?: string;
    query?: string;
    limit?: number;
  }) => Promise<
    Array<{
      id: string;
      subject: string;
      snippet: string;
      status: string;
      isUnread: boolean;
      aiPriority?: string | null;
      lastMessageAt: string;
    }>
  >;
  readThread?: (input: {
    workspaceId: string;
    threadId: string;
  }) => Promise<{
    thread: {
      id: string;
      subject: string;
      aiSummary: string | null;
      aiPriority: string | null;
      aiClassification: string | null;
    };
    messages: Array<{
      id: string;
      fromEmail: string;
      bodyText: string;
      sentAt: string;
      direction: string;
    }>;
  } | null>;
  send?: (input: {
    workspaceId: string;
    userId: string;
    accountId: string;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    threadId?: string | null;
  }) => Promise<{ messageId: string; threadId: string }>;
  reply?: (input: {
    workspaceId: string;
    userId: string;
    threadId: string;
    body: string;
    replyAll?: boolean;
  }) => Promise<{ messageId: string; body: string }>;
  archive?: (input: {
    workspaceId: string;
    userId: string;
    threadId: string;
  }) => Promise<{ archived: true }>;
  delete?: (input: {
    workspaceId: string;
    userId: string;
    threadId: string;
  }) => Promise<{ deleted: true }>;
  createDraft?: (input: {
    workspaceId: string;
    userId: string;
    accountId: string;
    to: string[];
    subject: string;
    body: string;
    threadId?: string | null;
  }) => Promise<{ draftId: string }>;
  search?: (input: {
    workspaceId: string;
    userId: string;
    accountId?: string;
    query: string;
    limit?: number;
  }) => Promise<{
    threads: Array<{ id: string; subject: string; snippet: string }>;
  }>;
};

export function createGmailTools(deps: GmailToolDeps = {}): RegisteredTool[] {
  return [
    defineTool({
      name: "gmail.sync",
      description: "Sync a connected Gmail account (full or incremental)",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        accountId: z.string().uuid(),
        full: z.boolean().optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.sync) return { synced: false, note: "gmail.sync not configured" };
        const result = await deps.sync({
          workspaceId: context.workspaceId,
          userId: context.userId,
          accountId: args.accountId,
          full: args.full,
        });
        return { synced: true, ...result };
      },
    }),

    defineTool({
      name: "gmail.listThreads",
      description: "List Gmail threads for the workspace inbox",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        accountId: z.string().uuid().optional(),
        query: z.string().trim().max(500).optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.listThreads) {
          return { threads: [], note: "gmail.listThreads not configured" };
        }
        const threads = await deps.listThreads({
          workspaceId: context.workspaceId,
          accountId: args.accountId,
          query: args.query,
          limit: args.limit,
        });
        return { count: threads.length, threads };
      },
    }),

    defineTool({
      name: "gmail.readThread",
      description: "Read a Gmail thread with messages",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) throw new Error("Workspace context is required");
        if (!deps.readThread) {
          return { thread: null, note: "gmail.readThread not configured" };
        }
        return deps.readThread({
          workspaceId: context.workspaceId,
          threadId: args.threadId,
        });
      },
    }),

    defineTool({
      name: "gmail.send",
      description: "Send a new Gmail message",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        accountId: z.string().uuid(),
        to: z.array(z.string().email()).min(1),
        cc: z.array(z.string().email()).optional(),
        subject: z.string().trim().min(1).max(998),
        body: z.string().trim().min(1).max(200000),
        threadId: z.string().uuid().optional().nullable(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.send) return { sent: false, note: "gmail.send not configured" };
        const result = await deps.send({
          workspaceId: context.workspaceId,
          userId: context.userId,
          ...args,
        });
        return { sent: true, ...result };
      },
    }),

    defineTool({
      name: "gmail.reply",
      description: "Reply to a Gmail thread",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
        body: z.string().trim().min(1).max(200000),
        replyAll: z.boolean().optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.reply) return { sent: false, note: "gmail.reply not configured" };
        const result = await deps.reply({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
          body: args.body,
          replyAll: args.replyAll,
        });
        return { sent: true, ...result };
      },
    }),

    defineTool({
      name: "gmail.archive",
      description: "Archive a Gmail thread (remove INBOX label)",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.archive) {
          return { archived: false, note: "gmail.archive not configured" };
        }
        return deps.archive({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
        });
      },
    }),

    defineTool({
      name: "gmail.delete",
      description: "Move a Gmail thread to trash",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        threadId: z.string().uuid(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.delete) {
          return { deleted: false, note: "gmail.delete not configured" };
        }
        return deps.delete({
          workspaceId: context.workspaceId,
          userId: context.userId,
          threadId: args.threadId,
        });
      },
    }),

    defineTool({
      name: "gmail.createDraft",
      description: "Create a Gmail draft",
      permissions: ["inbox:write", "workspace:write"],
      parameters: z.object({
        accountId: z.string().uuid(),
        to: z.array(z.string().email()).min(1),
        subject: z.string().trim().min(1).max(998),
        body: z.string().trim().min(1).max(200000),
        threadId: z.string().uuid().optional().nullable(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.createDraft) {
          return { created: false, note: "gmail.createDraft not configured" };
        }
        const result = await deps.createDraft({
          workspaceId: context.workspaceId,
          userId: context.userId,
          ...args,
        });
        return { created: true, ...result };
      },
    }),

    defineTool({
      name: "gmail.search",
      description: "Search Gmail with a Gmail query string",
      permissions: ["inbox:read", "workspace:read"],
      parameters: z.object({
        accountId: z.string().uuid().optional(),
        query: z.string().trim().min(1).max(500),
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace and user context are required");
        }
        if (!deps.search) {
          return { threads: [], note: "gmail.search not configured" };
        }
        return deps.search({
          workspaceId: context.workspaceId,
          userId: context.userId,
          accountId: args.accountId,
          query: args.query,
          limit: args.limit,
        });
      },
    }),
  ];
}

export function registerGmailTools(
  registry: {
    has: (name: string) => boolean;
    register: (tool: RegisteredTool) => unknown;
  },
  deps: GmailToolDeps = {},
): string[] {
  const registered: string[] = [];
  for (const tool of createGmailTools(deps)) {
    if (!registry.has(tool.name)) {
      registry.register(tool);
      registered.push(tool.name);
    }
  }
  return registered;
}

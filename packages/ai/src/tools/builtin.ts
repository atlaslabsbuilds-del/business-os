import { z } from "zod";
import type { KnowledgeIndex } from "../knowledge";
import type { WorkspaceMemory } from "../memory/workspace-memory";
import type { VectorStore } from "../types/ai";
import { vectorSearch } from "../vector/vector-search";
import { defineTool, type RegisteredTool } from "./tool";

export type CoreToolDeps = {
  getWorkspaceInfo?: (context: {
    workspaceId: string;
    userId: string;
  }) => Promise<{
    id: string;
    name: string;
    slug: string;
    logoUrl?: string | null;
  } | null>;
  getCurrentUser?: (context: { userId: string }) => Promise<{
    id: string;
    email?: string | null;
    fullName?: string | null;
  } | null>;
  getRemainingCredits?: (context: {
    workspaceId: string;
  }) => Promise<{ balance: number }>;
  listTeamMembers?: (context: {
    workspaceId: string;
  }) => Promise<
    Array<{
      userId: string;
      role: string;
      email?: string | null;
      fullName?: string | null;
    }>
  >;
  searchKnowledge?: (input: {
    workspaceId: string;
    query: string;
    limit?: number;
  }) => Promise<
    Array<{
      id: string;
      score: number;
      content: string;
      metadata?: Record<string, unknown>;
      citation?: {
        title: string;
        documentId: string;
        excerpt: string;
      };
    }>
  >;
  /** Preferred: wire the Knowledge Index for RAG search. */
  knowledgeIndex?: KnowledgeIndex;
  /** Preferred: wire Workspace Memory for long-term facts. */
  workspaceMemory?: WorkspaceMemory;
  vectorStore?: VectorStore;
  embeddings?: {
    embed: (text: string) => Promise<number[]>;
  };
};

export function createCoreTools(deps: CoreToolDeps = {}): RegisteredTool[] {
  const tools: RegisteredTool[] = [];

  tools.push(
    defineTool({
      name: "getWorkspaceInfo",
      description: "Get information about the active workspace",
      permissions: ["workspace:read"],
      parameters: z.object({}),
      execute: async (_args, context) => {
        if (!context.workspaceId || !context.userId) {
          throw new Error("Workspace context is required");
        }
        if (!deps.getWorkspaceInfo) {
          return {
            workspaceId: context.workspaceId,
            note: "Workspace resolver not configured",
          };
        }
        const workspace = await deps.getWorkspaceInfo({
          workspaceId: context.workspaceId,
          userId: context.userId,
        });
        if (!workspace) {
          throw new Error("Workspace not found");
        }
        return workspace;
      },
    }),
  );

  tools.push(
    defineTool({
      name: "getCurrentUser",
      description: "Get the currently authenticated user profile",
      permissions: ["user:read"],
      parameters: z.object({}),
      execute: async (_args, context) => {
        if (!context.userId) {
          throw new Error("User context is required");
        }
        if (!deps.getCurrentUser) {
          return { id: context.userId, note: "User resolver not configured" };
        }
        const user = await deps.getCurrentUser({ userId: context.userId });
        if (!user) {
          throw new Error("User not found");
        }
        return user;
      },
    }),
  );

  tools.push(
    defineTool({
      name: "getRemainingCredits",
      description: "Get remaining AI credits for the active workspace",
      permissions: ["credits:read"],
      parameters: z.object({}),
      execute: async (_args, context) => {
        if (!context.workspaceId) {
          throw new Error("Workspace context is required");
        }
        if (!deps.getRemainingCredits) {
          return {
            workspaceId: context.workspaceId,
            balance: null,
            note: "Credit resolver not configured",
          };
        }
        return deps.getRemainingCredits({ workspaceId: context.workspaceId });
      },
    }),
  );

  tools.push(
    defineTool({
      name: "listTeamMembers",
      description: "List members of the active workspace team",
      permissions: ["team:read"],
      parameters: z.object({
        limit: z.number().int().positive().max(100).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) {
          throw new Error("Workspace context is required");
        }
        if (!deps.listTeamMembers) {
          return {
            workspaceId: context.workspaceId,
            members: [],
            note: "Team resolver not configured",
          };
        }
        const members = await deps.listTeamMembers({
          workspaceId: context.workspaceId,
        });
        return {
          count: members.length,
          members: members.slice(0, args.limit ?? members.length),
        };
      },
    }),
  );

  tools.push(
    defineTool({
      name: "searchKnowledge",
      description: "Search workspace knowledge using semantic vector search",
      permissions: ["knowledge:read"],
      parameters: z.object({
        query: z.string().trim().min(1).max(2000),
        limit: z.number().int().positive().max(20).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) {
          throw new Error("Workspace context is required");
        }

        if (deps.knowledgeIndex) {
          const hits = await deps.knowledgeIndex.search({
            workspaceId: context.workspaceId,
            query: args.query,
            topK: args.limit ?? 5,
          });
          return {
            query: args.query,
            hits: hits.map((hit) => ({
              id: hit.chunk.id,
              score: hit.score,
              content: hit.chunk.content,
              metadata: hit.chunk.metadata,
              citation: {
                title: hit.citation.title,
                documentId: hit.citation.documentId,
                excerpt: hit.citation.excerpt,
              },
            })),
          };
        }

        if (deps.searchKnowledge) {
          const hits = await deps.searchKnowledge({
            workspaceId: context.workspaceId,
            query: args.query,
            limit: args.limit ?? 5,
          });
          return { query: args.query, hits };
        }

        if (deps.vectorStore && deps.embeddings) {
          const vector = await deps.embeddings.embed(args.query);
          const response = await vectorSearch(deps.vectorStore, {
            namespace: context.workspaceId,
            vector,
            topK: args.limit ?? 5,
          });
          return {
            query: args.query,
            hits: response.hits.map((hit) => ({
              id: hit.id,
              score: hit.score,
              content: String(hit.metadata?.content ?? ""),
              metadata: hit.metadata,
            })),
          };
        }

        return {
          query: args.query,
          hits: [],
          note: "Knowledge search is not configured for this workspace",
        };
      },
    }),
  );

  tools.push(
    defineTool({
      name: "rememberWorkspaceFact",
      description:
        "Store a durable fact in long-term workspace memory for future conversations",
      permissions: ["knowledge:write"],
      parameters: z.object({
        content: z.string().trim().min(1).max(4000),
        category: z.string().trim().max(80).optional(),
        importance: z.number().min(0).max(1).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) {
          throw new Error("Workspace context is required");
        }
        if (!deps.workspaceMemory) {
          return {
            stored: false,
            note: "Workspace memory is not configured",
          };
        }
        const fact = await deps.workspaceMemory.remember({
          workspaceId: context.workspaceId,
          userId: context.userId,
          content: args.content,
          category: args.category,
          importance: args.importance,
        });
        return { stored: true, factId: fact.id, content: fact.content };
      },
    }),
  );

  tools.push(
    defineTool({
      name: "recallWorkspaceMemory",
      description:
        "Recall relevant long-term facts from workspace memory using semantic search",
      permissions: ["knowledge:read"],
      parameters: z.object({
        query: z.string().trim().min(1).max(2000),
        limit: z.number().int().positive().max(20).optional(),
      }),
      execute: async (args, context) => {
        if (!context.workspaceId) {
          throw new Error("Workspace context is required");
        }
        if (!deps.workspaceMemory) {
          return {
            query: args.query,
            facts: [],
            note: "Workspace memory is not configured",
          };
        }
        const facts = await deps.workspaceMemory.recall({
          workspaceId: context.workspaceId,
          query: args.query,
          topK: args.limit ?? 5,
        });
        return {
          query: args.query,
          facts: facts.map((fact) => ({
            id: fact.id,
            content: fact.content,
            category: fact.category,
            importance: fact.importance,
          })),
        };
      },
    }),
  );

  return tools;
}

export const echoTool = defineTool({
  name: "echo",
  description: "Echo back a message for infrastructure testing",
  parameters: z.object({
    message: z.string(),
  }),
  execute: (args) => ({ echo: args.message }),
});

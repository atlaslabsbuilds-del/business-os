import type { EmbeddingsClient } from "../embeddings/embeddings";
import { cosineSimilarity } from "../embeddings/embeddings";
import type { AiLogger, VectorStore } from "../types/ai";
import { createConsoleLogger, createId } from "../utils";
import { createVectorStore } from "../vector/vector-search";
import type { MemoryCleanupResult, WorkspaceMemoryFact } from "./types";

export type WorkspaceMemoryOptions = {
  embeddings?: EmbeddingsClient;
  vectorStore?: VectorStore;
  logger?: AiLogger;
  /** Default importance for new facts (0–1). */
  defaultImportance?: number;
  namespacePrefix?: string;
};

export type WorkspaceMemory = {
  remember: (input: {
    workspaceId: string;
    content: string;
    userId?: string;
    category?: string;
    importance?: number;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }) => Promise<WorkspaceMemoryFact>;
  recall: (input: {
    workspaceId: string;
    query: string;
    topK?: number;
    minScore?: number;
    category?: string;
  }) => Promise<WorkspaceMemoryFact[]>;
  list: (input: {
    workspaceId: string;
    category?: string;
    limit?: number;
  }) => Promise<WorkspaceMemoryFact[]>;
  forget: (input: { workspaceId: string; factId: string }) => Promise<void>;
  cleanup: (input?: {
    workspaceId?: string;
    expiredOnly?: boolean;
  }) => Promise<MemoryCleanupResult>;
};

/**
 * Long-term workspace memory with optional semantic recall via embeddings.
 */
export function createWorkspaceMemory(
  options: WorkspaceMemoryOptions = {},
): WorkspaceMemory {
  const logger = options.logger ?? createConsoleLogger("@repo/ai/memory");
  const vectorStore = options.vectorStore ?? createVectorStore();
  const defaultImportance = options.defaultImportance ?? 0.5;
  const namespacePrefix = options.namespacePrefix ?? "workspace_memory";
  const facts = new Map<string, WorkspaceMemoryFact>();

  function namespace(workspaceId: string): string {
    return `${namespacePrefix}:${workspaceId}`;
  }

  function isExpired(fact: WorkspaceMemoryFact, now = Date.now()): boolean {
    if (!fact.expiresAt) return false;
    const expires = Date.parse(fact.expiresAt);
    return !Number.isNaN(expires) && expires <= now;
  }

  return {
    async remember(input) {
      const now = new Date().toISOString();
      const id = createId("fact");
      let embedding: number[] | undefined;

      if (options.embeddings) {
        embedding = await options.embeddings.embedQuery(input.content);
        await vectorStore.upsert({
          namespace: namespace(input.workspaceId),
          records: [
            {
              id,
              values: embedding,
              metadata: {
                workspaceId: input.workspaceId,
                content: input.content,
                category: input.category,
                importance: input.importance ?? defaultImportance,
                userId: input.userId,
              },
            },
          ],
        });
      }

      const fact: WorkspaceMemoryFact = {
        id,
        workspaceId: input.workspaceId,
        userId: input.userId,
        content: input.content,
        category: input.category,
        importance: input.importance ?? defaultImportance,
        embedding,
        metadata: input.metadata,
        createdAt: now,
        updatedAt: now,
        expiresAt: input.expiresAt,
      };

      facts.set(id, fact);
      logger.info("memory.workspace.remember", {
        workspaceId: input.workspaceId,
        factId: id,
        category: input.category,
      });
      return fact;
    },

    async recall(input) {
      const topK = input.topK ?? 5;
      const minScore = input.minScore ?? 0.15;
      const now = Date.now();

      if (options.embeddings) {
        const queryVector = await options.embeddings.embedQuery(input.query);
        const response = await vectorStore.search({
          namespace: namespace(input.workspaceId),
          vector: queryVector,
          topK: topK * 2,
          filter: input.category ? { category: input.category } : undefined,
        });

        const recalled: WorkspaceMemoryFact[] = [];
        for (const hit of response.hits) {
          if (hit.score < minScore) continue;
          const fact = facts.get(hit.id);
          if (!fact || fact.workspaceId !== input.workspaceId) continue;
          if (isExpired(fact, now)) continue;
          recalled.push(fact);
          if (recalled.length >= topK) break;
        }
        return recalled;
      }

      // Fallback: lexical relevance when embeddings are unavailable.
      const query = input.query.toLowerCase();
      return [...facts.values()]
        .filter((fact) => {
          if (fact.workspaceId !== input.workspaceId) return false;
          if (isExpired(fact, now)) return false;
          if (input.category && fact.category !== input.category) return false;
          return fact.content.toLowerCase().includes(query) || query.length < 3;
        })
        .sort((a, b) => b.importance - a.importance)
        .slice(0, topK);
    },

    async list(input) {
      const now = Date.now();
      return [...facts.values()]
        .filter((fact) => {
          if (fact.workspaceId !== input.workspaceId) return false;
          if (isExpired(fact, now)) return false;
          if (input.category && fact.category !== input.category) return false;
          return true;
        })
        .sort(
          (a, b) =>
            b.importance - a.importance ||
            Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
        )
        .slice(0, input.limit ?? 50);
    },

    async forget(input) {
      const fact = facts.get(input.factId);
      if (!fact || fact.workspaceId !== input.workspaceId) {
        return;
      }
      facts.delete(input.factId);
      if (vectorStore.delete) {
        await vectorStore.delete([input.factId], namespace(input.workspaceId));
      }
      logger.info("memory.workspace.forget", {
        workspaceId: input.workspaceId,
        factId: input.factId,
      });
    },

    async cleanup(input = {}) {
      const now = Date.now();
      const expiredOnly = input.expiredOnly !== false;
      let deletedFacts = 0;
      const toDelete: string[] = [];

      for (const [id, fact] of facts.entries()) {
        if (input.workspaceId && fact.workspaceId !== input.workspaceId) {
          continue;
        }
        if (expiredOnly && !isExpired(fact, now)) {
          continue;
        }
        toDelete.push(id);
      }

      for (const id of toDelete) {
        const fact = facts.get(id);
        if (!fact) continue;
        facts.delete(id);
        if (vectorStore.delete) {
          await vectorStore.delete([id], namespace(fact.workspaceId));
        }
        deletedFacts += 1;
      }

      logger.info("memory.workspace.cleanup", { deletedFacts, expiredOnly });
      return {
        deletedSessions: 0,
        deletedFacts,
        deletedSummaries: 0,
      };
    },
  };
}

/** Score a fact against a query vector when embeddings are already available. */
export function scoreFactAgainstQuery(
  fact: WorkspaceMemoryFact,
  queryVector: number[],
): number {
  if (!fact.embedding) return 0;
  return cosineSimilarity(fact.embedding, queryVector);
}

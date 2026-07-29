import type {
  KairosMemoryContext,
  KairosMemoryRecord,
  KairosSemanticSearchAdapter,
} from "@repo/types";

export type KairosMemoryPersistence = {
  list: (input: {
    workspaceId: string;
    userId?: string;
    scope?: string;
    limit?: number;
  }) => Promise<KairosMemoryRecord[]>;
  upsert: (record: KairosMemoryRecord) => Promise<KairosMemoryRecord>;
  delete: (input: { workspaceId: string; id: string }) => Promise<void>;
};

export type KairosMemoryService = {
  remember: (record: Omit<KairosMemoryRecord, "id" | "createdAt" | "updatedAt">) => Promise<KairosMemoryRecord>;
  recall: (input: {
    workspaceId: string;
    query: string;
    userId?: string;
    topK?: number;
  }) => Promise<Array<KairosMemoryRecord & { score?: number }>>;
  buildPromptContext: (input: {
    context: KairosMemoryContext;
    query?: string;
  }) => Promise<string>;
  forget: (input: { workspaceId: string; id: string }) => Promise<void>;
};

/**
 * Provider-neutral Kairos memory orchestration.
 *
 * Persistence and semantic search are injected, so this service works before
 * embeddings are configured and can later use pgvector, hosted search, or any
 * other adapter without changing chat code.
 */
export function createKairosMemoryService(input: {
  persistence: KairosMemoryPersistence;
  semanticSearch?: KairosSemanticSearchAdapter;
}): KairosMemoryService {
  return {
    async remember(record) {
      const now = new Date().toISOString();
      const next = await input.persistence.upsert({
        ...record,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      });
      if (input.semanticSearch) {
        await input.semanticSearch.upsert([next]);
      }
      return next;
    },

    async recall({ workspaceId, query, userId, topK = 8 }) {
      if (input.semanticSearch) {
        return input.semanticSearch.search({ workspaceId, query, topK });
      }

      const records = await input.persistence.list({
        workspaceId,
        userId,
        limit: 100,
      });
      const normalized = query.toLowerCase();
      return records
        .filter((record) => record.content.toLowerCase().includes(normalized))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, topK)
        .map((record) => ({ ...record, score: 1 }));
    },

    async buildPromptContext({ context, query }) {
      const recalled = query
        ? await this.recall({
            workspaceId: context.workspaceId,
            query,
            topK: 8,
          })
        : [];
      return JSON.stringify({
        ...context,
        recalledMemory: recalled,
      });
    },

    async forget({ workspaceId, id }) {
      await input.persistence.delete({ workspaceId, id });
      await input.semanticSearch?.delete([id], workspaceId);
    },
  };
}

import type { AiLogger, VectorStore } from "../types/ai";
import { createConsoleLogger } from "../utils";
import type { KnowledgeEmbeddings } from "./embeddings";
import type {
  KnowledgeCitation,
  KnowledgeDocument,
  KnowledgeSearchHit,
} from "./types";

export type KnowledgeStoreLike = {
  getDocument: (
    workspaceId: string,
    documentId: string,
  ) => KnowledgeDocument | undefined;
  getChunk: (
    workspaceId: string,
    chunkId: string,
  ) =>
    | {
        id: string;
        documentId: string;
        workspaceId: string;
        index: number;
        content: string;
        embedding?: number[];
        metadata?: Record<string, unknown>;
        createdAt: string;
      }
    | undefined;
};

export type KnowledgeRetriever = {
  retrieve: (input: {
    workspaceId: string;
    query: string;
    topK?: number;
    minScore?: number;
    filter?: Record<string, unknown>;
  }) => Promise<KnowledgeSearchHit[]>;
  formatForPrompt: (hits: KnowledgeSearchHit[]) => string;
  toCitations: (hits: KnowledgeSearchHit[]) => KnowledgeCitation[];
};

export function createKnowledgeRetriever(input: {
  embeddings: KnowledgeEmbeddings;
  vectorStore: VectorStore;
  store: KnowledgeStoreLike;
  logger?: AiLogger;
  namespacePrefix?: string;
}): KnowledgeRetriever {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/knowledge");
  const namespacePrefix = input.namespacePrefix ?? "knowledge";

  function namespace(workspaceId: string): string {
    return `${namespacePrefix}:${workspaceId}`;
  }

  return {
    toCitations(hits) {
      return hits.map((hit) => hit.citation);
    },

    formatForPrompt(hits) {
      if (hits.length === 0) return "";
      return hits
        .map((hit, index) => {
          const title = hit.document.title;
          const source = hit.document.source
            ? ` (${hit.document.source})`
            : "";
          return `[${index + 1}] ${title}${source}\n${hit.chunk.content}`;
        })
        .join("\n\n");
    },

    async retrieve({ workspaceId, query, topK = 5, minScore = 0.1, filter }) {
      const vector = await input.embeddings.embedQuery(query);
      const response = await input.vectorStore.search({
        namespace: namespace(workspaceId),
        vector,
        topK: topK * 2,
        filter,
      });

      const hits: KnowledgeSearchHit[] = [];

      for (const hit of response.hits) {
        if (hit.score < minScore) continue;
        const chunk = input.store.getChunk(workspaceId, hit.id);
        if (!chunk) continue;
        const document = input.store.getDocument(workspaceId, chunk.documentId);
        if (!document) continue;

        hits.push({
          chunk,
          document,
          score: hit.score,
          citation: {
            id: chunk.id,
            documentId: document.id,
            chunkId: chunk.id,
            title: document.title,
            excerpt: chunk.content.slice(0, 280),
            score: hit.score,
            source: document.source,
            metadata: {
              ...document.metadata,
              chunkIndex: chunk.index,
            },
          },
        });

        if (hits.length >= topK) break;
      }

      logger.debug("knowledge.retrieve.done", {
        workspaceId,
        queryChars: query.length,
        hits: hits.length,
      });

      return hits;
    },
  };
}

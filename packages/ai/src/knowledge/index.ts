import type { AiGateway } from "../gateway";
import type { AiLogger, VectorStore } from "../types/ai";
import { createConsoleLogger, createId } from "../utils";
import { createVectorStore } from "../vector/vector-search";
import { buildKnowledgeChunks, type ChunkingOptions } from "./chunks";
import {
  createKnowledgeEmbeddings,
  type KnowledgeEmbeddings,
} from "./embeddings";
import {
  createKnowledgeRetriever,
  type KnowledgeRetriever,
} from "./retrieval";
import type {
  KnowledgeDocument,
  KnowledgeIngestInput,
  KnowledgeSearchHit,
} from "./types";
import type { KnowledgeChunk } from "./types";

export type KnowledgeIndex = {
  ingest: (
    input: KnowledgeIngestInput,
    options?: { chunking?: ChunkingOptions; model?: string },
  ) => Promise<{
    document: KnowledgeDocument;
    chunks: KnowledgeChunk[];
  }>;
  deleteDocument: (input: {
    workspaceId: string;
    documentId: string;
  }) => Promise<void>;
  getDocument: (
    workspaceId: string,
    documentId: string,
  ) => KnowledgeDocument | undefined;
  listDocuments: (workspaceId: string) => KnowledgeDocument[];
  search: (input: {
    workspaceId: string;
    query: string;
    topK?: number;
    minScore?: number;
  }) => Promise<KnowledgeSearchHit[]>;
  retrieve: KnowledgeRetriever["retrieve"];
  formatForPrompt: KnowledgeRetriever["formatForPrompt"];
  cleanup: (input?: { workspaceId?: string }) => Promise<{
    deletedDocuments: number;
    deletedChunks: number;
  }>;
};

export type CreateKnowledgeIndexInput = {
  gateway?: AiGateway;
  embeddings?: KnowledgeEmbeddings;
  vectorStore?: VectorStore;
  logger?: AiLogger;
  namespacePrefix?: string;
  defaultChunking?: ChunkingOptions;
};

/**
 * RAG-ready knowledge index: ingest → chunk → embed → vector search → citations.
 */
export function createKnowledgeIndex(
  options: CreateKnowledgeIndexInput = {},
): KnowledgeIndex {
  const logger = options.logger ?? createConsoleLogger("@repo/ai/knowledge");
  const vectorStore = options.vectorStore ?? createVectorStore();
  const namespacePrefix = options.namespacePrefix ?? "knowledge";

  const embeddings =
    options.embeddings ??
    (options.gateway
      ? createKnowledgeEmbeddings({ gateway: options.gateway, logger })
      : undefined);

  if (!embeddings) {
    throw new Error(
      "Knowledge index requires an AI Gateway or KnowledgeEmbeddings client",
    );
  }

  const documents = new Map<string, KnowledgeDocument>();
  const chunks = new Map<string, KnowledgeChunk>();

  function docKey(workspaceId: string, documentId: string): string {
    return `${workspaceId}:${documentId}`;
  }

  function namespace(workspaceId: string): string {
    return `${namespacePrefix}:${workspaceId}`;
  }

  const storeAdapter = {
    getDocument(workspaceId: string, documentId: string) {
      return documents.get(docKey(workspaceId, documentId));
    },
    getChunk(workspaceId: string, chunkId: string) {
      const chunk = chunks.get(chunkId);
      if (!chunk || chunk.workspaceId !== workspaceId) return undefined;
      return chunk;
    },
  };

  const retriever = createKnowledgeRetriever({
    embeddings,
    vectorStore,
    store: storeAdapter,
    logger,
    namespacePrefix,
  });

  async function removeDocumentVectors(
    workspaceId: string,
    documentId: string,
  ): Promise<number> {
    const toRemove = [...chunks.values()].filter(
      (chunk) =>
        chunk.workspaceId === workspaceId && chunk.documentId === documentId,
    );
    if (toRemove.length > 0 && vectorStore.delete) {
      await vectorStore.delete(
        toRemove.map((chunk) => chunk.id),
        namespace(workspaceId),
      );
    }
    for (const chunk of toRemove) {
      chunks.delete(chunk.id);
    }
    return toRemove.length;
  }

  return {
    async ingest(input, ingestOptions) {
      const documentId = input.documentId ?? createId("doc");
      const now = new Date().toISOString();
      const existing = documents.get(docKey(input.workspaceId, documentId));

      if (existing) {
        await removeDocumentVectors(input.workspaceId, documentId);
      }

      const rawChunks = buildKnowledgeChunks({
        workspaceId: input.workspaceId,
        documentId,
        content: input.content,
        options: ingestOptions?.chunking ?? options.defaultChunking,
        metadata: {
          ...input.metadata,
          title: input.title,
          source: input.source,
        },
      });

      const embeddedChunks = await embeddings.embedChunks(rawChunks, {
        model: ingestOptions?.model,
      });

      await vectorStore.upsert({
        namespace: namespace(input.workspaceId),
        records: embeddedChunks.map((chunk) => ({
          id: chunk.id,
          values: chunk.embedding ?? [],
          metadata: {
            workspaceId: chunk.workspaceId,
            documentId: chunk.documentId,
            content: chunk.content,
            title: input.title,
            source: input.source,
            chunkIndex: chunk.index,
            ...chunk.metadata,
          },
        })),
      });

      for (const chunk of embeddedChunks) {
        chunks.set(chunk.id, chunk);
      }

      const document: KnowledgeDocument = {
        id: documentId,
        workspaceId: input.workspaceId,
        title: input.title,
        source: input.source,
        content: input.content,
        metadata: input.metadata,
        chunkCount: embeddedChunks.length,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };

      documents.set(docKey(input.workspaceId, documentId), document);

      logger.info("knowledge.ingest.done", {
        workspaceId: input.workspaceId,
        documentId,
        chunks: embeddedChunks.length,
      });

      return { document, chunks: embeddedChunks };
    },

    async deleteDocument({ workspaceId, documentId }) {
      const deleted = await removeDocumentVectors(workspaceId, documentId);
      documents.delete(docKey(workspaceId, documentId));
      logger.info("knowledge.delete", { workspaceId, documentId, deleted });
    },

    getDocument(workspaceId, documentId) {
      return documents.get(docKey(workspaceId, documentId));
    },

    listDocuments(workspaceId) {
      return [...documents.values()]
        .filter((doc) => doc.workspaceId === workspaceId)
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
    },

    search(input) {
      return retriever.retrieve(input);
    },

    retrieve: (input) => retriever.retrieve(input),
    formatForPrompt: (hits) => retriever.formatForPrompt(hits),

    async cleanup(input = {}) {
      let deletedDocuments = 0;
      let deletedChunks = 0;
      const keys = [...documents.keys()];

      for (const key of keys) {
        const document = documents.get(key);
        if (!document) continue;
        if (input.workspaceId && document.workspaceId !== input.workspaceId) {
          continue;
        }
        deletedChunks += await removeDocumentVectors(
          document.workspaceId,
          document.id,
        );
        documents.delete(key);
        deletedDocuments += 1;
      }

      logger.info("knowledge.cleanup", { deletedDocuments, deletedChunks });
      return { deletedDocuments, deletedChunks };
    },
  };
}

export { chunkText, buildKnowledgeChunks, estimateChunkTokens } from "./chunks";
export {
  createKnowledgeEmbeddings,
  type KnowledgeEmbeddings,
} from "./embeddings";
export {
  createKnowledgeRetriever,
  type KnowledgeRetriever,
  type KnowledgeStoreLike,
} from "./retrieval";
export type {
  KnowledgeDocument,
  KnowledgeChunk,
  KnowledgeCitation,
  KnowledgeSearchHit,
  KnowledgeIngestInput,
  ChunkingOptions,
} from "./types";

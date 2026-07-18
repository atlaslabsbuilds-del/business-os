import {
  createEmbeddingsClient,
  type EmbeddingsClient,
} from "../embeddings/embeddings";
import type { AiGateway } from "../gateway";
import type { AiLogger, AiProviderId } from "../types/ai";
import { createConsoleLogger } from "../utils";
import type { KnowledgeChunk } from "./types";

export type KnowledgeEmbeddings = {
  embedTexts: (
    texts: string[],
    options?: { model?: string; provider?: AiProviderId },
  ) => Promise<number[][]>;
  embedQuery: (
    query: string,
    options?: { model?: string; provider?: AiProviderId },
  ) => Promise<number[]>;
  embedChunks: (
    chunks: KnowledgeChunk[],
    options?: { model?: string; provider?: AiProviderId; batchSize?: number },
  ) => Promise<KnowledgeChunk[]>;
};

/**
 * Knowledge-layer embeddings interface over the AI Gateway.
 * Batches chunk embedding for indexing pipelines.
 */
export function createKnowledgeEmbeddings(input: {
  gateway?: AiGateway;
  client?: EmbeddingsClient;
  logger?: AiLogger;
}): KnowledgeEmbeddings {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/knowledge");
  const client =
    input.client ??
    (input.gateway ? createEmbeddingsClient(input.gateway) : undefined);

  if (!client) {
    throw new Error(
      "Knowledge embeddings require an AI Gateway or EmbeddingsClient",
    );
  }

  return {
    async embedTexts(texts, options) {
      if (texts.length === 0) return [];
      const response = await client.embed(texts, options);
      return response.embeddings;
    },

    async embedQuery(query, options) {
      return client.embedQuery(query, options);
    },

    async embedChunks(chunks, options) {
      const batchSize = options?.batchSize ?? 16;
      const embedded: KnowledgeChunk[] = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const vectors = await this.embedTexts(
          batch.map((chunk) => chunk.content),
          options,
        );

        for (let j = 0; j < batch.length; j += 1) {
          const chunk = batch[j];
          const vector = vectors[j];
          if (!chunk || !vector) continue;
          embedded.push({ ...chunk, embedding: vector });
        }

        logger.debug("knowledge.embeddings.batch", {
          offset: i,
          size: batch.length,
        });
      }

      return embedded;
    },
  };
}

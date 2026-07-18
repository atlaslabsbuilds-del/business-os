import type { AiProviderId } from "../types/ai";
import type { AiGateway } from "../gateway";
import type { EmbeddingResponse } from "../types/ai";

export type EmbeddingsClient = {
  embed: (
    input: string | string[],
    options?: { model?: string; provider?: AiProviderId },
  ) => Promise<EmbeddingResponse>;
  embedQuery: (
    query: string,
    options?: { model?: string; provider?: AiProviderId },
  ) => Promise<number[]>;
};

export function createEmbeddingsClient(gateway: AiGateway): EmbeddingsClient {
  return {
    async embed(input, options) {
      return gateway.embed({
        input,
        model: options?.model,
        provider: options?.provider,
      });
    },

    async embedQuery(query, options) {
      const response = await gateway.embed({
        input: query,
        model: options?.model,
        provider: options?.provider,
      });
      const vector = response.embeddings[0];
      if (!vector) {
        throw new Error("Embedding provider returned no vectors");
      }
      return vector;
    },
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

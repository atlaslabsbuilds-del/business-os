import type {
  VectorRecord,
  VectorSearchRequest,
  VectorSearchResponse,
  VectorStore,
  VectorUpsertRequest,
} from "../types/ai";
import { cosineSimilarity } from "../embeddings/embeddings";

type NamespaceStore = Map<string, VectorRecord>;

/**
 * In-memory vector store for infrastructure/testing.
 * Replace with pgvector / Pinecone / Supabase adapters in product modules.
 */
export class InMemoryVectorStore implements VectorStore {
  private namespaces = new Map<string, NamespaceStore>();

  private bucket(namespace = "default"): NamespaceStore {
    const existing = this.namespaces.get(namespace);
    if (existing) return existing;
    const created = new Map<string, VectorRecord>();
    this.namespaces.set(namespace, created);
    return created;
  }

  async upsert(request: VectorUpsertRequest): Promise<void> {
    const store = this.bucket(request.namespace);
    for (const record of request.records) {
      store.set(record.id, record);
    }
  }

  async search(request: VectorSearchRequest): Promise<VectorSearchResponse> {
    const store = this.bucket(request.namespace);
    const topK = request.topK ?? 8;
    const hits = [...store.values()]
      .filter((record) => matchesFilter(record.metadata, request.filter))
      .map((record) => ({
        id: record.id,
        score: cosineSimilarity(request.vector, record.values),
        metadata: record.metadata,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return { hits };
  }

  async delete(ids: string[], namespace = "default"): Promise<void> {
    const store = this.bucket(namespace);
    for (const id of ids) {
      store.delete(id);
    }
  }
}

export function createVectorStore(): VectorStore {
  return new InMemoryVectorStore();
}

export async function vectorSearch(
  store: VectorStore,
  request: VectorSearchRequest,
): Promise<VectorSearchResponse> {
  return store.search(request);
}

function matchesFilter(
  metadata: Record<string, unknown> | undefined,
  filter: Record<string, unknown> | undefined,
): boolean {
  if (!filter) return true;
  if (!metadata) return false;
  return Object.entries(filter).every(([key, value]) => metadata[key] === value);
}

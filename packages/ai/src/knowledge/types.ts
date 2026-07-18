export type KnowledgeDocument = {
  id: string;
  workspaceId: string;
  title: string;
  source?: string;
  content: string;
  metadata?: Record<string, unknown>;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeChunk = {
  id: string;
  documentId: string;
  workspaceId: string;
  index: number;
  content: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type KnowledgeCitation = {
  id: string;
  documentId: string;
  chunkId: string;
  title: string;
  excerpt: string;
  score: number;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type KnowledgeSearchHit = {
  chunk: KnowledgeChunk;
  document: KnowledgeDocument;
  score: number;
  citation: KnowledgeCitation;
};

export type KnowledgeIngestInput = {
  workspaceId: string;
  title: string;
  content: string;
  source?: string;
  documentId?: string;
  metadata?: Record<string, unknown>;
};

export type ChunkingOptions = {
  /** Target chunk size in characters. */
  chunkSize?: number;
  /** Overlap between consecutive chunks. */
  chunkOverlap?: number;
  /** Prefer splitting on paragraph/sentence boundaries. */
  respectBoundaries?: boolean;
};

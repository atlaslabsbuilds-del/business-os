import { createId } from "../utils";
import type { ChunkingOptions, KnowledgeChunk } from "./types";

export type { ChunkingOptions };

const DEFAULT_CHUNK_SIZE = 1200;
const DEFAULT_OVERLAP = 200;

/**
 * Split raw text into overlapping chunks suitable for embedding + RAG.
 */
export function chunkText(
  content: string,
  options: ChunkingOptions = {},
): string[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const overlap = Math.min(
    options.chunkOverlap ?? DEFAULT_OVERLAP,
    Math.max(0, chunkSize - 1),
  );
  const respectBoundaries = options.respectBoundaries ?? true;
  const text = content.replace(/\r\n/g, "\n").trim();

  if (!text) {
    return [];
  }

  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    if (respectBoundaries && end < text.length) {
      const window = text.slice(start, end);
      const paragraphBreak = window.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(
        window.lastIndexOf(". "),
        window.lastIndexOf("? "),
        window.lastIndexOf("! "),
      );
      const breakAt =
        paragraphBreak > chunkSize * 0.4
          ? paragraphBreak + 2
          : sentenceBreak > chunkSize * 0.4
            ? sentenceBreak + 2
            : -1;

      if (breakAt > 0) {
        end = start + breakAt;
      }
    }

    const slice = text.slice(start, end).trim();
    if (slice) {
      chunks.push(slice);
    }

    if (end >= text.length) {
      break;
    }

    start = Math.max(0, end - overlap);
  }

  return chunks;
}

export function buildKnowledgeChunks(input: {
  workspaceId: string;
  documentId: string;
  content: string;
  options?: ChunkingOptions;
  metadata?: Record<string, unknown>;
}): KnowledgeChunk[] {
  const now = new Date().toISOString();
  const parts = chunkText(input.content, input.options);

  return parts.map((part, index) => ({
    id: createId("chunk"),
    documentId: input.documentId,
    workspaceId: input.workspaceId,
    index,
    content: part,
    metadata: {
      ...input.metadata,
      chunkIndex: index,
      documentId: input.documentId,
    },
    createdAt: now,
  }));
}

export function estimateChunkTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

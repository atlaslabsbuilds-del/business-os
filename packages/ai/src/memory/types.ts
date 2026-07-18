import type { AiMessage, MemoryMessage } from "../types/ai";

export type MemoryScope = "conversation" | "workspace" | "long_term";

export type ConversationSummary = {
  sessionId: string;
  workspaceId?: string;
  summary: string;
  messageCount: number;
  tokenEstimate: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMemoryFact = {
  id: string;
  workspaceId: string;
  userId?: string;
  content: string;
  category?: string;
  importance: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
};

export type MemoryCitation = {
  id: string;
  source: "conversation" | "workspace" | "knowledge" | "summary";
  title?: string;
  excerpt: string;
  score: number;
  metadata?: Record<string, unknown>;
};

export type RetrievedContext = {
  messages: AiMessage[];
  facts: WorkspaceMemoryFact[];
  citations: MemoryCitation[];
  summary?: string;
  systemContext: string;
};

export type ConversationMemorySnapshot = {
  sessionId: string;
  workspaceId?: string;
  userId?: string;
  messages: MemoryMessage[];
  summary?: ConversationSummary;
  messageCount: number;
};

export type MemoryCleanupResult = {
  deletedSessions: number;
  deletedFacts: number;
  deletedSummaries: number;
};

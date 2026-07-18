import type { AiMessage, AiLogger } from "../types/ai";
import { createConsoleLogger, messageContentToText } from "../utils";
import type { ConversationMemory } from "./conversation-memory";
import type { WorkspaceMemory } from "./workspace-memory";
import type {
  MemoryCitation,
  RetrievedContext,
  WorkspaceMemoryFact,
} from "./types";

export type KnowledgeRetrieverLike = {
  retrieve: (input: {
    workspaceId: string;
    query: string;
    topK?: number;
  }) => Promise<
    Array<{
      id: string;
      content: string;
      score: number;
      documentId?: string;
      title?: string;
      metadata?: Record<string, unknown>;
    }>
  >;
};

export type MemoryRetrievalOptions = {
  conversationMemory?: ConversationMemory;
  workspaceMemory?: WorkspaceMemory;
  knowledge?: KnowledgeRetrieverLike;
  logger?: AiLogger;
};

export type MemoryRetriever = {
  retrieveContext: (input: {
    query: string;
    workspaceId: string;
    sessionId?: string;
    systemPrompt?: string;
    recentLimit?: number;
    factLimit?: number;
    knowledgeLimit?: number;
    minScore?: number;
  }) => Promise<RetrievedContext>;
  formatCitations: (citations: MemoryCitation[]) => string;
};

/**
 * Unified context retrieval across conversation, workspace, and knowledge layers.
 * Produces RAG-ready messages + citations for the AI Gateway.
 */
export function createMemoryRetriever(
  options: MemoryRetrievalOptions = {},
): MemoryRetriever {
  const logger = options.logger ?? createConsoleLogger("@repo/ai/memory");

  return {
    formatCitations(citations) {
      if (citations.length === 0) return "";
      return citations
        .map((citation, index) => {
          const label = citation.title ?? citation.source;
          return `[${index + 1}] (${label}, score=${citation.score.toFixed(2)}) ${citation.excerpt}`;
        })
        .join("\n");
    },

    async retrieveContext(input) {
      const citations: MemoryCitation[] = [];
      const facts: WorkspaceMemoryFact[] = [];
      let messages: AiMessage[] = [];
      let summary: string | undefined;

      if (options.conversationMemory && input.sessionId) {
        messages = await options.conversationMemory.buildContextMessages({
          sessionId: input.sessionId,
          systemPrompt: input.systemPrompt,
          recentLimit: input.recentLimit ?? 16,
        });
        const snap = options.conversationMemory.getSummary(input.sessionId);
        summary = snap?.summary;
        if (summary) {
          citations.push({
            id: `summary:${input.sessionId}`,
            source: "summary",
            title: "Conversation summary",
            excerpt: summary.slice(0, 280),
            score: 1,
          });
        }
      } else if (input.systemPrompt) {
        messages = [{ role: "system", content: input.systemPrompt }];
      }

      if (options.workspaceMemory) {
        const recalled = await options.workspaceMemory.recall({
          workspaceId: input.workspaceId,
          query: input.query,
          topK: input.factLimit ?? 5,
          minScore: input.minScore ?? 0.15,
        });
        facts.push(...recalled);
        for (const fact of recalled) {
          citations.push({
            id: fact.id,
            source: "workspace",
            title: fact.category ?? "Workspace memory",
            excerpt: fact.content.slice(0, 280),
            score: fact.importance,
            metadata: fact.metadata,
          });
        }
      }

      if (options.knowledge) {
        const hits = await options.knowledge.retrieve({
          workspaceId: input.workspaceId,
          query: input.query,
          topK: input.knowledgeLimit ?? 5,
        });
        for (const hit of hits) {
          if ((input.minScore ?? 0) > 0 && hit.score < (input.minScore ?? 0)) {
            continue;
          }
          citations.push({
            id: hit.id,
            source: "knowledge",
            title: hit.title ?? hit.documentId ?? "Knowledge",
            excerpt: hit.content.slice(0, 280),
            score: hit.score,
            metadata: hit.metadata,
          });
        }
      }

      const systemContext = buildSystemContext({
        summary,
        facts,
        citations,
      });

      if (systemContext) {
        const hasSystem = messages.some((m) => m.role === "system");
        if (hasSystem) {
          messages = messages.map((message, index) => {
            if (index === 0 && message.role === "system") {
              return {
                ...message,
                content: `${messageContentToText(message.content)}\n\n${systemContext}`,
              };
            }
            return message;
          });
        } else {
          messages = [{ role: "system", content: systemContext }, ...messages];
        }
      }

      logger.debug("memory.retrieval.done", {
        workspaceId: input.workspaceId,
        sessionId: input.sessionId,
        messages: messages.length,
        facts: facts.length,
        citations: citations.length,
      });

      return {
        messages,
        facts,
        citations,
        summary,
        systemContext,
      };
    },
  };
}

function buildSystemContext(input: {
  summary?: string;
  facts: WorkspaceMemoryFact[];
  citations: MemoryCitation[];
}): string {
  const parts: string[] = [];

  if (input.facts.length > 0) {
    parts.push(
      "Long-term workspace memory:\n" +
        input.facts
          .map((fact, index) => `${index + 1}. ${fact.content}`)
          .join("\n"),
    );
  }

  const knowledgeCitations = input.citations.filter((c) => c.source === "knowledge");
  if (knowledgeCitations.length > 0) {
    parts.push(
      "Retrieved knowledge (cite by number when used):\n" +
        knowledgeCitations
          .map(
            (citation, index) =>
              `[K${index + 1}] ${citation.title ?? "Source"}: ${citation.excerpt}`,
          )
          .join("\n"),
    );
  }

  return parts.join("\n\n");
}

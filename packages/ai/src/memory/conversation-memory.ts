import type { AiGateway } from "../gateway";
import type {
  AiLogger,
  AiMessage,
  MemoryMessage,
  MemoryStore,
} from "../types/ai";
import {
  createConsoleLogger,
  createId,
  messageContentToText,
} from "../utils";
import { createMemoryStore } from "./memory";
import {
  createConversationSummarizer,
  estimateMessageTokens,
  type ConversationSummarizer,
} from "./summarizer";
import type {
  ConversationMemorySnapshot,
  ConversationSummary,
  MemoryCleanupResult,
} from "./types";

export type ConversationMemoryOptions = {
  gateway?: AiGateway;
  store?: MemoryStore;
  summarizer?: ConversationSummarizer;
  logger?: AiLogger;
  /** Keep this many recent messages after summarization. */
  recentWindow?: number;
  /** Trigger summarization after this many messages. */
  summarizeAfterMessages?: number;
  /** Trigger summarization after this many estimated tokens. */
  summarizeAfterTokens?: number;
};

export type ConversationMemory = {
  createSession: (input?: {
    userId?: string;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
  }) => Promise<{ sessionId: string }>;
  getSession: (sessionId: string) => Promise<ConversationMemorySnapshot | null>;
  append: (
    sessionId: string,
    messages: AiMessage[],
  ) => Promise<{
    appended: MemoryMessage[];
    summarized: boolean;
    summary?: ConversationSummary;
  }>;
  history: (sessionId: string, limit?: number) => Promise<MemoryMessage[]>;
  getSummary: (sessionId: string) => ConversationSummary | undefined;
  buildContextMessages: (input: {
    sessionId: string;
    systemPrompt?: string;
    recentLimit?: number;
  }) => Promise<AiMessage[]>;
  summarize: (sessionId: string, model?: string) => Promise<ConversationSummary>;
  clear: (sessionId: string) => Promise<void>;
  cleanup: (input?: {
    olderThanMs?: number;
    workspaceId?: string;
  }) => Promise<MemoryCleanupResult>;
};

/**
 * Conversation-scoped memory with automatic summarization for long threads.
 * Uses the low-level MemoryStore for message persistence.
 */
export function createConversationMemory(
  options: ConversationMemoryOptions = {},
): ConversationMemory {
  const store = options.store ?? createMemoryStore();
  const logger = options.logger ?? createConsoleLogger("@repo/ai/memory");
  const recentWindow = options.recentWindow ?? 12;
  const summarizeAfterMessages = options.summarizeAfterMessages ?? 24;
  const summarizeAfterTokens = options.summarizeAfterTokens ?? 4000;

  const summarizer =
    options.summarizer ??
    (options.gateway
      ? createConversationSummarizer({
          gateway: options.gateway,
          logger,
        })
      : undefined);

  const summaries = new Map<string, ConversationSummary>();
  const sessionMeta = new Map<
    string,
    { workspaceId?: string; userId?: string; createdAt: string }
  >();

  async function maybeSummarize(sessionId: string): Promise<{
    summarized: boolean;
    summary?: ConversationSummary;
  }> {
    if (!summarizer) {
      return { summarized: false };
    }

    const messages = await store.getMessages(sessionId);
    const tokenEstimate = estimateMessageTokens(messages);
    const previous = summaries.get(sessionId);

    if (
      !summarizer.shouldSummarize({
        messageCount: messages.length,
        tokenEstimate,
        maxMessages: summarizeAfterMessages,
        maxTokens: summarizeAfterTokens,
      })
    ) {
      return { summarized: false, summary: previous };
    }

    const summary = await summarizer.summarize({
      sessionId,
      messages,
      workspaceId: sessionMeta.get(sessionId)?.workspaceId,
      previousSummary: previous?.summary,
    });
    summaries.set(sessionId, summary);

    // Compact: keep system + recent window, drop older turns from active window.
    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystem = messages.filter((m) => m.role !== "system");
    const recent = nonSystem.slice(-recentWindow);

    await store.clearSession(sessionId);
    if (systemMessages.length > 0) {
      await store.appendMessages(
        sessionId,
        systemMessages.map(({ role, content, name, toolCallId }) => ({
          role,
          content,
          name,
          toolCallId,
        })),
      );
    }
    await store.appendMessages(sessionId, [
      {
        role: "system",
        content: `Conversation summary (long-term):\n${summary.summary}`,
      },
      ...recent.map(({ role, content, name, toolCallId }) => ({
        role,
        content,
        name,
        toolCallId,
      })),
    ]);

    logger.info("memory.conversation.compacted", {
      sessionId,
      kept: recent.length,
      summaryChars: summary.summary.length,
    });

    return { summarized: true, summary };
  }

  return {
    async createSession(input) {
      const session = await store.createSession(input);
      sessionMeta.set(session.id, {
        workspaceId: input?.workspaceId ?? session.workspaceId,
        userId: input?.userId ?? session.userId,
        createdAt: session.createdAt,
      });
      return { sessionId: session.id };
    },

    async getSession(sessionId) {
      const session = await store.getSession(sessionId);
      if (!session) return null;
      const messages = await store.getMessages(sessionId);
      return {
        sessionId,
        workspaceId: session.workspaceId,
        userId: session.userId,
        messages,
        summary: summaries.get(sessionId),
        messageCount: messages.length,
      };
    },

    async append(sessionId, messages) {
      const session = await store.getSession(sessionId);
      if (!session) {
        throw new Error(`Unknown conversation session: ${sessionId}`);
      }

      const appended = await store.appendMessages(sessionId, messages);
      const { summarized, summary } = await maybeSummarize(sessionId);
      return { appended, summarized, summary };
    },

    async history(sessionId, limit) {
      return store.getMessages(sessionId, limit);
    },

    getSummary(sessionId) {
      return summaries.get(sessionId);
    },

    async buildContextMessages({ sessionId, systemPrompt, recentLimit }) {
      const messages = await store.getMessages(sessionId, recentLimit);
      const summary = summaries.get(sessionId);
      const context: AiMessage[] = [];

      if (systemPrompt) {
        context.push({ role: "system", content: systemPrompt });
      }

      if (summary?.summary) {
        const alreadyHasSummary = messages.some(
          (m) =>
            m.role === "system" &&
            messageContentToText(m.content).includes("Conversation summary"),
        );
        if (!alreadyHasSummary) {
          context.push({
            role: "system",
            content: `Conversation summary (long-term):\n${summary.summary}`,
          });
        }
      }

      for (const message of messages) {
        if (
          systemPrompt &&
          message.role === "system" &&
          messageContentToText(message.content) === systemPrompt
        ) {
          continue;
        }
        context.push({
          role: message.role,
          content: message.content,
          name: message.name,
          toolCallId: message.toolCallId,
        });
      }

      return context;
    },

    async summarize(sessionId, model) {
      if (!summarizer) {
        throw new Error(
          "Conversation summarizer requires a gateway. Pass gateway when creating conversation memory.",
        );
      }
      const messages = await store.getMessages(sessionId);
      const previous = summaries.get(sessionId);
      const summary = await summarizer.summarize({
        sessionId,
        messages,
        workspaceId: sessionMeta.get(sessionId)?.workspaceId,
        previousSummary: previous?.summary,
        model,
      });
      summaries.set(sessionId, summary);
      return summary;
    },

    async clear(sessionId) {
      await store.clearSession(sessionId);
      summaries.delete(sessionId);
    },

    async cleanup(input = {}) {
      const olderThanMs = input.olderThanMs ?? 1000 * 60 * 60 * 24 * 30;
      const cutoff = Date.now() - olderThanMs;
      let deletedSessions = 0;
      let deletedSummaries = 0;

      for (const [sessionId, meta] of sessionMeta.entries()) {
        if (input.workspaceId && meta.workspaceId !== input.workspaceId) {
          continue;
        }
        const created = Date.parse(meta.createdAt);
        if (Number.isNaN(created) || created > cutoff) {
          continue;
        }
        await store.clearSession(sessionId);
        sessionMeta.delete(sessionId);
        if (summaries.delete(sessionId)) {
          deletedSummaries += 1;
        }
        deletedSessions += 1;
      }

      logger.info("memory.conversation.cleanup", {
        deletedSessions,
        deletedSummaries,
        id: createId("cleanup"),
      });

      return {
        deletedSessions,
        deletedFacts: 0,
        deletedSummaries,
      };
    },
  };
}

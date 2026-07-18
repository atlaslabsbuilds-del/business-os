import type { AiGateway } from "../gateway";
import type { AiMessage, AiLogger } from "../types/ai";
import { createConsoleLogger, createId, messageContentToText } from "../utils";
import type { ConversationSummary } from "./types";

const SUMMARIZE_PROMPT = `You are a memory summarizer for an enterprise AI platform.
Condense the conversation into a durable summary that preserves:
- User goals and decisions
- Key facts, names, dates, and constraints
- Open questions or unfinished work
Keep it under 250 words. Use clear bullet points when helpful.
Do not invent details.`;

export type ConversationSummarizer = {
  summarize: (input: {
    sessionId: string;
    messages: AiMessage[];
    workspaceId?: string;
    previousSummary?: string;
    model?: string;
  }) => Promise<ConversationSummary>;
  estimateTokens: (messages: AiMessage[]) => number;
  shouldSummarize: (input: {
    messageCount: number;
    tokenEstimate: number;
    maxMessages?: number;
    maxTokens?: number;
  }) => boolean;
};

export function createConversationSummarizer(input: {
  gateway: AiGateway;
  logger?: AiLogger;
}): ConversationSummarizer {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/memory");

  return {
    estimateTokens(messages) {
      return estimateMessageTokens(messages);
    },

    shouldSummarize({
      messageCount,
      tokenEstimate,
      maxMessages = 24,
      maxTokens = 4000,
    }) {
      return messageCount >= maxMessages || tokenEstimate >= maxTokens;
    },

    async summarize({
      sessionId,
      messages,
      workspaceId,
      previousSummary,
      model,
    }) {
      const transcript = messages
        .filter((message) => message.role !== "system")
        .map((message) => {
          const text = messageContentToText(message.content);
          return `${message.role.toUpperCase()}: ${text}`;
        })
        .join("\n\n");

      const promptMessages: AiMessage[] = [
        { role: "system", content: SUMMARIZE_PROMPT },
        {
          role: "user",
          content: [
            previousSummary
              ? `Previous summary:\n${previousSummary}\n\n`
              : "",
            "Conversation transcript:\n",
            transcript || "(empty)",
          ].join(""),
        },
      ];

      logger.info("memory.summarize.start", {
        sessionId,
        workspaceId,
        messageCount: messages.length,
      });

      const response = await input.gateway.complete({
        messages: promptMessages,
        model,
        temperature: 0.2,
        maxTokens: 600,
      });

      const summaryText = messageContentToText(response.message.content).trim();
      const now = new Date().toISOString();

      const summary: ConversationSummary = {
        sessionId,
        workspaceId,
        summary: summaryText || "No notable conversation details yet.",
        messageCount: messages.length,
        tokenEstimate: estimateMessageTokens(messages),
        createdAt: now,
        updatedAt: now,
      };

      logger.info("memory.summarize.done", {
        sessionId,
        summaryId: createId("summary"),
        chars: summary.summary.length,
      });

      return summary;
    },
  };
}

export function estimateMessageTokens(messages: AiMessage[]): number {
  let chars = 0;
  for (const message of messages) {
    chars += messageContentToText(message.content).length;
    chars += 8;
  }
  return Math.max(1, Math.ceil(chars / 4));
}

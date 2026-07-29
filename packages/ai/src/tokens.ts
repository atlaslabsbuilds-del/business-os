import type { AiMessage, AiUsage } from "./types/ai";

/**
 * Provider-neutral token estimation.
 *
 * Exact tokenization differs by model. This deliberately stays dependency-free
 * and is used for budgets, rate limits, and UI estimates. Provider responses
 * remain authoritative for billable usage.
 */
export function estimateTokens(value: string): number {
  const normalized = value.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / 4));
}

export function estimateChatMessageTokens(messages: AiMessage[]): number {
  return messages.reduce((total, message) => {
    const content =
      typeof message.content === "string"
        ? message.content
        : message.content
            .map((part) => ("text" in part ? part.text : JSON.stringify(part)))
            .join("\n");
    return total + estimateTokens(content) + 4;
  }, 0);
}

export type TokenCounter = {
  countText: (text: string) => number;
  countMessages: (messages: AiMessage[]) => number;
  estimateUsage: (input: AiMessage[], output: string) => AiUsage;
};

export function createTokenCounter(): TokenCounter {
  return {
    countText: estimateTokens,
    countMessages: estimateChatMessageTokens,
    estimateUsage(input, output) {
      const inputTokens = estimateChatMessageTokens(input);
      const outputTokens = estimateTokens(output);
      return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
      };
    },
  };
}

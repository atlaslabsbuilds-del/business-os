import type { AiGateway } from "../gateway";
import { DEFAULT_SYSTEM_PROMPT } from "../prompts/system";
import type { AiProviderId } from "../types/ai";
import { ensureSystemMessage, toAiMessages } from "./messages";
import type { ChatContext } from "./types";

export type BuildChatContextInput = {
  workspaceId: string;
  userId: string;
  conversationId: string;
  model: string;
  provider: AiProviderId;
  workspaceName?: string;
  systemPrompt?: string;
};

export function buildChatContext(input: BuildChatContextInput): ChatContext {
  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
    conversationId: input.conversationId,
    model: input.model,
    provider: input.provider,
  };
}

export function buildChatSystemPrompt(input: {
  workspaceName?: string;
  systemPrompt?: string;
  memoryContext?: string;
}): string {
  const base = input.systemPrompt?.trim() || DEFAULT_SYSTEM_PROMPT;
  const workspace = input.workspaceName
    ? `\n\nActive workspace: ${input.workspaceName}.`
    : "";
  const memory = input.memoryContext
    ? `\n\nKairos memory context (use as context, never invent missing facts):\n${input.memoryContext}`
    : "";
  return `${base}${workspace}${memory}`;
}

export async function buildGatewayMessages(input: {
  gateway: AiGateway;
  storedMessages: Parameters<typeof toAiMessages>[0];
  systemPrompt: string;
}) {
  const aiMessages = ensureSystemMessage(
    toAiMessages(input.storedMessages),
    input.systemPrompt,
  );
  return aiMessages;
}

export function resolveModelSelection(input: {
  model?: string;
  provider?: AiProviderId;
  fallbackModel: string;
  fallbackProvider: AiProviderId;
}): { model: string; provider: AiProviderId } {
  return {
    model: input.model ?? input.fallbackModel,
    provider: input.provider ?? input.fallbackProvider,
  };
}

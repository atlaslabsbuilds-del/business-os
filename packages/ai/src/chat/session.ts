import { createGateway } from "../gateway";
import { MODEL_CATALOG } from "../gateway/router";
import type { AiProviderId } from "../types/ai";
import type { ChatModelOption } from "./types";

export function listChatModels(): ChatModelOption[] {
  return MODEL_CATALOG.filter((route) => route.capabilities.includes("chat")).map(
    (route) => ({
      id: route.id,
      provider: route.provider,
      model: route.model,
      label: formatModelLabel(route.provider, route.model),
    }),
  );
}

export function groupChatModelsByProvider(): Record<AiProviderId, ChatModelOption[]> {
  const grouped: Record<AiProviderId, ChatModelOption[]> = {
    openai: [],
    anthropic: [],
    gemini: [],
    groq: [],
  };

  for (const option of listChatModels()) {
    grouped[option.provider].push(option);
  }

  return grouped;
}

export function formatModelLabel(provider: AiProviderId, model: string): string {
  const providerLabel: Record<AiProviderId, string> = {
    openai: "OpenAI",
    anthropic: "Anthropic",
    gemini: "Gemini",
    groq: "Groq",
  };
  return `${providerLabel[provider]} · ${model}`;
}

export function createChatGateway() {
  return createGateway({
    routingStrategy: "balanced",
    maxRetries: 2,
  });
}

export type ChatSessionDeps = {
  gateway: ReturnType<typeof createChatGateway>;
};

export function createChatSessionDeps(): ChatSessionDeps {
  return {
    gateway: createChatGateway(),
  };
}

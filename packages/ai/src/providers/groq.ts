import type { AiProvider, ProviderConfig } from "../types/ai";
import { createOpenAIProvider } from "./openai";

/**
 * Groq exposes an OpenAI-compatible Chat Completions API.
 */
export function createGroqProvider(config: ProviderConfig = {}): AiProvider {
  const provider = createOpenAIProvider({
    apiKey: config.apiKey ?? process.env.GROQ_API_KEY,
    baseUrl:
      config.baseUrl ?? process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
    defaultHeaders: config.defaultHeaders,
  });

  return {
    ...provider,
    id: "groq",
    async complete(request) {
      const response = await provider.complete(request);
      return { ...response, provider: "groq" };
    },
    async *stream(request) {
      for await (const chunk of provider.stream(request)) {
        if (chunk.type === "done") {
          yield {
            ...chunk,
            response: { ...chunk.response, provider: "groq" },
          };
        } else {
          yield chunk;
        }
      }
    },
  };
}

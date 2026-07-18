import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiProvider,
  AiStreamChunk,
  AiToolCallPart,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderConfig,
} from "../types/ai";
import {
  createId,
  estimateCost,
  fetchJson,
  messageContentToText,
} from "../utils";
import { getModelRoute } from "../gateway/router";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: { name: string; args?: Record<string, unknown> };
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

function resolveConfig(config: ProviderConfig = {}): Required<ProviderConfig> {
  return {
    apiKey:
      config.apiKey ??
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_API_KEY ??
      "",
    baseUrl:
      config.baseUrl ??
      process.env.GOOGLE_GEMINI_BASE_URL ??
      "https://generativelanguage.googleapis.com/v1beta",
    defaultHeaders: config.defaultHeaders ?? {},
  };
}

function toGeminiContents(request: AiCompletionRequest) {
  const system = request.messages
    .filter((message) => message.role === "system")
    .map((message) => messageContentToText(message.content))
    .join("\n\n");

  const contents = request.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: messageContentToText(message.content) }],
    }));

  return { system, contents };
}

export function createGeminiProvider(config: ProviderConfig = {}): AiProvider {
  const resolved = resolveConfig(config);

  return {
    id: "gemini",

    async complete(request) {
      const started = Date.now();
      if (!resolved.apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const { system, contents } = toGeminiContents(request);
      const url = `${resolved.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(request.model)}:generateContent?key=${encodeURIComponent(resolved.apiKey)}`;

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
          responseMimeType:
            request.responseFormat === "json" ? "application/json" : undefined,
        },
      };

      if (system) {
        body.systemInstruction = { parts: [{ text: system }] };
      }

      if (request.tools?.length) {
        body.tools = [
          {
            functionDeclarations: request.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            })),
          },
        ];
      }

      const data = await fetchJson<GeminiResponse>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...resolved.defaultHeaders,
        },
        body: JSON.stringify(body),
      });

      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const text = parts
        .map((part) => part.text)
        .filter(Boolean)
        .join("\n");
      const toolCalls: AiToolCallPart[] = parts
        .filter((part) => part.functionCall)
        .map((part) => ({
          type: "tool_call" as const,
          id: createId("gemini_tool"),
          name: part.functionCall!.name,
          arguments: part.functionCall!.args ?? {},
        }));

      const usage = {
        inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
        outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      };
      const route = getModelRoute(request.model);

      const response: AiCompletionResponse = {
        id: createId("gemini"),
        provider: "gemini",
        model: request.model,
        message: {
          role: "assistant",
          content:
            toolCalls.length > 0
              ? [
                  ...(text ? [{ type: "text" as const, text }] : []),
                  ...toolCalls,
                ]
              : text,
        },
        toolCalls,
        finishReason: toolCalls.length > 0 ? "tool_calls" : "stop",
        usage,
        cost: route
          ? estimateCost(route, usage)
          : { currency: "USD", inputCost: 0, outputCost: 0, totalCost: 0 },
        latencyMs: Date.now() - started,
        raw: data,
      };

      return response;
    },

    async *stream(request): AsyncIterable<AiStreamChunk> {
      try {
        const response = await this.complete(request);
        const text = messageContentToText(response.message.content);
        if (text) yield { type: "text_delta", text };
        yield { type: "usage", usage: response.usage, cost: response.cost };
        yield {
          type: "done",
          finishReason: response.finishReason,
          response,
        };
      } catch (error) {
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Gemini stream failed",
        };
      }
    },

    async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
      const started = Date.now();
      if (!resolved.apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const embeddings: number[][] = [];

      for (const value of inputs) {
        const url = `${resolved.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(request.model)}:embedContent?key=${encodeURIComponent(resolved.apiKey)}`;
        const data = await fetchJson<{
          embedding?: { values?: number[] };
        }>(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...resolved.defaultHeaders,
          },
          body: JSON.stringify({
            content: { parts: [{ text: value }] },
          }),
        });
        embeddings.push(data.embedding?.values ?? []);
      }

      const usage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      };
      const route = getModelRoute(request.model);

      return {
        provider: "gemini",
        model: request.model,
        embeddings,
        usage,
        cost: route
          ? estimateCost(route, usage)
          : { currency: "USD", inputCost: 0, outputCost: 0, totalCost: 0 },
        latencyMs: Date.now() - started,
      };
    },
  };
}

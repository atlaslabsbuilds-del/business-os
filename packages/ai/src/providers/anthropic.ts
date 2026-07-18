import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiFinishReason,
  AiProvider,
  AiStreamChunk,
  AiToolCallPart,
  ProviderConfig,
} from "../types/ai";
import {
  createId,
  estimateCost,
  fetchJson,
  messageContentToText,
} from "../utils";
import { getModelRoute } from "../gateway/router";

type AnthropicResponse = {
  id?: string;
  stop_reason?: string;
  content?: Array<
    | { type: "text"; text: string }
    | {
        type: "tool_use";
        id: string;
        name: string;
        input: Record<string, unknown>;
      }
  >;
  usage?: { input_tokens?: number; output_tokens?: number };
};

function resolveConfig(config: ProviderConfig = {}): Required<ProviderConfig> {
  return {
    apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY ?? "",
    baseUrl:
      config.baseUrl ??
      process.env.ANTHROPIC_BASE_URL ??
      "https://api.anthropic.com",
    defaultHeaders: config.defaultHeaders ?? {},
  };
}

function mapFinishReason(reason?: string): AiFinishReason {
  switch (reason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    default:
      return "unknown";
  }
}

function splitSystem(request: AiCompletionRequest) {
  const system = request.messages
    .filter((message) => message.role === "system")
    .map((message) => messageContentToText(message.content))
    .join("\n\n");

  const messages = request.messages
    .filter((message) => message.role !== "system")
    .map((message) => {
      if (message.role === "tool") {
        return {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: message.toolCallId,
              content: messageContentToText(message.content),
            },
          ],
        };
      }

      if (message.role === "assistant" && Array.isArray(message.content)) {
        const content = message.content.map((part) => {
          if (part.type === "text") {
            return { type: "text", text: part.text };
          }
          return {
            type: "tool_use",
            id: part.id,
            name: part.name,
            input: part.arguments,
          };
        });
        return { role: "assistant", content };
      }

      return {
        role: message.role === "assistant" ? "assistant" : "user",
        content: messageContentToText(message.content),
      };
    });

  return { system, messages };
}

export function createAnthropicProvider(config: ProviderConfig = {}): AiProvider {
  const resolved = resolveConfig(config);

  return {
    id: "anthropic",

    async complete(request) {
      const started = Date.now();
      if (!resolved.apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured");
      }

      const { system, messages } = splitSystem(request);
      const body: Record<string, unknown> = {
        model: request.model,
        max_tokens: request.maxTokens ?? 1024,
        temperature: request.temperature,
        system: system || undefined,
        messages,
      };

      if (request.tools?.length) {
        body.tools = request.tools.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        }));
      }

      const data = await fetchJson<AnthropicResponse>(
        `${resolved.baseUrl.replace(/\/$/, "")}/v1/messages`,
        {
          method: "POST",
          headers: {
            "x-api-key": resolved.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
            ...resolved.defaultHeaders,
          },
          body: JSON.stringify(body),
        },
      );

      const toolCalls: AiToolCallPart[] = (data.content ?? [])
        .filter(
          (
            part,
          ): part is {
            type: "tool_use";
            id: string;
            name: string;
            input: Record<string, unknown>;
          } => part.type === "tool_use",
        )
        .map((part) => ({
          type: "tool_call",
          id: part.id,
          name: part.name,
          arguments: part.input,
        }));

      const text = (data.content ?? [])
        .filter(
          (part): part is { type: "text"; text: string } => part.type === "text",
        )
        .map((part) => part.text)
        .join("\n");

      const usage = {
        inputTokens: data.usage?.input_tokens ?? 0,
        outputTokens: data.usage?.output_tokens ?? 0,
        totalTokens:
          (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      };
      const route = getModelRoute(request.model);

      const response: AiCompletionResponse = {
        id: data.id ?? createId("anthropic"),
        provider: "anthropic",
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
        finishReason: mapFinishReason(data.stop_reason),
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
      // Anthropic streaming uses SSE event stream; for infrastructure we fall back
      // to a single complete call and emit deltas from the final text.
      try {
        const response = await this.complete(request);
        const text = messageContentToText(response.message.content);
        if (text) {
          yield { type: "text_delta", text };
        }
        for (const call of response.toolCalls) {
          yield {
            type: "tool_call_delta",
            id: call.id,
            name: call.name,
            argumentsDelta: JSON.stringify(call.arguments),
          };
        }
        yield { type: "usage", usage: response.usage, cost: response.cost };
        yield {
          type: "done",
          finishReason: response.finishReason,
          response,
        };
      } catch (error) {
        yield {
          type: "error",
          error: error instanceof Error ? error.message : "Anthropic stream failed",
        };
      }
    },
  };
}

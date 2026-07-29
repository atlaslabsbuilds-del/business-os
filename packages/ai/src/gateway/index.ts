import { z } from "zod";
import { createAnthropicProvider } from "../providers/anthropic";
import { createGeminiProvider } from "../providers/gemini";
import { createGroqProvider } from "../providers/groq";
import { createOpenAIProvider } from "../providers/openai";
import type { ToolRegistry } from "../tools/registry";
import type { ToolExecutionContext } from "../tools/permissions";
import { AiProviderError } from "../types/ai";
import type {
  AiCompletionRequest,
  AiCompletionResponse,
  AiLogger,
  AiProvider,
  AiProviderId,
  AiStreamChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  GatewayOptions,
  ProviderConfig,
  RoutingStrategy,
} from "../types/ai";
import { normalizeProviderError } from "../providers/errors";
import { createConsoleLogger, withRetry } from "../utils";
import { getModelRoute, listModels, resolveRoute } from "./router";
import { completeWithTools, streamWithTools, type ToolLoopRequest } from "./tool-loop";

export type GatewayCompletionRequest = Omit<AiCompletionRequest, "model"> & {
  model?: string;
  provider?: AiProviderId;
  route?: RoutingStrategy;
  registry?: ToolRegistry;
  toolContext?: ToolExecutionContext;
  toolNames?: string[];
  maxToolRounds?: number;
  rateLimitKey?: string;
};

export type AiGateway = {
  complete: (request: GatewayCompletionRequest) => Promise<AiCompletionResponse>;
  stream: (request: GatewayCompletionRequest) => AsyncIterable<AiStreamChunk>;
  embed: (
    request: Omit<EmbeddingRequest, "model"> & {
      model?: string;
      provider?: AiProviderId;
    },
  ) => Promise<EmbeddingResponse>;
  completeJson: <T>(
    request: Omit<GatewayCompletionRequest, "responseFormat"> & {
      schema: z.ZodType<T>;
    },
  ) => Promise<{ data: T; response: AiCompletionResponse }>;
  getProvider: (id: AiProviderId) => AiProvider;
  listModels: typeof listModels;
  tools?: ToolRegistry;
};

export type CreateGatewayInput = GatewayOptions & {
  providers?: Partial<Record<AiProviderId, ProviderConfig>>;
  tools?: ToolRegistry;
  maxToolRounds?: number;
};

export function createGateway(options: CreateGatewayInput = {}): AiGateway {
  const logger: AiLogger = options.logger ?? createConsoleLogger();
  const maxRetries = options.maxRetries ?? 2;
  const maxToolRounds = options.maxToolRounds ?? 8;
  const rateLimiter = options.rateLimiter;

  const providers: Record<AiProviderId, AiProvider> = {
    openai: createOpenAIProvider(options.providers?.openai),
    anthropic: createAnthropicProvider(options.providers?.anthropic),
    gemini: createGeminiProvider(options.providers?.gemini),
    groq: createGroqProvider(options.providers?.groq),
  };

  function pickRoute(input: {
    model?: string;
    provider?: AiProviderId;
    route?: RoutingStrategy;
    capability?: "chat" | "embeddings";
  }) {
    return resolveRoute({
      model: input.model ?? options.defaultModel,
      provider: input.provider ?? options.defaultProvider,
      strategy: input.route ?? options.routingStrategy ?? "balanced",
      capability: input.capability,
    });
  }

  function resolveRegistry(request: GatewayCompletionRequest): ToolRegistry | undefined {
    return request.registry ?? options.tools;
  }

  function enforceRateLimit(request: GatewayCompletionRequest): void {
    if (!rateLimiter || !request.rateLimitKey) return;
    const result = rateLimiter.check(request.rateLimitKey);
    if (!result.allowed) {
      throw new AiProviderError("AI rate limit exceeded.", {
        code: "rate_limited",
        retryable: true,
        retryAfterSeconds: result.retryAfterSeconds,
      });
    }
  }

  async function invokeProvider<T>(
    provider: AiProvider,
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw normalizeProviderError(error, provider.id);
    }
  }

  function toToolLoopRequest(
    request: GatewayCompletionRequest,
    routeModel: string,
    registry?: ToolRegistry,
  ): ToolLoopRequest {
    return {
      ...request,
      model: routeModel,
      registry,
      maxToolRounds: request.maxToolRounds ?? maxToolRounds,
    };
  }

  return {
    listModels,
    tools: options.tools,

    getProvider(id) {
      return providers[id];
    },

    async complete(request) {
      enforceRateLimit(request);
      const route = pickRoute({
        model: request.model,
        provider: request.provider,
        route: request.route,
        capability: "chat",
      });
      const provider = providers[route.provider];
      const registry = resolveRegistry(request);
      const hasTools = Boolean(
        registry?.definitions({
          names: request.toolNames,
          context: request.toolContext,
        }).length,
      );

      logger.info("ai.complete.start", {
        provider: route.provider,
        model: route.model,
        tools: hasTools,
      });

      const response = hasTools
        ? await withRetry(
            () =>
              invokeProvider(provider, () =>
                completeWithTools({
                provider,
                request: toToolLoopRequest(request, route.model, registry),
                maxToolRounds,
                }),
              ),
            { maxRetries, logger, label: "completeWithTools" },
          )
        : await withRetry(
            () =>
              invokeProvider(provider, () =>
                provider.complete({
                  ...request,
                  model: route.model,
                }),
              ),
            { maxRetries, logger, label: "complete" },
          );

      logger.info("ai.complete.done", {
        provider: response.provider,
        model: response.model,
        latencyMs: response.latencyMs,
        tokens: response.usage.totalTokens,
        cost: response.cost.totalCost,
      });

      return response;
    },

    async *stream(request) {
      enforceRateLimit(request);
      const route = pickRoute({
        model: request.model,
        provider: request.provider,
        route: request.route,
        capability: "chat",
      });
      const provider = providers[route.provider];
      const registry = resolveRegistry(request);
      const hasTools = Boolean(
        registry?.definitions({
          names: request.toolNames,
          context: request.toolContext,
        }).length,
      );

      logger.info("ai.stream.start", {
        provider: route.provider,
        model: route.model,
        tools: hasTools,
      });

      try {
        if (hasTools) {
          yield* streamWithTools({
            provider,
            request: toToolLoopRequest(request, route.model, registry),
            maxToolRounds,
          });
          return;
        }

        yield* provider.stream({
          ...request,
          model: route.model,
        });
      } catch (error) {
        throw normalizeProviderError(error, provider.id);
      }
    },

    async embed(request) {
      const route = pickRoute({
        model: request.model,
        provider: request.provider,
        capability: "embeddings",
      });
      const provider = providers[route.provider];
      if (!provider.embed) {
        throw new Error(`Provider ${route.provider} does not support embeddings`);
      }

      return withRetry(
        () =>
          provider.embed!({
            model: route.model,
            input: request.input,
          }),
        { maxRetries, logger, label: "embed" },
      );
    },

    async completeJson(request) {
      const response = await this.complete({
        ...request,
        responseFormat: "json",
        jsonSchema: zodToJsonSchemaHint(request.schema),
      });

      const text =
        typeof response.message.content === "string"
          ? response.message.content
          : response.message.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("\n");

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error("Model did not return valid JSON");
      }

      const data = request.schema.parse(parsed);
      return { data, response };
    },
  };
}

function zodToJsonSchemaHint(schema: z.ZodType): Record<string, unknown> | undefined {
  void schema;
  return {
    type: "object",
    additionalProperties: true,
  };
}

export { getModelRoute, listModels, resolveRoute };

import { z } from "zod";

/** Supported model providers. */
export type AiProviderId = "openai" | "anthropic" | "gemini" | "groq";

export type AiMessageRole = "system" | "user" | "assistant" | "tool";

export type AiTextPart = {
  type: "text";
  text: string;
};

export type AiToolCallPart = {
  type: "tool_call";
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AiMessagePart = AiTextPart | AiToolCallPart;

export type AiMessage = {
  role: AiMessageRole;
  content: string | AiMessagePart[];
  name?: string;
  toolCallId?: string;
};

export type AiToolDefinition = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export type AiToolHandler = (
  args: Record<string, unknown>,
  context: {
    sessionId?: string;
    userId?: string;
    workspaceId?: string;
    workspaceRole?: "owner" | "admin" | "member";
    metadata?: Record<string, unknown>;
  },
) => Promise<unknown> | unknown;

export type AiTool = AiToolDefinition & {
  execute: AiToolHandler;
};

export type AiUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AiCost = {
  currency: "USD";
  inputCost: number;
  outputCost: number;
  totalCost: number;
};

export type AiFinishReason =
  | "stop"
  | "length"
  | "tool_calls"
  | "content_filter"
  | "error"
  | "unknown";

export type AiCompletionRequest = {
  model: string;
  messages: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: AiToolDefinition[];
  toolChoice?: "auto" | "none" | "required" | { name: string };
  responseFormat?: "text" | "json";
  jsonSchema?: Record<string, unknown>;
  stop?: string[];
  metadata?: Record<string, string>;
};

export type AiCompletionResponse = {
  id: string;
  provider: AiProviderId;
  model: string;
  message: AiMessage;
  toolCalls: AiToolCallPart[];
  finishReason: AiFinishReason;
  usage: AiUsage;
  cost: AiCost;
  latencyMs: number;
  raw?: unknown;
};

export type AiStreamChunk =
  | {
      type: "text_delta";
      text: string;
    }
  | {
      type: "tool_call_delta";
      id: string;
      name?: string;
      argumentsDelta?: string;
    }
  | {
      type: "usage";
      usage: AiUsage;
      cost: AiCost;
    }
  | {
      type: "done";
      finishReason: AiFinishReason;
      response: AiCompletionResponse;
    }
  | {
      type: "tool_start";
      callId: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "tool_end";
      callId: string;
      name: string;
      result: unknown;
      durationMs: number;
    }
  | {
      type: "tool_failed";
      callId: string;
      name: string;
      error: string;
    }
  | {
      type: "error";
      error: string;
    };

export type EmbeddingRequest = {
  model: string;
  input: string | string[];
};

export type EmbeddingResponse = {
  provider: AiProviderId;
  model: string;
  embeddings: number[][];
  usage: AiUsage;
  cost: AiCost;
  latencyMs: number;
};

export type VectorRecord = {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
};

export type VectorUpsertRequest = {
  namespace?: string;
  records: VectorRecord[];
};

export type VectorSearchRequest = {
  namespace?: string;
  vector: number[];
  topK?: number;
  filter?: Record<string, unknown>;
};

export type VectorSearchHit = {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
};

export type VectorSearchResponse = {
  hits: VectorSearchHit[];
};

export type MemoryMessage = AiMessage & {
  id: string;
  createdAt: string;
};

export type MemorySession = {
  id: string;
  userId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AgentPlanStep = {
  id: string;
  goal: string;
  toolName?: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  result?: unknown;
  error?: string;
};

export type AgentPlan = {
  id: string;
  objective: string;
  steps: AgentPlanStep[];
};

export type AgentRunRequest = {
  objective: string;
  sessionId?: string;
  model?: string;
  maxSteps?: number;
  tools?: string[];
  context?: AiMessage[];
  toolContext?: {
    sessionId?: string;
    userId?: string;
    workspaceId?: string;
    workspaceRole?: "owner" | "admin" | "member";
    metadata?: Record<string, unknown>;
  };
};

export type AgentRunResult = {
  plan: AgentPlan;
  messages: AiMessage[];
  finalAnswer: string;
  usage: AiUsage;
  cost: AiCost;
};

export type ModelRoute = {
  id: string;
  provider: AiProviderId;
  model: string;
  capabilities: Array<
    "chat" | "tools" | "json" | "streaming" | "embeddings" | "vision"
  >;
  costPer1kInput: number;
  costPer1kOutput: number;
  priority?: number;
};

export type RoutingStrategy =
  | "explicit"
  | "cheapest"
  | "fastest"
  | "balanced"
  | "quality";

export type GatewayOptions = {
  defaultProvider?: AiProviderId;
  defaultModel?: string;
  routingStrategy?: RoutingStrategy;
  maxRetries?: number;
  timeoutMs?: number;
  logger?: AiLogger;
};

export type AiLogger = {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

export type ProviderConfig = {
  apiKey?: string;
  baseUrl?: string;
  defaultHeaders?: Record<string, string>;
};

export interface AiProvider {
  readonly id: AiProviderId;
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
  stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export interface MemoryStore {
  getSession(sessionId: string): Promise<MemorySession | null>;
  createSession(input?: {
    userId?: string;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MemorySession>;
  appendMessages(sessionId: string, messages: AiMessage[]): Promise<MemoryMessage[]>;
  getMessages(sessionId: string, limit?: number): Promise<MemoryMessage[]>;
  clearSession(sessionId: string): Promise<void>;
}

export interface VectorStore {
  upsert(request: VectorUpsertRequest): Promise<void>;
  search(request: VectorSearchRequest): Promise<VectorSearchResponse>;
  delete?(ids: string[], namespace?: string): Promise<void>;
}

export const aiMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant", "tool"]),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("tool_call"),
          id: z.string(),
          name: z.string(),
          arguments: z.record(z.string(), z.unknown()),
        }),
      ]),
    ),
  ]),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
});

export const completionInputSchema = z.object({
  messages: z.array(aiMessageSchema).min(1),
  model: z.string().optional(),
  provider: z.enum(["openai", "anthropic", "gemini", "groq"]).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  responseFormat: z.enum(["text", "json"]).optional(),
  sessionId: z.string().optional(),
  route: z
    .enum(["explicit", "cheapest", "fastest", "balanced", "quality"])
    .optional(),
});

export type CompletionInput = z.infer<typeof completionInputSchema>;

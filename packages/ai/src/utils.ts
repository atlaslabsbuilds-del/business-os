import type {
  AiCost,
  AiLogger,
  AiProviderError,
  AiUsage,
  ModelRoute,
} from "./types/ai";

export function createConsoleLogger(namespace = "@repo/ai"): AiLogger {
  const prefix = `[${namespace}]`;
  return {
    debug: (message, meta) => {
      if (process.env.AI_DEBUG === "1") {
        console.debug(prefix, message, meta ?? "");
      }
    },
    info: (message, meta) => console.info(prefix, message, meta ?? ""),
    warn: (message, meta) => console.warn(prefix, message, meta ?? ""),
    error: (message, meta) => console.error(prefix, message, meta ?? ""),
  };
}

export function emptyUsage(): AiUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

export function addUsage(a: AiUsage, b: AiUsage): AiUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}

export function estimateCost(route: ModelRoute, usage: AiUsage): AiCost {
  const inputCost = (usage.inputTokens / 1000) * route.costPer1kInput;
  const outputCost = (usage.outputTokens / 1000) * route.costPer1kOutput;
  return {
    currency: "USD",
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
  };
}

export function addCost(a: AiCost, b: AiCost): AiCost {
  return {
    currency: "USD",
    inputCost: a.inputCost + b.inputCost,
    outputCost: a.outputCost + b.outputCost,
    totalCost: a.totalCost + b.totalCost,
  };
}

export function emptyCost(): AiCost {
  return { currency: "USD", inputCost: 0, outputCost: 0, totalCost: 0 };
}

export function messageContentToText(
  content: string | Array<{ type: string; text?: string }>,
): string {
  if (typeof content === "string") {
    return content;
  }
  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("\n");
}

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    logger?: AiLogger;
    label?: string;
  } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 2;
  const baseDelayMs = options.baseDelayMs ?? 250;
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !isRetryableError(error)) {
        break;
      }
      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 100);
      options.logger?.warn("retrying AI request", {
        label: options.label,
        attempt: attempt + 1,
        delay,
        error: error instanceof Error ? error.message : String(error),
      });
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("AI request failed after retries");
}

function isRetryableError(error: unknown): boolean {
  if (error && typeof error === "object" && "retryable" in error) {
    return Boolean((error as AiProviderError).retryable);
  }
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes("429") ||
    message.includes("rate") ||
    message.includes("timeout") ||
    message.includes("503") ||
    message.includes("502") ||
    message.includes("econnreset") ||
    message.includes("fetch failed")
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null
        ? JSON.stringify(payload)
        : String(payload);
    throw new Error(`HTTP ${response.status}: ${detail}`);
  }

  return payload as T;
}

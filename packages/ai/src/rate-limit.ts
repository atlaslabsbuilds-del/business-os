import type { AiRateLimiter, AiRateLimitResult } from "./types/ai";

type Bucket = {
  count: number;
  resetAt: number;
};

export type InMemoryAiRateLimiterOptions = {
  limit?: number;
  windowMs?: number;
  now?: () => number;
};

/**
 * Runtime-local limiter for development and single-instance deployments.
 * Inject a shared implementation (Redis, Durable Objects, etc.) in production.
 */
export function createInMemoryAiRateLimiter(
  options: InMemoryAiRateLimiterOptions = {},
): AiRateLimiter {
  const limit = options.limit ?? 30;
  const windowMs = options.windowMs ?? 60_000;
  const now = options.now ?? Date.now;
  const buckets = new Map<string, Bucket>();

  return {
    check(key: string): AiRateLimitResult {
      const currentTime = now();
      const current = buckets.get(key);
      if (!current || current.resetAt <= currentTime) {
        buckets.set(key, { count: 1, resetAt: currentTime + windowMs });
        return {
          allowed: true,
          retryAfterSeconds: Math.ceil(windowMs / 1000),
        };
      }

      current.count += 1;
      if (current.count > limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((current.resetAt - currentTime) / 1000),
          ),
        };
      }

      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

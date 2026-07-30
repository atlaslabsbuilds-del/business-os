import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export function encodeIntegrationOAuthState(input: {
  workspaceId: string;
  userId: string;
  provider: string;
  secret: string;
}): string {
  const payload = Buffer.from(
    JSON.stringify({
      workspaceId: input.workspaceId,
      userId: input.userId,
      provider: input.provider,
      ts: Date.now(),
    }),
    "utf8",
  ).toString("base64url");

  const sig = createHmac("sha256", input.secret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function decodeIntegrationOAuthState(input: {
  state: string;
  secret: string;
  maxAgeMs?: number;
}): { workspaceId: string; userId: string; provider: string } {
  const [payload, sig] = input.state.split(".");
  if (!payload || !sig) throw new Error("Invalid OAuth state");

  const expected = createHmac("sha256", input.secret)
    .update(payload)
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new Error("Invalid OAuth state signature");
  }

  const parsed = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as {
    workspaceId?: string;
    userId?: string;
    provider?: string;
    ts?: number;
  };

  if (!parsed.workspaceId || !parsed.userId || !parsed.provider || !parsed.ts) {
    throw new Error("Malformed OAuth state");
  }

  const maxAge = input.maxAgeMs ?? 10 * 60 * 1000;
  if (Date.now() - parsed.ts > maxAge) {
    throw new Error("OAuth state expired");
  }

  return {
    workspaceId: parsed.workspaceId,
    userId: parsed.userId,
    provider: parsed.provider,
  };
}

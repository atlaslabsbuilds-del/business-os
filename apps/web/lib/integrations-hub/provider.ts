import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Modular integration provider interface.
 * Every provider implements the same contract so the Hub can scale to 200+.
 */

export type IntegrationProviderId =
  | "gmail"
  | "google-drive"
  | "google-calendar"
  | "google-docs"
  | "outlook"
  | "onedrive"
  | "slack"
  | "discord"
  | "zoom"
  | "notion"
  | "trello"
  | "clickup"
  | "asana"
  | "github"
  | "gitlab"
  | "stripe"
  | "paypal"
  | "dropbox";

export type IntegrationProviderCategory =
  | "google"
  | "microsoft"
  | "communication"
  | "productivity"
  | "development"
  | "finance"
  | "storage";

export type KairosIntegrationAction = {
  name: string;
  description: string;
  examplePrompt: string;
};

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  scopes: string[];
  tokenType: string;
};

export type OAuthAccountProfile = {
  email: string | null;
  name: string | null;
  externalAccountId: string;
};

export type IntegrationProviderDefinition = {
  id: IntegrationProviderId;
  name: string;
  category: IntegrationProviderCategory;
  description: string;
  featured?: boolean;
  permissions: string[];
  scopes: string[];
  kairosActions: KairosIntegrationAction[];
  requiredEnv: string[];
  buildAuthUrl: (input: {
    workspaceId: string;
    userId: string;
    redirectUri: string;
    state: string;
  }) => string;
  exchangeCode: (input: {
    code: string;
    redirectUri: string;
  }) => Promise<OAuthTokenSet>;
  refreshAccessToken?: (input: {
    refreshToken: string;
  }) => Promise<OAuthTokenSet>;
  fetchProfile: (input: {
    accessToken: string;
  }) => Promise<OAuthAccountProfile>;
  isConfigured: () => boolean;
};

const providers = new Map<string, IntegrationProviderDefinition>();

export function registerIntegrationProvider(
  provider: IntegrationProviderDefinition,
): void {
  providers.set(provider.id, provider);
}

export function getIntegrationProvider(
  id: string,
): IntegrationProviderDefinition | undefined {
  return providers.get(id);
}

export function listIntegrationProviders(): IntegrationProviderDefinition[] {
  return [...providers.values()];
}

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

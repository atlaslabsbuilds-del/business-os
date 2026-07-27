/**
 * @deprecated Import from `../lib/kairos-agent` (Kairos V2).
 * Kept for back-compat with existing imports.
 */

export type {
  KairosAction,
  KairosActionKind,
  KairosCreateEntity,
} from "./kairos-agent";

export {
  KAIROS_ACTION_CATALOG,
  KAIROS_SUGGESTED_ACTIONS,
  detectKairosIntent,
  matchKairosActions,
  normalizeQuery,
  getKairosActionById,
} from "./kairos-agent";

import {
  KAIROS_ACTION_CATALOG,
  detectKairosIntent,
  matchKairosActions,
  normalizeQuery,
} from "./kairos-agent";

const OPEN_PREFIX =
  /^(open|go to|goto|navigate to|show|take me to|launch|switch to)\s+/i;

export type KairosNavTarget = {
  id: string;
  label: string;
  href: string;
  description: string;
  aliases: string[];
  keywords: string[];
};

export const KAIROS_NAV_TARGETS: KairosNavTarget[] = KAIROS_ACTION_CATALOG.filter(
  (a) => a.href && (a.kind === "navigate" || a.kind === "external"),
).map((a) => ({
  id: a.id,
  label: a.label,
  href: a.href!,
  description: a.description,
  aliases: a.keywords.map((k) => k.replace(OPEN_PREFIX, "").trim()),
  keywords: a.keywords,
}));

export function resolveNaturalLanguageNav(query: string): KairosNavTarget | null {
  const intent = detectKairosIntent(query);
  if (!intent?.href) return null;
  if (
    intent.kind !== "navigate" &&
    intent.kind !== "external" &&
    intent.kind !== "insight"
  ) {
    return null;
  }
  return {
    id: intent.id,
    label: intent.label,
    href: intent.href,
    description: intent.description,
    aliases: intent.keywords,
    keywords: intent.keywords,
  };
}

export function matchNaturalLanguageNav(query: string, limit = 6): KairosNavTarget[] {
  return matchKairosActions(query, limit)
    .filter((a) => a.href)
    .map((a) => ({
      id: a.id,
      label: a.label,
      href: a.href!,
      description: a.description,
      aliases: a.keywords,
      keywords: a.keywords,
    }));
}

export function resolveAskKairosPrompt(query: string): string | null {
  const intent = detectKairosIntent(query);
  if (intent?.kind !== "ask" || !intent.href?.includes("prompt=")) return null;
  try {
    return decodeURIComponent(intent.href.split("prompt=")[1] ?? "");
  } catch {
    return null;
  }
}

export function normalizeCommandQuery(query: string): string {
  return normalizeQuery(query);
}

/**
 * Kairos V2 intent detection — NL, slash commands, +quick create, context.
 */

import { KAIROS_ACTION_CATALOG, getKairosActionById } from "./catalog";
import {
  buildWorkspaceContext,
  contextSuggestedActionIds,
} from "./context";
import { getKairosWorkflow } from "./workflows";
import type {
  KairosAction,
  KairosWorkspaceContext,
} from "./types";

const OPEN_PREFIX =
  /^(open|go to|goto|navigate to|show|take me to|launch|switch to)\s+/i;
const SEARCH_PREFIX = /^(search|find|look up|lookup)\s+/i;
const CREATE_PREFIX = /^(create|add|new)\s+/i;

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function stripPrefix(query: string, prefix: RegExp): string {
  return normalizeQuery(query).replace(prefix, "").trim();
}

function cloneAction(
  action: KairosAction,
  patch: Partial<KairosAction> = {},
): KairosAction {
  return { ...action, ...patch, draft: { ...action.draft, ...patch.draft } };
}

function matchCatalogExact(lowered: string): KairosAction | null {
  for (const action of KAIROS_ACTION_CATALOG) {
    if (action.keywords.some((keyword) => keyword === lowered)) {
      return action;
    }
  }
  return null;
}

/** `/customer Nike`, `/deal`, `/task Follow up`, `/reminder Call Ada`, `/search Acme`, `/advora` */
export function parseSlashCommand(raw: string): KairosAction | null {
  const match = normalizeQuery(raw).match(/^\/([a-zA-Z]+)(?:\s+(.*))?$/);
  if (!match) return null;
  const cmd = match[1]!.toLowerCase();
  const rest = (match[2] ?? "").trim();

  const bySlash = KAIROS_ACTION_CATALOG.find((a) => a.slash === cmd);
  if (bySlash) {
    if (bySlash.kind === "create" && bySlash.createEntity === "customer") {
      const [firstName, ...lastParts] = rest.split(/\s+/).filter(Boolean);
      return cloneAction(bySlash, {
        draft: {
          firstName: firstName ?? "",
          lastName: lastParts.join(" "),
        },
      });
    }
    if (bySlash.kind === "create" && bySlash.createEntity === "deal") {
      return cloneAction(bySlash, { draft: { title: rest } });
    }
    if (
      bySlash.kind === "create" &&
      (bySlash.createEntity === "task" || bySlash.createEntity === "reminder")
    ) {
      return cloneAction(bySlash, { draft: { title: rest } });
    }
    if (bySlash.kind === "search" || bySlash.id === "search-customer") {
      if (!rest) {
        return cloneAction(bySlash, {
          label: "Search Customer",
          confirmation: "Searching customers...",
          searchQuery: "",
        });
      }
      return {
        id: `search-${rest.toLowerCase()}`,
        kind: "search",
        label: `Search “${rest}”`,
        description: "Customers, companies, deals, tasks, and emails",
        confirmation: `Searching ${rest}...`,
        searchQuery: rest,
        href: `/customers?q=${encodeURIComponent(rest)}`,
        keywords: [`search ${rest.toLowerCase()}`],
      };
    }
    return cloneAction(bySlash);
  }

  if (cmd === "help") {
    return cloneAction(getKairosActionById("ask-kairos")!, {
      href: "/chat?prompt=What%20can%20Kairos%20do",
      confirmation: "Opening Kairos...",
    });
  }

  return null;
}

/** `+customer`, `+deal Acme`, `+task`, `+reminder` */
export function parsePlusCommand(raw: string): KairosAction | null {
  const match = normalizeQuery(raw).match(/^\+([a-zA-Z]+)(?:\s+(.*))?$/);
  if (!match) return null;
  const cmd = match[1]!.toLowerCase();
  const rest = (match[2] ?? "").trim();
  const byPlus = KAIROS_ACTION_CATALOG.find((a) => a.plus === cmd);
  if (!byPlus) return null;

  if (byPlus.createEntity === "customer") {
    const [firstName, ...lastParts] = rest.split(/\s+/).filter(Boolean);
    return cloneAction(byPlus, {
      draft: {
        firstName: firstName ?? "",
        lastName: lastParts.join(" "),
      },
    });
  }
  if (
    byPlus.createEntity === "deal" ||
    byPlus.createEntity === "task" ||
    byPlus.createEntity === "reminder"
  ) {
    return cloneAction(byPlus, { draft: { title: rest } });
  }
  return cloneAction(byPlus);
}

function parseCreateIntent(raw: string): KairosAction | null {
  const lowered = raw.toLowerCase();
  if (!CREATE_PREFIX.test(lowered) && !/^(new)\s+/i.test(lowered)) {
    const exact = matchCatalogExact(lowered);
    if (exact?.kind === "create") return exact;
    return null;
  }

  const rest = stripPrefix(raw, /^(create|add|new)\s+/i).toLowerCase();
  if (/^(customer|contact|client)\b/.test(rest)) {
    const name = rest
      .replace(/^(customer|contact|client)\s*(named|called)?\s*/i, "")
      .trim();
    const [firstName, ...lastParts] = name.split(/\s+/).filter(Boolean);
    return cloneAction(getKairosActionById("create-customer")!, {
      draft: {
        firstName: firstName ?? "",
        lastName: lastParts.join(" "),
      },
    });
  }
  if (/^deal\b/.test(rest)) {
    const title = rest.replace(/^deal\s*(named|called|for)?\s*/i, "").trim();
    return cloneAction(getKairosActionById("create-deal")!, {
      draft: { title },
    });
  }
  if (/^task\b/.test(rest)) {
    const title = rest.replace(/^task\s*(named|called|to)?\s*/i, "").trim();
    return cloneAction(getKairosActionById("create-task")!, {
      draft: { title },
    });
  }
  if (/^(follow[- ]?up|followup)\b/.test(rest)) {
    const title = rest.replace(/^(follow[- ]?up|followup)\s*/i, "").trim();
    return cloneAction(getKairosActionById("create-task")!, {
      draft: { title: title || "Follow up with current customer" },
    });
  }
  if (/^reminder\b/.test(rest) || /^remind(er)?\b/.test(rest)) {
    const title = rest
      .replace(/^(reminder|remind( me)?( to)?)\s*/i, "")
      .trim();
    return cloneAction(getKairosActionById("create-reminder")!, {
      draft: { title: title || "Follow up" },
    });
  }
  return null;
}

function parseSearchIntent(raw: string): KairosAction | null {
  const lowered = raw.toLowerCase();
  if (!SEARCH_PREFIX.test(lowered)) {
    if (lowered === "search customer" || lowered === "find customer") {
      return cloneAction(getKairosActionById("search-customer")!);
    }
    return null;
  }
  const q = stripPrefix(raw, SEARCH_PREFIX);
  if (!q) return null;

  // "search customer Nike" → search Nike
  const customerPrefixed = q.replace(/^(customer|customers|contact|contacts)\s+/i, "");
  const query = customerPrefixed || q;

  return {
    id: `search-${query.toLowerCase()}`,
    kind: "search",
    label: `Search “${query}”`,
    description: "Customers, companies, deals, tasks, and emails",
    confirmation: `Searching ${query}...`,
    searchQuery: query,
    href: `/customers?q=${encodeURIComponent(query)}`,
    keywords: [`search ${query.toLowerCase()}`],
  };
}

function parseAskIntent(raw: string): KairosAction | null {
  const match = raw.match(/^(ask kairos|ask ai|kairos[,:]?)\s+(.+)$/i);
  if (!match?.[2]) return null;
  const prompt = match[2].trim();
  return {
    id: "ask-prompt",
    kind: "ask",
    label: "Ask Kairos",
    description: prompt,
    confirmation: "Opening Kairos...",
    href: `/chat?prompt=${encodeURIComponent(prompt)}`,
    keywords: ["ask kairos"],
  };
}

function parseWorkflowIntent(raw: string): KairosAction | null {
  const lowered = raw.toLowerCase();
  for (const workflow of [
    getKairosActionById("workflow-onboard-lead"),
    getKairosActionById("workflow-daily-pulse"),
  ]) {
    if (!workflow) continue;
    if (workflow.keywords.some((k) => k === lowered || lowered.includes(k))) {
      return workflow;
    }
  }
  const wf = getKairosWorkflow(lowered.replace(/\s+/g, "-"));
  if (wf) {
    return getKairosActionById(`workflow-${wf.id}`) ?? null;
  }
  return null;
}

function parseRemindMe(raw: string): KairosAction | null {
  const match = raw.match(/^remind me(?:\s+to)?\s+(.+)$/i);
  if (!match?.[1]) return null;
  return cloneAction(getKairosActionById("create-reminder")!, {
    draft: { title: match[1].trim() },
  });
}

/**
 * Detect the best intent for a natural-language / slash / plus command.
 */
export function detectKairosIntent(
  query: string,
  workspace?: KairosWorkspaceContext,
): KairosAction | null {
  const raw = normalizeQuery(query);
  if (!raw) return null;
  const lowered = raw.toLowerCase();

  const slash = parseSlashCommand(raw);
  if (slash) return slash;

  const plus = parsePlusCommand(raw);
  if (plus) return plus;

  const remind = parseRemindMe(raw);
  if (remind) return remind;

  const create = parseCreateIntent(raw);
  if (create) return create;

  const search = parseSearchIntent(raw);
  if (search) return search;

  const ask = parseAskIntent(raw);
  if (ask) return ask;

  const workflow = parseWorkflowIntent(raw);
  if (workflow) return workflow;

  const exact = matchCatalogExact(lowered);
  if (exact) return exact;

  const stripped = stripPrefix(raw, OPEN_PREFIX).toLowerCase();
  for (const action of KAIROS_ACTION_CATALOG) {
    if (
      action.kind === "navigate" ||
      action.kind === "external" ||
      action.kind === "insight"
    ) {
      const aliases = action.keywords
        .map((k) => k.replace(OPEN_PREFIX, "").trim())
        .filter(Boolean);
      if (aliases.some((alias) => alias === stripped)) {
        return action;
      }
      if (
        aliases.some(
          (alias) =>
            stripped.startsWith(`${alias} `) || stripped.endsWith(` ${alias}`),
        )
      ) {
        return action;
      }
    }
  }

  // Soft context bias: short queries matching current module aliases
  if (workspace && stripped.length >= 2) {
    const contextual = KAIROS_ACTION_CATALOG.filter(
      (a) => a.modules?.includes(workspace.module),
    );
    for (const action of contextual) {
      if (action.keywords.some((k) => k.includes(stripped) || stripped.includes(k))) {
        return action;
      }
    }
  }

  return null;
}

/** Ranked matches for palette suggestions. */
export function matchKairosActions(
  query: string,
  limit = 8,
  workspace?: KairosWorkspaceContext,
): KairosAction[] {
  const raw = normalizeQuery(query);
  const ctx = workspace ?? buildWorkspaceContext("/");

  if (!raw) {
    const ids = contextSuggestedActionIds(ctx.module);
    return ids
      .map((id) => getKairosActionById(id))
      .filter(Boolean)
      .slice(0, limit) as KairosAction[];
  }

  // Slash mode: show matching slash commands
  if (raw.startsWith("/")) {
    const fragment = raw.slice(1).toLowerCase();
    const slashActions = KAIROS_ACTION_CATALOG.filter((a) => a.slash).filter(
      (a) => !fragment || a.slash!.startsWith(fragment) || a.label.toLowerCase().includes(fragment),
    );
    const detected = detectKairosIntent(raw, ctx);
    if (detected && !slashActions.some((a) => a.id === detected.id)) {
      return [detected, ...slashActions].slice(0, limit);
    }
    return (detected ? [detected, ...slashActions.filter((a) => a.id !== detected.id)] : slashActions).slice(
      0,
      limit,
    );
  }

  if (raw.startsWith("+")) {
    const fragment = raw.slice(1).toLowerCase();
    const plusActions = KAIROS_ACTION_CATALOG.filter((a) => a.plus).filter(
      (a) => !fragment || a.plus!.startsWith(fragment),
    );
    const detected = detectKairosIntent(raw, ctx);
    if (detected) {
      return [detected, ...plusActions.filter((a) => a.id !== detected.id)].slice(
        0,
        limit,
      );
    }
    return plusActions.slice(0, limit);
  }

  const detected = detectKairosIntent(raw, ctx);
  const lowered = raw.toLowerCase();
  const scored = KAIROS_ACTION_CATALOG.map((action) => {
    const hay = [action.label, action.description, ...action.keywords]
      .join(" ")
      .toLowerCase();
    let score = 0;
    if (detected?.id === action.id) score += 100;
    if (action.keywords.some((k) => k === lowered)) score += 50;
    if (hay.includes(lowered)) score += 10;
    if (action.label.toLowerCase().startsWith(lowered)) score += 8;
    if (action.modules?.includes(ctx.module)) score += 6;
    return { action, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.action);

  if (detected && !scored.some((a) => a.id === detected.id)) {
    return [detected, ...scored].slice(0, limit);
  }
  if (
    detected?.kind === "search" ||
    detected?.kind === "ask" ||
    detected?.kind === "create"
  ) {
    return [detected, ...scored.filter((a) => a.id !== detected.id)].slice(
      0,
      limit,
    );
  }
  return scored.slice(0, limit);
}

export const SLASH_COMMAND_HINTS = [
  { cmd: "/customer", label: "Create customer" },
  { cmd: "/deal", label: "Create deal" },
  { cmd: "/task", label: "Create task" },
  { cmd: "/reminder", label: "Create reminder" },
  { cmd: "/invoice", label: "Open invoices" },
  { cmd: "/campaign", label: "Open campaigns" },
  { cmd: "/note", label: "Create note" },
  { cmd: "/meeting", label: "Schedule meeting" },
  { cmd: "/search", label: "Search workspace" },
  { cmd: "/help", label: "See what Kairos can do" },
  { cmd: "/advora", label: "Open Advora" },
] as const;

export const PLUS_COMMAND_HINTS = [
  { cmd: "+customer", label: "Quick create customer" },
  { cmd: "+deal", label: "Quick create deal" },
  { cmd: "+task", label: "Quick create task" },
  { cmd: "+note", label: "Quick note" },
  { cmd: "+meeting", label: "Schedule meeting" },
  { cmd: "+reminder", label: "Quick create reminder" },
] as const;

/**
 * Kairos Actions — intent detection + executable action descriptors.
 * Easy to extend with future agents (append to catalogs / parsers).
 */

export type KairosCreateEntity = "customer" | "deal" | "task";

export type KairosActionKind =
  | "navigate"
  | "external"
  | "search"
  | "create"
  | "insight"
  | "ask";

export type KairosAction = {
  id: string;
  kind: KairosActionKind;
  label: string;
  description: string;
  /** Short status shown before execution, e.g. "Opening CRM..." */
  confirmation: string;
  href?: string;
  externalUrl?: string;
  searchQuery?: string;
  createEntity?: KairosCreateEntity;
  draft?: Record<string, string>;
  keywords: string[];
};

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

/** Static catalog — navigation, insights, quick creates. */
export const KAIROS_ACTION_CATALOG: KairosAction[] = [
  {
    id: "open-crm",
    kind: "navigate",
    label: "Open CRM",
    description: "Pipeline, contacts, and deals",
    confirmation: "Opening CRM...",
    href: "/crm",
    keywords: ["open crm", "crm", "pipeline", "sales"],
  },
  {
    id: "open-inbox",
    kind: "navigate",
    label: "Open Inbox",
    description: "AI Inbox threads and tasks",
    confirmation: "Opening Inbox...",
    href: "/inbox",
    keywords: ["open inbox", "inbox", "email", "mail"],
  },
  {
    id: "open-analytics",
    kind: "navigate",
    label: "Open Analytics",
    description: "Workspace performance",
    confirmation: "Opening Analytics...",
    href: "/analytics",
    keywords: ["open analytics", "analytics", "insights", "metrics", "reports"],
  },
  {
    id: "open-customers",
    kind: "navigate",
    label: "Open Customers",
    description: "Customer directory",
    confirmation: "Opening Customers...",
    href: "/customers",
    keywords: ["open customers", "customers", "clients", "contacts", "people"],
  },
  {
    id: "open-deals",
    kind: "navigate",
    label: "Open Deals",
    description: "CRM deals pipeline",
    confirmation: "Opening Deals...",
    href: "/deals",
    keywords: ["open deals", "deals", "deal pipeline"],
  },
  {
    id: "open-settings",
    kind: "navigate",
    label: "Open Settings",
    description: "Workspace settings",
    confirmation: "Opening Settings...",
    href: "/settings",
    keywords: ["open settings", "settings", "preferences"],
  },
  {
    id: "open-marketing",
    kind: "external",
    label: "Open Marketing",
    description: "Launch Advora AI marketing platform",
    confirmation: "Opening Advora...",
    href: "/marketing",
    externalUrl: "https://useadvora.com",
    keywords: ["open marketing", "marketing", "advora", "campaigns"],
  },
  {
    id: "open-dashboard",
    kind: "navigate",
    label: "Open Dashboard",
    description: "Workspace home",
    confirmation: "Opening Dashboard...",
    href: "/dashboard",
    keywords: ["open dashboard", "dashboard", "home", "overview"],
  },
  {
    id: "open-calendar",
    kind: "navigate",
    label: "Open Calendar",
    description: "Meetings and bookings",
    confirmation: "Opening Calendar...",
    href: "/calendar",
    keywords: ["open calendar", "calendar", "meetings", "schedule"],
  },
  {
    id: "create-customer",
    kind: "create",
    label: "Create Customer",
    description: "Add a contact to CRM",
    confirmation: "Creating customer...",
    href: "/customers",
    createEntity: "customer",
    keywords: ["create customer", "add customer", "new customer", "create contact", "add contact"],
  },
  {
    id: "create-deal",
    kind: "create",
    label: "Create Deal",
    description: "Add a deal to the pipeline",
    confirmation: "Creating deal...",
    href: "/deals",
    createEntity: "deal",
    keywords: ["create deal", "add deal", "new deal"],
  },
  {
    id: "create-task",
    kind: "create",
    label: "Create Task",
    description: "Add an inbox follow-up task",
    confirmation: "Creating task...",
    href: "/inbox/tasks",
    createEntity: "task",
    keywords: ["create task", "add task", "new task"],
  },
  {
    id: "today-revenue",
    kind: "insight",
    label: "Show Today's Revenue",
    description: "Jump to analytics / pipeline value",
    confirmation: "Opening today's revenue...",
    href: "/analytics?focus=revenue",
    keywords: [
      "show today's revenue",
      "todays revenue",
      "today's revenue",
      "show revenue",
      "revenue today",
    ],
  },
  {
    id: "today-signups",
    kind: "insight",
    label: "Show Today's Signups",
    description: "Jump to customers / leads",
    confirmation: "Opening today's signups...",
    href: "/customers?focus=signups",
    keywords: [
      "show today's signups",
      "todays signups",
      "today's signups",
      "show signups",
      "signups today",
    ],
  },
  {
    id: "ask-kairos",
    kind: "ask",
    label: "Ask Kairos",
    description: "Open AI chat",
    confirmation: "Opening Kairos...",
    href: "/chat",
    keywords: ["ask kairos", "open chat", "open kairos"],
  },
];

function matchCatalogExact(lowered: string): KairosAction | null {
  for (const action of KAIROS_ACTION_CATALOG) {
    if (action.keywords.some((keyword) => keyword === lowered)) {
      return action;
    }
  }
  return null;
}

function parseCreateIntent(raw: string): KairosAction | null {
  const lowered = raw.toLowerCase();
  if (!CREATE_PREFIX.test(lowered) && !/^(new)\s+/i.test(lowered)) {
    // still allow exact catalog create keywords
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
    return {
      ...KAIROS_ACTION_CATALOG.find((a) => a.id === "create-customer")!,
      draft: {
        firstName: firstName ?? "",
        lastName: lastParts.join(" "),
      },
      confirmation: "Creating customer...",
    };
  }
  if (/^deal\b/.test(rest)) {
    const title = rest.replace(/^deal\s*(named|called|for)?\s*/i, "").trim();
    return {
      ...KAIROS_ACTION_CATALOG.find((a) => a.id === "create-deal")!,
      draft: { title },
      confirmation: "Creating deal...",
    };
  }
  if (/^task\b/.test(rest)) {
    const title = rest.replace(/^task\s*(named|called|to)?\s*/i, "").trim();
    return {
      ...KAIROS_ACTION_CATALOG.find((a) => a.id === "create-task")!,
      draft: { title },
      confirmation: "Creating task...",
    };
  }
  return null;
}

function parseSearchIntent(raw: string): KairosAction | null {
  const lowered = raw.toLowerCase();
  if (!SEARCH_PREFIX.test(lowered)) return null;
  const q = stripPrefix(raw, SEARCH_PREFIX);
  if (!q) return null;
  return {
    id: `search-${q.toLowerCase()}`,
    kind: "search",
    label: `Search “${q}”`,
    description: "Customers, companies, deals, tasks, and emails",
    confirmation: `Searching ${q}...`,
    searchQuery: q,
    href: `/customers?q=${encodeURIComponent(q)}`,
    keywords: [`search ${q.toLowerCase()}`],
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

/**
 * Detect the best intent for a natural-language command.
 */
export function detectKairosIntent(query: string): KairosAction | null {
  const raw = normalizeQuery(query);
  if (!raw) return null;
  const lowered = raw.toLowerCase();

  const create = parseCreateIntent(raw);
  if (create) return create;

  const search = parseSearchIntent(raw);
  if (search) return search;

  const ask = parseAskIntent(raw);
  if (ask) return ask;

  const exact = matchCatalogExact(lowered);
  if (exact) return exact;

  // "open the crm" / "show deals page"
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
      if (aliases.some((alias) => alias === stripped || stripped === alias)) {
        return action;
      }
      if (
        aliases.some(
          (alias) =>
            stripped === alias ||
            stripped.startsWith(`${alias} `) ||
            stripped.endsWith(` ${alias}`),
        )
      ) {
        return action;
      }
    }
  }

  return null;
}

/** Ranked matches for palette suggestions. */
export function matchKairosActions(query: string, limit = 8): KairosAction[] {
  const raw = normalizeQuery(query);
  if (!raw) {
    return KAIROS_ACTION_CATALOG.filter((a) =>
      ["navigate", "external", "create", "insight"].includes(a.kind),
    ).slice(0, limit);
  }

  const detected = detectKairosIntent(raw);
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
    return { action, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.action);

  if (detected && !scored.some((a) => a.id === detected.id)) {
    return [detected, ...scored].slice(0, limit);
  }
  if (detected?.kind === "search" || detected?.kind === "ask") {
    return [detected, ...scored.filter((a) => a.id !== detected.id)].slice(
      0,
      limit,
    );
  }
  return scored.slice(0, limit);
}

/** Suggested actions for empty palette state. */
export const KAIROS_SUGGESTED_ACTIONS: KairosAction[] = [
  "open-crm",
  "open-inbox",
  "open-customers",
  "open-deals",
  "open-analytics",
  "open-marketing",
  "create-customer",
  "create-deal",
  "today-revenue",
]
  .map((id) => KAIROS_ACTION_CATALOG.find((a) => a.id === id)!)
  .filter(Boolean);

// Back-compat helpers used by older imports
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
  if (intent.kind !== "navigate" && intent.kind !== "external" && intent.kind !== "insight") {
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

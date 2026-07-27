/**
 * Natural-language navigation for Kairos Command Center.
 * Examples: "Open Marketing", "go to inbox", "customers"
 */

export type KairosNavTarget = {
  id: string;
  label: string;
  href: string;
  description: string;
  aliases: string[];
  keywords: string[];
};

export const KAIROS_NAV_TARGETS: KairosNavTarget[] = [
  {
    id: "open-marketing",
    label: "Open Marketing",
    href: "/marketing",
    description: "Advora — VanderBase AI marketing platform.",
    aliases: ["marketing", "campaigns", "growth marketing"],
    keywords: ["open marketing", "go to marketing", "show marketing"],
  },
  {
    id: "open-customers",
    label: "Open Customers",
    href: "/customers",
    description: "Customer directory and CRM contacts.",
    aliases: ["customers", "clients", "contacts", "people"],
    keywords: ["open customers", "go to customers", "show customers", "open clients"],
  },
  {
    id: "open-inbox",
    label: "Open Inbox",
    href: "/inbox",
    description: "AI Inbox — threads, labels, and tasks.",
    aliases: ["inbox", "email", "mail", "messages"],
    keywords: ["open inbox", "go to inbox", "show inbox", "open email"],
  },
  {
    id: "open-analytics",
    label: "Open Analytics",
    href: "/analytics",
    description: "Workspace analytics and performance.",
    aliases: ["analytics", "insights", "metrics", "reports"],
    keywords: ["open analytics", "go to analytics", "show analytics", "open reports"],
  },
  {
    id: "open-dashboard",
    label: "Open Dashboard",
    href: "/dashboard",
    description: "Workspace command center.",
    aliases: ["dashboard", "home", "overview"],
    keywords: ["open dashboard", "go to dashboard", "show dashboard"],
  },
  {
    id: "open-crm",
    label: "Open CRM",
    href: "/crm",
    description: "Pipeline, deals, and leads.",
    aliases: ["crm", "pipeline", "deals", "sales"],
    keywords: ["open crm", "go to crm", "show crm", "open pipeline"],
  },
  {
    id: "open-calendar",
    label: "Open Calendar",
    href: "/calendar",
    description: "Meetings, availability, and bookings.",
    aliases: ["calendar", "meetings", "schedule"],
    keywords: ["open calendar", "go to calendar", "show calendar"],
  },
  {
    id: "open-chat",
    label: "Ask Kairos",
    href: "/chat",
    description: "Open Kairos chat.",
    aliases: ["kairos", "chat", "assistant", "ai"],
    keywords: ["ask kairos", "open chat", "talk to kairos", "open kairos"],
  },
  {
    id: "open-ai",
    label: "Open AI Studio",
    href: "/ai",
    description: "Agents, memory, and command center.",
    aliases: ["ai studio", "agents", "studio"],
    keywords: ["open ai", "open ai studio", "open agents"],
  },
  {
    id: "open-content",
    label: "Open Content",
    href: "/content",
    description: "Content OS drafts and library.",
    aliases: ["content", "content os", "writer"],
    keywords: ["open content", "go to content"],
  },
  {
    id: "open-social",
    label: "Open Social",
    href: "/social",
    description: "Social Media OS.",
    aliases: ["social", "social os"],
    keywords: ["open social", "go to social"],
  },
  {
    id: "open-website",
    label: "Open Website",
    href: "/website",
    description: "Website & landing pages.",
    aliases: ["website", "website os", "pages"],
    keywords: ["open website", "go to website"],
  },
  {
    id: "open-settings",
    label: "Open Settings",
    href: "/settings",
    description: "Workspace settings.",
    aliases: ["settings", "preferences"],
    keywords: ["open settings", "go to settings"],
  },
  {
    id: "open-team",
    label: "Open Team",
    href: "/team",
    description: "Members and invitations.",
    aliases: ["team", "members"],
    keywords: ["open team", "go to team"],
  },
];

const OPEN_PREFIX =
  /^(open|go to|goto|navigate to|show|take me to|launch|switch to)\s+/i;

export function normalizeCommandQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

export function stripOpenPrefix(query: string): string {
  return normalizeCommandQuery(query).replace(OPEN_PREFIX, "").trim();
}

/**
 * Resolve natural-language navigation like "Open Marketing" → /marketing.
 */
export function resolveNaturalLanguageNav(
  query: string,
): KairosNavTarget | null {
  const raw = normalizeCommandQuery(query);
  if (!raw) return null;

  const lowered = raw.toLowerCase();
  const stripped = stripOpenPrefix(raw).toLowerCase();

  for (const target of KAIROS_NAV_TARGETS) {
    if (target.keywords.some((keyword) => keyword === lowered)) {
      return target;
    }
  }

  for (const target of KAIROS_NAV_TARGETS) {
    if (target.aliases.some((alias) => alias === stripped || alias === lowered)) {
      return target;
    }
  }

  // Fuzzy: "open the marketing page" etc.
  for (const target of KAIROS_NAV_TARGETS) {
    if (
      target.aliases.some(
        (alias) =>
          stripped === alias ||
          stripped.startsWith(`${alias} `) ||
          stripped.endsWith(` ${alias}`) ||
          stripped.includes(` ${alias} `),
      )
    ) {
      return target;
    }
  }

  return null;
}

export function matchNaturalLanguageNav(
  query: string,
  limit = 6,
): KairosNavTarget[] {
  const raw = normalizeCommandQuery(query);
  if (!raw) return KAIROS_NAV_TARGETS.slice(0, limit);

  const exact = resolveNaturalLanguageNav(raw);
  if (exact) return [exact];

  const lowered = raw.toLowerCase();
  const stripped = stripOpenPrefix(raw).toLowerCase();

  return KAIROS_NAV_TARGETS.filter((target) => {
    const haystack = [
      target.label,
      target.description,
      ...target.aliases,
      ...target.keywords,
    ]
      .join(" ")
      .toLowerCase();
    return (
      haystack.includes(lowered) ||
      haystack.includes(stripped) ||
      target.aliases.some((alias) => alias.includes(stripped))
    );
  }).slice(0, limit);
}

/** Detect freeform "ask Kairos …" prompts for chat handoff. */
export function resolveAskKairosPrompt(query: string): string | null {
  const raw = normalizeCommandQuery(query);
  const match = raw.match(
    /^(ask kairos|ask ai|kairos[,:]?)\s+(.+)$/i,
  );
  if (!match?.[2]) return null;
  return match[2].trim();
}

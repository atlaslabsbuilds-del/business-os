import {
  listCompanies,
  listContacts,
  listDeals,
} from "@repo/database/crm";
import { listInboxTasks, listInboxThreads } from "@repo/database/inbox";
import { listConversations } from "@repo/database/chat";
import { listContentItems } from "@repo/database/content";
import { listSocialPosts } from "@repo/database/social";
import { listWorkspaceAiMemory } from "@repo/database/workspace-memory";
import { matchKairosCommands } from "./kairos-commands";
import { KAIROS_AGENTS } from "./kairos-agents";

export type GlobalSearchModule =
  | "crm"
  | "inbox"
  | "chat"
  | "content"
  | "social"
  | "calendar"
  | "tasks"
  | "memory"
  | "agents"
  | "settings"
  | "command"
  | "nav";

export type GlobalSearchResult = {
  id: string;
  module: GlobalSearchModule;
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

export type GlobalSearchAdapter = {
  module: GlobalSearchModule;
  search: (input: {
    workspaceId: string;
    userId: string;
    query: string;
    limit: number;
  }) => Promise<GlobalSearchResult[]>;
};

const crmSearchAdapter: GlobalSearchAdapter = {
  module: "crm",
  async search({ workspaceId, query, limit }) {
    const [contacts, companies, deals] = await Promise.all([
      listContacts({ workspaceId, query }),
      listCompanies({ workspaceId, query }),
      listDeals({ workspaceId, query }),
    ]);

    return [
      ...contacts.slice(0, limit).map((contact) => ({
        id: contact.id,
        module: "crm" as const,
        type: contact.lifecycleStage === "lead" ? "lead" : "contact",
        title: `${contact.firstName} ${contact.lastName}`.trim(),
        subtitle: contact.email ?? "CRM contact",
        href:
          contact.lifecycleStage === "lead" ? "/crm/leads" : "/crm/contacts",
      })),
      ...companies.slice(0, limit).map((company) => ({
        id: company.id,
        module: "crm" as const,
        type: "company",
        title: company.name,
        subtitle: company.domain ?? company.industry ?? "CRM company",
        href: "/crm/companies",
      })),
      ...deals.slice(0, limit).map((deal) => ({
        id: deal.id,
        module: "crm" as const,
        type: "deal",
        title: deal.title,
        subtitle: `${deal.stage} · $${deal.amount.toLocaleString()}`,
        href: "/crm/deals",
      })),
    ].slice(0, limit);
  },
};

const inboxSearchAdapter: GlobalSearchAdapter = {
  module: "inbox",
  async search({ workspaceId, query, limit }) {
    const threads = await listInboxThreads({ workspaceId, query });
    return threads.slice(0, limit).map((thread) => ({
      id: thread.id,
      module: "inbox" as const,
      type: thread.isUnread ? "unread thread" : "thread",
      title: thread.subject || "(no subject)",
      subtitle: thread.snippet || "Inbox thread",
      href: `/inbox/threads/${thread.id}`,
    }));
  },
};

const chatSearchAdapter: GlobalSearchAdapter = {
  module: "chat",
  async search({ workspaceId, userId, query, limit }) {
    const conversations = await listConversations({
      workspaceId,
      userId,
      query,
    });
    return conversations.slice(0, limit).map((conversation) => ({
      id: conversation.id,
      module: "chat" as const,
      type: "conversation",
      title: conversation.title,
      subtitle: `${conversation.provider} · ${conversation.model}`,
      href: `/chat?c=${conversation.id}`,
    }));
  },
};

const contentSearchAdapter: GlobalSearchAdapter = {
  module: "content",
  async search({ workspaceId, query, limit }) {
    const items = await listContentItems({ workspaceId, limit: 100 });
    const q = query.toLowerCase();
    return items
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.body.toLowerCase().includes(q),
      )
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        module: "content" as const,
        type: item.status,
        title: item.title,
        subtitle: `Content · ${item.contentType}`,
        href: "/content",
      }));
  },
};

const socialSearchAdapter: GlobalSearchAdapter = {
  module: "social",
  async search({ workspaceId, query, limit }) {
    const posts = await listSocialPosts({ workspaceId, limit: 100 });
    const q = query.toLowerCase();
    return posts
      .filter(
        (post) =>
          post.title.toLowerCase().includes(q) ||
          post.body.toLowerCase().includes(q),
      )
      .slice(0, limit)
      .map((post) => ({
        id: post.id,
        module: "social" as const,
        type: post.status,
        title: post.title,
        subtitle: post.platforms.join(", ") || "Social post",
        href: "/social",
      }));
  },
};

const tasksSearchAdapter: GlobalSearchAdapter = {
  module: "tasks",
  async search({ workspaceId, query, limit }) {
    const tasks = await listInboxTasks({ workspaceId });
    const q = query.toLowerCase();
    return tasks
      .filter((task) => task.title.toLowerCase().includes(q))
      .slice(0, limit)
      .map((task) => ({
        id: task.id,
        module: "tasks" as const,
        type: task.status,
        title: task.title,
        subtitle: task.dueAt
          ? `Due ${new Date(task.dueAt).toLocaleDateString()}`
          : "Task",
        href: "/inbox/tasks",
      }));
  },
};

const memorySearchAdapter: GlobalSearchAdapter = {
  module: "memory",
  async search({ workspaceId, query, limit }) {
    const memories = await listWorkspaceAiMemory({
      workspaceId,
      limit: 50,
    });
    const q = query.toLowerCase();
    return memories
      .filter(
        (memory) =>
          memory.fact.toLowerCase().includes(q) ||
          (memory.summary ?? "").toLowerCase().includes(q),
      )
      .slice(0, limit)
      .map((memory) => ({
        id: memory.id,
        module: "memory" as const,
        type: memory.scope,
        title: memory.fact.slice(0, 80),
        subtitle: memory.summary ?? `Memory · ${memory.sourceModule}`,
        href: "/ai/memory",
      }));
  },
};

const NAV_ITEMS: GlobalSearchResult[] = [
  {
    id: "nav-dashboard",
    module: "nav",
    type: "page",
    title: "Dashboard",
    subtitle: "Command center",
    href: "/dashboard",
  },
  {
    id: "nav-marketing",
    module: "nav",
    type: "page",
    title: "Marketing",
    subtitle: "Content, social, and website growth",
    href: "/marketing",
  },
  {
    id: "nav-customers",
    module: "nav",
    type: "page",
    title: "Customers",
    subtitle: "CRM contacts and accounts",
    href: "/customers",
  },
  {
    id: "nav-deals",
    module: "nav",
    type: "page",
    title: "Deals",
    subtitle: "CRM deal pipeline",
    href: "/deals",
  },
  {
    id: "nav-analytics",
    module: "nav",
    type: "page",
    title: "Analytics",
    subtitle: "Workspace performance",
    href: "/analytics",
  },
  {
    id: "nav-ai",
    module: "nav",
    type: "page",
    title: "AI Studio",
    subtitle: "Agents, memory, command center",
    href: "/ai",
  },
  {
    id: "nav-crm",
    module: "nav",
    type: "page",
    title: "CRM",
    subtitle: "Contacts, deals, leads",
    href: "/crm",
  },
  {
    id: "nav-inbox",
    module: "nav",
    type: "page",
    title: "Inbox",
    subtitle: "Email and tasks",
    href: "/inbox",
  },
  {
    id: "nav-content",
    module: "nav",
    type: "page",
    title: "Content OS",
    subtitle: "Drafts and library",
    href: "/content",
  },
  {
    id: "nav-social",
    module: "nav",
    type: "page",
    title: "Social OS",
    subtitle: "Scheduling and analytics",
    href: "/social",
  },
  {
    id: "nav-website",
    module: "nav",
    type: "page",
    title: "Website OS",
    subtitle: "Pages and forms",
    href: "/website",
  },
  {
    id: "nav-calendar",
    module: "nav",
    type: "page",
    title: "Calendar OS",
    subtitle: "Meetings and booking",
    href: "/calendar",
  },
  {
    id: "nav-settings",
    module: "settings",
    type: "page",
    title: "Settings",
    subtitle: "Workspace and integrations",
    href: "/settings",
  },
  {
    id: "nav-team",
    module: "settings",
    type: "page",
    title: "Team",
    subtitle: "Members and invites",
    href: "/team",
  },
];

export const globalSearchAdapters: GlobalSearchAdapter[] = [
  crmSearchAdapter,
  inboxSearchAdapter,
  chatSearchAdapter,
  contentSearchAdapter,
  socialSearchAdapter,
  tasksSearchAdapter,
  memorySearchAdapter,
];

export async function globalSearch(input: {
  workspaceId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<GlobalSearchResult[]> {
  const query = input.query.trim();
  if (!query) return [];

  const limit = input.limit ?? 12;
  const q = query.toLowerCase();

  const commandResults: GlobalSearchResult[] = matchKairosCommands(query, 6).map(
    (command) => ({
      id: command.id,
      module: "command",
      type: "command",
      title: command.label,
      subtitle: command.description,
      href: command.href,
    }),
  );

  const agentResults: GlobalSearchResult[] = KAIROS_AGENTS.filter((agent) =>
    `${agent.name} ${agent.description}`.toLowerCase().includes(q),
  ).map((agent) => ({
    id: agent.id,
    module: "agents",
    type: "agent",
    title: agent.name,
    subtitle: agent.description,
    href: `/ai/agents?agent=${agent.id}`,
  }));

  const navResults = NAV_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q),
  );

  const adapterResults = await Promise.all(
    globalSearchAdapters.map((adapter) =>
      adapter
        .search({
          workspaceId: input.workspaceId,
          userId: input.userId,
          query,
          limit: Math.max(3, Math.floor(limit / 2)),
        })
        .catch(() => [] as GlobalSearchResult[]),
    ),
  );

  return [
    ...commandResults,
    ...agentResults,
    ...navResults,
    ...adapterResults.flat(),
  ].slice(0, limit);
}

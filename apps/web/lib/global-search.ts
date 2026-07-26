import {
  listCompanies,
  listContacts,
  listDeals,
} from "@repo/database/crm";
import { listInboxThreads } from "@repo/database/inbox";
import { listConversations } from "@repo/database/chat";

export type GlobalSearchModule = "crm" | "inbox" | "chat";

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
          contact.lifecycleStage === "lead"
            ? "/crm/leads"
            : `/crm/contacts`,
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
      module: "inbox",
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
    const conversations = await listConversations({ workspaceId, userId, query });
    return conversations.slice(0, limit).map((conversation) => ({
      id: conversation.id,
      module: "chat",
      type: "conversation",
      title: conversation.title,
      subtitle: `${conversation.provider} · ${conversation.model}`,
      href: `/chat?c=${conversation.id}`,
    }));
  },
};

export const globalSearchAdapters: GlobalSearchAdapter[] = [
  crmSearchAdapter,
  inboxSearchAdapter,
  chatSearchAdapter,
];

export async function globalSearch(input: {
  workspaceId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<GlobalSearchResult[]> {
  const query = input.query.trim();
  if (!query) return [];

  const limit = input.limit ?? 8;
  const results = await Promise.all(
    globalSearchAdapters.map((adapter) =>
      adapter.search({
        workspaceId: input.workspaceId,
        userId: input.userId,
        query,
        limit,
      }),
    ),
  );

  return results.flat().slice(0, limit);
}

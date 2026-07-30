import {
  listCompanies,
  listContacts,
  listDeals,
  listNotes,
} from "@repo/database/crm";
import { listInboxTasks, listInboxThreads } from "@repo/database/inbox";
import { listConversations } from "@repo/database/chat";
import { listContentItems } from "@repo/database/content";
import { listSocialPosts } from "@repo/database/social";
import { listWorkspaceAiMemory } from "@repo/database/workspace-memory";
import { listProjects, listProjectTasks } from "@repo/database/projects";
import { listDocuments } from "@repo/database/documents";
import { listFinanceExpenses, listFinanceInvoices } from "@repo/database/finance";
import { listCalendarEvents } from "@repo/database/calendar-module";
import { listAnalyticsReports } from "@repo/database/analytics";
import { listNotificationsForUser } from "@repo/database/notifications";
import { matchKairosCommands } from "./kairos-commands";
import { KAIROS_AGENTS } from "./kairos-agents";

export type GlobalSearchModule =
  | "crm"
  | "inbox"
  | "chat"
  | "content"
  | "social"
  | "projects"
  | "documents"
  | "finance"
  | "calendar"
  | "analytics"
  | "notifications"
  | "tasks"
  | "memory"
  | "notes"
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

const projectsSearchAdapter: GlobalSearchAdapter = {
  module: "projects",
  async search({ workspaceId, query, limit }) {
    const [projects, tasks] = await Promise.all([
      listProjects({ workspaceId, query }),
      listProjectTasks({ workspaceId, query }),
    ]);
    return [
      ...projects.slice(0, limit).map((project) => ({
        id: project.id,
        module: "projects" as const,
        type: project.status,
        title: project.name,
        subtitle: project.description ?? "Project",
        href: "/projects",
      })),
      ...tasks.slice(0, limit).map((task) => ({
        id: task.id,
        module: "tasks" as const,
        type: task.status,
        title: task.title,
        subtitle: task.description ?? "Project task",
        href: "/projects/tasks",
      })),
    ].slice(0, limit);
  },
};

const documentsSearchAdapter: GlobalSearchAdapter = {
  module: "documents",
  async search({ workspaceId, query, limit }) {
    const documents = await listDocuments({ workspaceId, query });
    return documents.slice(0, limit).map((document) => ({
      id: document.id,
      module: "documents" as const,
      type: document.isKnowledge ? "knowledge" : document.status,
      title: document.title,
      subtitle: document.summary ?? (document.content.slice(0, 80) || "Document"),
      href: `/documents/${document.id}`,
    }));
  },
};

const financeSearchAdapter: GlobalSearchAdapter = {
  module: "finance",
  async search({ workspaceId, query, limit }) {
    const [invoices, expenses] = await Promise.all([
      listFinanceInvoices({ workspaceId, query }),
      listFinanceExpenses({ workspaceId, query }),
    ]);
    return [
      ...invoices.slice(0, limit).map((invoice) => ({
        id: invoice.id,
        module: "finance" as const,
        type: invoice.status,
        title: invoice.invoiceNumber,
        subtitle: `${invoice.customerName} · ${invoice.currency} ${invoice.total.toLocaleString()}`,
        href: "/finance/invoices",
      })),
      ...expenses.slice(0, limit).map((expense) => ({
        id: expense.id,
        module: "finance" as const,
        type: expense.status,
        title: expense.vendor,
        subtitle: `${expense.category} · ${expense.currency} ${expense.amount.toLocaleString()}`,
        href: "/finance/expenses",
      })),
    ].slice(0, limit);
  },
};

const calendarSearchAdapter: GlobalSearchAdapter = {
  module: "calendar",
  async search({ workspaceId, query, limit }) {
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    const to = new Date();
    to.setMonth(to.getMonth() + 3);
    const events = await listCalendarEvents({
      workspaceId,
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const q = query.toLowerCase();
    return events
      .filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          (event.description?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, limit)
      .map((event) => ({
        id: event.id,
        module: "calendar" as const,
        type: event.status,
        title: event.title,
        subtitle: new Date(event.startsAt).toLocaleString(),
        href: "/calendar",
      }));
  },
};

const analyticsSearchAdapter: GlobalSearchAdapter = {
  module: "analytics",
  async search({ workspaceId, query, limit }) {
    const reports = await listAnalyticsReports({ workspaceId });
    const q = query.toLowerCase();
    return reports
      .filter(
        (report) =>
          report.name.toLowerCase().includes(q) ||
          report.reportType.toLowerCase().includes(q),
      )
      .slice(0, limit)
      .map((report) => ({
        id: report.id,
        module: "analytics" as const,
        type: report.reportType,
        title: report.name,
        subtitle: `Generated ${new Date(report.generatedAt).toLocaleDateString()}`,
        href: "/analytics?view=reports",
      }));
  },
};

const notificationsSearchAdapter: GlobalSearchAdapter = {
  module: "notifications",
  async search({ workspaceId, userId, query, limit }) {
    const notifications = await listNotificationsForUser({
      workspaceId,
      userId,
      query,
      limit,
    });
    return notifications.map((notification) => ({
      id: notification.id,
      module: "notifications" as const,
      type: notification.category,
      title: notification.title,
      subtitle: notification.body ?? notification.priority,
      href: notification.actionUrl ?? "/notifications",
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

const notesSearchAdapter: GlobalSearchAdapter = {
  module: "notes",
  async search({ workspaceId, query, limit }) {
    const notes = await listNotes({ workspaceId });
    const q = query.toLowerCase();
    return notes
      .filter((note) => note.body.toLowerCase().includes(q))
      .slice(0, limit)
      .map((note) => ({
        id: note.id,
        module: "notes" as const,
        type: "note",
        title: note.body.slice(0, 80),
        subtitle: "CRM note",
        href: "/crm/notes",
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
    id: "nav-projects",
    module: "projects",
    type: "page",
    title: "Projects",
    subtitle: "Tasks, Kanban, calendar, timeline, and reports",
    href: "/projects",
  },
  {
    id: "nav-documents",
    module: "documents",
    type: "page",
    title: "Documents",
    subtitle: "Docs, folders, knowledge base, and templates",
    href: "/documents",
  },
  {
    id: "nav-finance",
    module: "finance",
    type: "page",
    title: "Finance",
    subtitle: "Invoices, expenses, budgets, cash flow, and reports",
    href: "/finance",
  },
  {
    id: "nav-notifications",
    module: "notifications",
    type: "page",
    title: "Notifications",
    subtitle: "Unread alerts, mentions, tasks, finance, CRM, and system events",
    href: "/notifications",
  },
  {
    id: "nav-integrations",
    module: "settings",
    type: "page",
    title: "Integrations",
    subtitle: "Connect email, calendar, and business tools",
    href: "/integrations",
  },
  {
    id: "nav-billing",
    module: "settings",
    type: "page",
    title: "Billing",
    subtitle: "Plans, purchases, credits, and payment settings",
    href: "/billing",
  },
  {
    id: "nav-security",
    module: "settings",
    type: "page",
    title: "Security",
    subtitle: "Sessions, API keys, audit logs, and MFA readiness",
    href: "/settings/security",
  },
  {
    id: "nav-help",
    module: "nav",
    type: "page",
    title: "Help Center",
    subtitle: "Docs, tutorials, videos, FAQs, and release notes",
    href: "/help",
  },
  {
    id: "nav-support",
    module: "nav",
    type: "page",
    title: "Support",
    subtitle: "Contact support, bug reports, and feature requests",
    href: "/support",
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
  projectsSearchAdapter,
  documentsSearchAdapter,
  financeSearchAdapter,
  calendarSearchAdapter,
  analyticsSearchAdapter,
  notificationsSearchAdapter,
  tasksSearchAdapter,
  memorySearchAdapter,
  notesSearchAdapter,
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

import {
  createGateway,
  createToolRegistry,
  createCrmTools,
  registerCrmTools,
  createConversationMemory,
  createWorkspaceMemory,
  createEmbeddingsClient,
  createKnowledgeIndex,
  createMemoryRetriever,
  creditEngine,
  type ToolRegistry,
} from "@repo/ai";
import {
  createLead,
  getCustomerTimeline,
  listContacts,
  listDeals,
  searchCompanies,
  updateDeal,
  contactDisplayName,
} from "@repo/database/crm";

let crmRegistry: ToolRegistry | null = null;

function buildCrmToolDeps() {
  return {
    async listContacts(input: {
      workspaceId: string;
      query?: string;
      stage?: string;
      limit?: number;
    }) {
      const contacts = await listContacts({
        workspaceId: input.workspaceId,
        query: input.query,
        stage: input.stage as
          | "lead"
          | "qualified"
          | "customer"
          | "churned"
          | "other"
          | undefined,
      });
      return contacts.slice(0, input.limit ?? contacts.length).map((contact) => ({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        lifecycleStage: contact.lifecycleStage,
        companyId: contact.companyId,
      }));
    },
    async createLead(input: {
      workspaceId: string;
      userId: string;
      firstName: string;
      lastName?: string;
      email?: string | null;
      phone?: string | null;
      source?: string | null;
    }) {
      const lead = await createLead(input);
      return {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
      };
    },
    async updateDeal(input: {
      workspaceId: string;
      id: string;
      title?: string;
      amount?: number;
      stage?: string;
      probability?: number;
    }) {
      const deal = await updateDeal({
        workspaceId: input.workspaceId,
        id: input.id,
        title: input.title,
        amount: input.amount,
        stage: input.stage as
          | "qualified"
          | "proposal"
          | "negotiation"
          | "won"
          | "lost"
          | undefined,
        probability: input.probability,
      });
      return {
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        amount: deal.amount,
      };
    },
    async searchCompany(input: {
      workspaceId: string;
      query: string;
      limit?: number;
    }) {
      const companies = await searchCompanies(input);
      return companies.map((company) => ({
        id: company.id,
        name: company.name,
        domain: company.domain,
        industry: company.industry,
      }));
    },
    async getCustomerTimeline(input: {
      workspaceId: string;
      contactId: string;
    }) {
      const items = await getCustomerTimeline(input);
      return items.map((entry) => {
        if (entry.kind === "activity") {
          return {
            kind: entry.kind,
            id: entry.item.id,
            title: entry.item.subject,
            createdAt: entry.item.createdAt,
          };
        }
        if (entry.kind === "note") {
          return {
            kind: entry.kind,
            id: entry.item.id,
            title: entry.item.body.slice(0, 80),
            createdAt: entry.item.createdAt,
          };
        }
        return {
          kind: entry.kind,
          id: entry.item.id,
          title: entry.item.title,
          createdAt: entry.item.createdAt,
        };
      });
    },
    async listDeals(input: {
      workspaceId: string;
      stage?: string;
      query?: string;
    }) {
      const deals = await listDeals({
        workspaceId: input.workspaceId,
        query: input.query,
        stage: input.stage as
          | "qualified"
          | "proposal"
          | "negotiation"
          | "won"
          | "lost"
          | undefined,
      });
      return deals.map((deal) => ({
        id: deal.id,
        title: deal.title,
        stage: deal.stage,
        amount: deal.amount,
      }));
    },
  };
}

/**
 * Ensures CRM AI tools are registered on the shared registry.
 * Called from every CRM server action so tools stay in sync with the module.
 */
export function ensureCrmAiToolsRegistered(): {
  registry: ToolRegistry;
  registered: string[];
} {
  if (!crmRegistry) {
    crmRegistry = createToolRegistry(createCrmTools(buildCrmToolDeps()));
  } else {
    registerCrmTools(crmRegistry, buildCrmToolDeps());
  }
  return {
    registry: crmRegistry,
    registered: crmRegistry.list().map((tool) => tool.name),
  };
}

/**
 * Shared AI stack for CRM-aware assistants (gateway + memory + knowledge + credits).
 */
export function createCrmAiStack() {
  const { registry } = ensureCrmAiToolsRegistered();
  const gateway = createGateway({ tools: registry });
  const embeddings = createEmbeddingsClient(gateway);
  const workspaceMemory = createWorkspaceMemory({ embeddings });
  const conversationMemory = createConversationMemory({ gateway });
  const knowledge = createKnowledgeIndex({ gateway });
  const retriever = createMemoryRetriever({
    conversationMemory,
    workspaceMemory,
    knowledge: {
      async retrieve(input) {
        const hits = await knowledge.retrieve(input);
        return hits.map((hit) => ({
          id: hit.chunk.id,
          content: hit.chunk.content,
          score: hit.score,
          documentId: hit.document.id,
          title: hit.document.title,
          metadata: hit.chunk.metadata,
        }));
      },
    },
  });

  return {
    gateway,
    registry,
    embeddings,
    workspaceMemory,
    conversationMemory,
    knowledge,
    retriever,
    creditEngine,
  };
}

export { contactDisplayName };

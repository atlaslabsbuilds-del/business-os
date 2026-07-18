import {
  createGateway,
  createToolRegistry,
  createGmailTools,
  registerGmailTools,
  createConversationMemory,
  createWorkspaceMemory,
  createEmbeddingsClient,
  createKnowledgeIndex,
  createMemoryRetriever,
  creditEngine,
  type ToolRegistry,
} from "@repo/ai";
import {
  getInboxThreadDetail,
  listInboxThreads,
} from "@repo/database/inbox";
import {
  gmailArchive,
  gmailCreateDraft,
  gmailDelete,
  gmailReply,
  gmailSearch,
  gmailSend,
  syncGmailAccount,
} from "./gmail-sync";

let gmailRegistry: ToolRegistry | null = null;

function buildGmailToolDeps() {
  return {
    async sync(input: {
      workspaceId: string;
      userId: string;
      accountId: string;
      full?: boolean;
    }) {
      const result = await syncGmailAccount(input);
      return {
        mode: result.mode,
        threadsUpserted: result.threadsUpserted,
        messagesUpserted: result.messagesUpserted,
        labelsUpserted: result.labelsUpserted,
        attachmentsUpserted: result.attachmentsUpserted,
        historyId: result.historyId,
        summariesGenerated: result.summariesGenerated,
        tasksCreated: result.tasksCreated,
        meetingsScheduled: result.meetingsScheduled,
        linkedContacts: result.linkedContacts,
        errors: result.errors,
        progress: result.progress,
      };
    },
    async listThreads(input: {
      workspaceId: string;
      accountId?: string;
      query?: string;
      limit?: number;
    }) {
      const threads = await listInboxThreads({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        query: input.query,
      });
      return threads.slice(0, input.limit ?? 40).map((thread) => ({
        id: thread.id,
        subject: thread.subject,
        snippet: thread.snippet,
        status: thread.status,
        isUnread: thread.isUnread,
        aiPriority: thread.aiPriority,
        lastMessageAt: thread.lastMessageAt,
      }));
    },
    async readThread(input: { workspaceId: string; threadId: string }) {
      const detail = await getInboxThreadDetail(input);
      if (!detail) return null;
      return {
        thread: {
          id: detail.thread.id,
          subject: detail.thread.subject,
          aiSummary: detail.thread.aiSummary,
          aiPriority: detail.thread.aiPriority,
          aiClassification: detail.thread.aiClassification,
        },
        messages: detail.messages.map((message) => ({
          id: message.id,
          fromEmail: message.fromEmail,
          bodyText: message.bodyText,
          sentAt: message.sentAt,
          direction: message.direction,
        })),
      };
    },
    async send(input: {
      workspaceId: string;
      userId: string;
      accountId: string;
      to: string[];
      cc?: string[];
      subject: string;
      body: string;
      threadId?: string | null;
    }) {
      return gmailSend(input);
    },
    async reply(input: {
      workspaceId: string;
      userId: string;
      threadId: string;
      body: string;
      replyAll?: boolean;
    }) {
      return gmailReply(input);
    },
    async archive(input: {
      workspaceId: string;
      userId: string;
      threadId: string;
    }) {
      return gmailArchive(input);
    },
    async delete(input: {
      workspaceId: string;
      userId: string;
      threadId: string;
    }) {
      return gmailDelete(input);
    },
    async createDraft(input: {
      workspaceId: string;
      userId: string;
      accountId: string;
      to: string[];
      subject: string;
      body: string;
      threadId?: string | null;
    }) {
      return gmailCreateDraft(input);
    },
    async search(input: {
      workspaceId: string;
      userId: string;
      accountId?: string;
      query: string;
      limit?: number;
    }) {
      return gmailSearch(input);
    },
  };
}

export function ensureGmailAiToolsRegistered(): {
  registry: ToolRegistry;
  registered: string[];
} {
  if (!gmailRegistry) {
    gmailRegistry = createToolRegistry(createGmailTools(buildGmailToolDeps()));
  } else {
    registerGmailTools(gmailRegistry, buildGmailToolDeps());
  }
  return {
    registry: gmailRegistry,
    registered: gmailRegistry.list().map((tool) => tool.name),
  };
}

export function createGmailAiStack() {
  const { registry } = ensureGmailAiToolsRegistered();
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

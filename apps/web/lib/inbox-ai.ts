import {
  createGateway,
  createToolRegistry,
  createInboxTools,
  registerInboxTools,
  createInboxSummarizer,
  createInboxSmartReply,
  detectMeetingIntent,
  createConversationMemory,
  createWorkspaceMemory,
  createEmbeddingsClient,
  createKnowledgeIndex,
  createMemoryRetriever,
  creditEngine,
  getMailProviderAdapter,
  type ToolRegistry,
} from "@repo/ai";
import {
  archiveInboxThread,
  createInboxReply,
  createInboxTask,
  getInboxThread,
  getInboxThreadDetail,
  listInboxAccounts,
  listInboxThreads,
  scheduleInboxMeeting,
  updateThreadSummary,
} from "@repo/database/inbox";
import { getInboxAccountSecrets } from "@repo/database/gmail";
import { deductWorkspaceCredits } from "@repo/database/credits";
import {
  getContact,
  getCustomerTimeline,
  listContacts,
  contactDisplayName,
} from "@repo/database/crm";

let inboxRegistry: ToolRegistry | null = null;

async function buildCustomerContext(input: {
  workspaceId: string;
  threadId: string;
}): Promise<string> {
  const thread = await getInboxThread({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!thread?.contactId) {
    const emails = thread?.participants.map((p) => p.email.toLowerCase()) ?? [];
    if (emails.length === 0) return "";
    const contacts = await listContacts({ workspaceId: input.workspaceId });
    const match = contacts.find(
      (contact) => contact.email && emails.includes(contact.email.toLowerCase()),
    );
    if (!match) return "";
    const timeline = await getCustomerTimeline({
      workspaceId: input.workspaceId,
      contactId: match.id,
    });
    return [
      `Contact: ${contactDisplayName(match)} <${match.email}>`,
      `Stage: ${match.lifecycleStage}`,
      `Recent CRM items: ${timeline.slice(0, 5).map((item) => item.kind).join(", ")}`,
    ].join("\n");
  }

  const contact = await getContact({
    workspaceId: input.workspaceId,
    id: thread.contactId,
  });
  if (!contact) return "";
  const timeline = await getCustomerTimeline({
    workspaceId: input.workspaceId,
    contactId: contact.id,
  });
  return [
    `Contact: ${contactDisplayName(contact)} <${contact.email}>`,
    `Stage: ${contact.lifecycleStage}`,
    `Recent CRM items: ${timeline.slice(0, 5).map((item) => item.kind).join(", ")}`,
  ].join("\n");
}

function buildInboxToolDeps() {
  return {
    async listThreads(input: {
      workspaceId: string;
      query?: string;
      status?: string;
      unreadOnly?: boolean;
      limit?: number;
    }) {
      const threads = await listInboxThreads({
        workspaceId: input.workspaceId,
        query: input.query,
        status: input.status as
          | "open"
          | "archived"
          | "trashed"
          | "spam"
          | undefined,
        unreadOnly: input.unreadOnly,
      });
      const accounts = await listInboxAccounts({
        workspaceId: input.workspaceId,
      });
      const accountMap = new Map(accounts.map((a) => [a.id, a]));
      return threads.slice(0, input.limit ?? threads.length).map((thread) => ({
        id: thread.id,
        subject: thread.subject,
        snippet: thread.snippet,
        status: thread.status,
        isUnread: thread.isUnread,
        provider: accountMap.get(thread.accountId)?.provider,
        lastMessageAt: thread.lastMessageAt,
      }));
    },

    async summarize(input: {
      workspaceId: string;
      userId: string;
      threadId: string;
    }) {
      const { getOrCreateEmailThreadSummary } = await import("./email-summary");
      const result = await getOrCreateEmailThreadSummary({
        workspaceId: input.workspaceId,
        userId: input.userId,
        threadId: input.threadId,
        force: true,
      });
      return {
        summary: result.summary.shortSummary,
        structured: result.summary,
        credits: result.credits,
      };
    },

    async reply(input: {
      workspaceId: string;
      userId: string;
      threadId: string;
      body?: string;
      useSmartReply?: boolean;
    }) {
      const detail = await getInboxThreadDetail({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
      });
      if (!detail) throw new Error("Thread not found");

      const secrets = await getInboxAccountSecrets({
        workspaceId: input.workspaceId,
        accountId: detail.thread.accountId,
      });
      if (!secrets) throw new Error("Inbox account not found");

      let body = input.body?.trim() ?? "";
      if (input.useSmartReply || !body) {
        const stack = createInboxAiStack();
        const customerContext = await buildCustomerContext({
          workspaceId: input.workspaceId,
          threadId: input.threadId,
        });
        const draft = await stack.smartReply.generate({
          subject: detail.thread.subject,
          messages: detail.messages.map((message) => ({
            fromEmail: message.fromEmail,
            fromName: message.fromName,
            bodyText: message.bodyText,
            direction: message.direction,
          })),
          customerContext,
        });
        body = draft.reply;
        await deductWorkspaceCredits({
          workspaceId: input.workspaceId,
          amount: draft.credits,
          reason: "inbox_smart_reply",
          metadata: creditEngine.buildMetadata({
            totalTokens: draft.totalTokens,
            model: "default",
            provider: "gateway",
            conversationId: input.threadId,
          }),
        });
      }

      const lastInbound = [...detail.messages]
        .reverse()
        .find((m) => m.direction === "inbound");
      const toEmails = lastInbound
        ? [{ email: lastInbound.fromEmail, name: lastInbound.fromName }]
        : detail.thread.participants;

      const adapter = getMailProviderAdapter(secrets.provider);
      try {
        await adapter.sendReply({
          account: {
            provider: secrets.provider,
            email: secrets.email,
            displayName: secrets.displayName,
            accessToken: secrets.accessToken,
            refreshToken: secrets.refreshToken,
          },
          threadExternalId: detail.thread.externalId,
          to: toEmails.map((p) => p.email),
          subject: detail.thread.subject.startsWith("Re:")
            ? detail.thread.subject
            : `Re: ${detail.thread.subject}`,
          body,
        });
      } catch {
        // Local/demo accounts without OAuth still persist the reply in-app.
      }

      const message = await createInboxReply({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        accountId: secrets.id,
        fromEmail: secrets.email,
        toEmails,
        subject: detail.thread.subject.startsWith("Re:")
          ? detail.thread.subject
          : `Re: ${detail.thread.subject}`,
        bodyText: body,
      });

      return { messageId: message.id, body };
    },

    async archive(input: { workspaceId: string; threadId: string }) {
      await archiveInboxThread(input);
      return { archived: true as const };
    },

    async createTask(input: {
      workspaceId: string;
      userId: string;
      threadId?: string;
      title: string;
      description?: string | null;
      dueAt?: string | null;
    }) {
      const task = await createInboxTask(input);
      return { id: task.id, title: task.title };
    },

    async scheduleMeeting(input: {
      workspaceId: string;
      userId: string;
      threadId?: string;
      title: string;
      startsAt: string;
      endsAt: string;
      location?: string | null;
    }) {
      const event = await scheduleInboxMeeting(input);
      return {
        id: event.id,
        title: event.title,
        startsAt: event.startsAt,
      };
    },

    async smartReply(input: {
      workspaceId: string;
      userId?: string;
      threadId: string;
      tone?: "professional" | "friendly" | "concise" | "detailed";
    }) {
      if (!input.userId) {
        throw new Error("User context is required for smart reply");
      }
      const { generateSmartReplyDraft } = await import("./smart-reply");
      const result = await generateSmartReplyDraft({
        workspaceId: input.workspaceId,
        userId: input.userId,
        threadId: input.threadId,
        style: input.tone ?? "professional",
      });
      return {
        reply: result.reply,
        tone: result.draft.style,
        draftId: result.draft.id,
        credits: result.credits,
      };
    },

    async detectMeeting(input: { workspaceId: string; threadId: string }) {
      const detail = await getInboxThreadDetail(input);
      if (!detail) throw new Error("Thread not found");
      const meeting = detectMeetingIntent({
        subject: detail.thread.subject,
        bodies: detail.messages.map((m) => m.bodyText),
      });
      await updateThreadSummary({
        workspaceId: input.workspaceId,
        threadId: input.threadId,
        aiSummary: detail.thread.aiSummary,
        meetingDetected: meeting.detected,
        meetingConfidence: meeting.confidence,
      });
      return meeting;
    },
  };
}

export function ensureInboxAiToolsRegistered(): {
  registry: ToolRegistry;
  registered: string[];
} {
  if (!inboxRegistry) {
    inboxRegistry = createToolRegistry(createInboxTools(buildInboxToolDeps()));
  } else {
    registerInboxTools(inboxRegistry, buildInboxToolDeps());
  }
  return {
    registry: inboxRegistry,
    registered: inboxRegistry.list().map((tool) => tool.name),
  };
}

export function createInboxAiStack() {
  const { registry } = ensureInboxAiToolsRegistered();
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
    summarizer: createInboxSummarizer({ gateway }),
    smartReply: createInboxSmartReply({ gateway }),
  };
}

import {
  createGateway,
  createInboxSmartReply,
  creditEngine,
  createGmailDraftMessage,
  sendGmailDraft,
  sendGmailMessage,
  type SmartReplyStyle,
} from "@repo/ai";
import {
  createAiReplyDraft,
  getAiReplyDraft,
  listAiReplyDrafts,
  updateAiReplyDraft,
} from "@repo/database/ai-reply-drafts";
import {
  createInboxReply,
  getInboxThreadDetail,
} from "@repo/database/inbox";
import {
  getInboxAccountSecrets,
} from "@repo/database/gmail";
import { createActivity } from "@repo/database/crm";
import { deductWorkspaceCredits } from "@repo/database/credits";
import type { InboxAiReplyDraft } from "@repo/types";
import { ensureFreshGmailAccess } from "./gmail-sync";

async function buildCustomerContext(input: {
  workspaceId: string;
  threadId: string;
}): Promise<string> {
  const { getContact, getCustomerTimeline, listContacts, contactDisplayName } =
    await import("@repo/database/crm");
  const { getInboxThread } = await import("@repo/database/inbox");

  const thread = await getInboxThread({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!thread) return "";

  let contactId = thread.contactId;
  if (!contactId) {
    const emails = thread.participants.map((p) => p.email.toLowerCase());
    const contacts = await listContacts({ workspaceId: input.workspaceId });
    const match = contacts.find(
      (contact) => contact.email && emails.includes(contact.email.toLowerCase()),
    );
    contactId = match?.id ?? null;
  }
  if (!contactId) return "";

  const contact = await getContact({
    workspaceId: input.workspaceId,
    id: contactId,
  });
  if (!contact) return "";
  const timeline = await getCustomerTimeline({
    workspaceId: input.workspaceId,
    contactId: contact.id,
  });
  return [
    `Contact: ${contactDisplayName(contact)} <${contact.email}>`,
    `Stage: ${contact.lifecycleStage}`,
    `Recent CRM: ${timeline.slice(0, 5).map((item) => item.kind).join(", ")}`,
  ].join("\n");
}

function resolveReplyRecipients(input: {
  detail: NonNullable<Awaited<ReturnType<typeof getInboxThreadDetail>>>;
  accountEmail: string;
  replyAll?: boolean;
}): string[] {
  const accountEmail = input.accountEmail.toLowerCase();
  const lastInbound = [...input.detail.messages]
    .reverse()
    .find((message) => message.direction === "inbound");

  if (input.replyAll) {
    return Array.from(
      new Set([
        ...(lastInbound
          ? [lastInbound.fromEmail, ...lastInbound.toEmails.map((p) => p.email)]
          : input.detail.thread.participants.map((p) => p.email)),
      ]),
    ).filter((email) => email.toLowerCase() !== accountEmail);
  }

  if (lastInbound) return [lastInbound.fromEmail];
  return input.detail.thread.participants
    .map((p) => p.email)
    .filter((email) => email.toLowerCase() !== accountEmail);
}

/**
 * Generate AI reply, create a Gmail draft, and persist local draft history.
 */
export async function generateSmartReplyDraft(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  style: SmartReplyStyle;
}): Promise<{
  draft: InboxAiReplyDraft;
  reply: string;
  credits: number;
}> {
  const detail = await getInboxThreadDetail({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!detail) throw new Error("Thread not found");

  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: detail.thread.accountId,
  });
  if (!account) throw new Error("Inbox account not found");

  const gateway = createGateway();
  const smartReply = createInboxSmartReply({ gateway });
  const customerContext = await buildCustomerContext({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });

  const generated = await smartReply.generate({
    subject: detail.thread.subject,
    messages: detail.messages.map((message) => ({
      fromEmail: message.fromEmail,
      fromName: message.fromName,
      bodyText: message.bodyText,
      direction: message.direction,
    })),
    customerContext,
    tone: input.style,
  });

  if (generated.credits > 0) {
    await deductWorkspaceCredits({
      workspaceId: input.workspaceId,
      amount: generated.credits,
      reason: "inbox_smart_reply",
      metadata: creditEngine.buildMetadata({
        totalTokens: generated.totalTokens,
        model: "default",
        provider: "gateway",
        conversationId: input.threadId,
      }),
    });
  }

  const subject = detail.thread.subject.startsWith("Re:")
    ? detail.thread.subject
    : `Re: ${detail.thread.subject}`;

  let gmailDraftId: string | null = null;
  if (account.provider === "gmail") {
    account = await ensureFreshGmailAccess(account);
    if (!account.accessToken) {
      throw new Error("Gmail not authorized — reconnect the account");
    }
    const to = resolveReplyRecipients({
      detail,
      accountEmail: account.email,
      replyAll: false,
    });
    if (to.length === 0) {
      throw new Error("No recipient found for this reply");
    }
    const remoteDraft = await createGmailDraftMessage({
      accessToken: account.accessToken,
      from: account.email,
      to,
      subject,
      body: generated.reply,
      threadId: detail.thread.externalId,
    });
    gmailDraftId = remoteDraft.id;
  }

  const draft = await createAiReplyDraft({
    workspaceId: input.workspaceId,
    userId: input.userId,
    threadId: input.threadId,
    accountId: account.id,
    style: input.style,
    body: generated.reply,
    subject,
    gmailDraftId,
    creditsUsed: generated.credits,
    metadata: {
      tone: generated.tone,
      totalTokens: generated.totalTokens,
    },
  });

  return {
    draft,
    reply: generated.reply,
    credits: generated.credits,
  };
}

export async function saveSmartReplyDraftEdits(input: {
  workspaceId: string;
  draftId: string;
  body: string;
}): Promise<InboxAiReplyDraft> {
  const existing = await getAiReplyDraft({
    workspaceId: input.workspaceId,
    draftId: input.draftId,
  });
  if (!existing) throw new Error("Draft not found");
  if (existing.status !== "draft") {
    throw new Error("Only open drafts can be edited");
  }
  const bodyChanged = existing.body.trim() !== input.body.trim();
  return updateAiReplyDraft({
    workspaceId: input.workspaceId,
    draftId: input.draftId,
    body: input.body,
    // Invalidate remote draft when body diverges so send uses messages.send.
    gmailDraftId: bodyChanged ? null : existing.gmailDraftId,
  });
}

/**
 * Send the (possibly edited) reply.
 * Prefer Gmail drafts.send when the body still matches the stored draft;
 * otherwise use messages.send with the edited body.
 */
export async function sendSmartReply(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  draftId?: string | null;
  body: string;
  replyAll?: boolean;
}): Promise<{
  messageId: string;
  draft: InboxAiReplyDraft | null;
  usedDraftSend: boolean;
}> {
  const detail = await getInboxThreadDetail({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!detail) throw new Error("Thread not found");

  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: detail.thread.accountId,
  });
  if (!account) throw new Error("Inbox account not found");
  if (account.provider !== "gmail") {
    throw new Error("Smart reply send currently supports Gmail accounts");
  }

  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) {
    throw new Error("Gmail not authorized — reconnect the account");
  }

  let draft: InboxAiReplyDraft | null = null;
  if (input.draftId) {
    draft = await getAiReplyDraft({
      workspaceId: input.workspaceId,
      draftId: input.draftId,
    });
  }

  const subject = detail.thread.subject.startsWith("Re:")
    ? detail.thread.subject
    : `Re: ${detail.thread.subject}`;
  const to = resolveReplyRecipients({
    detail,
    accountEmail: account.email,
    replyAll: input.replyAll,
  });
  if (to.length === 0) {
    throw new Error("No recipient found for this reply");
  }

  const bodyUnchanged =
    draft &&
    draft.status === "draft" &&
    draft.body.trim() === input.body.trim() &&
    Boolean(draft.gmailDraftId);

  let messageId: string;
  let usedDraftSend = false;

  if (bodyUnchanged && draft?.gmailDraftId) {
    // Draft API → Send API (send existing draft).
    const sent = await sendGmailDraft({
      accessToken: account.accessToken,
      draftId: draft.gmailDraftId,
    });
    messageId = sent.id;
    usedDraftSend = true;
  } else {
    // Edited body: send via messages.send.
    const sent = await sendGmailMessage({
      accessToken: account.accessToken,
      from: account.email,
      to,
      subject,
      body: input.body,
      threadId: detail.thread.externalId,
    });
    messageId = sent.id;
  }

  await createInboxReply({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    accountId: account.id,
    fromEmail: account.email,
    toEmails: to.map((email) => ({ email })),
    subject,
    bodyText: input.body,
  });

  if (detail.thread.contactId) {
    await createActivity({
      workspaceId: input.workspaceId,
      userId: input.userId,
      type: "email",
      subject: `Replied: ${subject}`,
      body: input.body.slice(0, 500),
      contactId: detail.thread.contactId,
      companyId: detail.thread.companyId,
    });
  }

  if (draft) {
    draft = await updateAiReplyDraft({
      workspaceId: input.workspaceId,
      draftId: draft.id,
      body: input.body,
      status: "sent",
      gmailMessageId: messageId,
      sentAt: new Date().toISOString(),
    });
  }

  return { messageId, draft, usedDraftSend };
}

export async function listSmartReplyHistory(input: {
  workspaceId: string;
  threadId: string;
}): Promise<InboxAiReplyDraft[]> {
  return listAiReplyDrafts(input);
}

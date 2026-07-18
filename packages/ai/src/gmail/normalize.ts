import {
  extractAttachments,
  extractHtml,
  extractPlainText,
  headerValue,
  mapLabelIdsToStatus,
  parseAddressList,
  type GmailMessage,
  type GmailThread,
} from "./api";

type Participant = { email: string; name?: string | null };
type ThreadStatus = "open" | "archived" | "trashed" | "spam";

export type NormalizedGmailMessage = {
  externalId: string;
  threadExternalId: string;
  direction: "inbound" | "outbound";
  fromEmail: string;
  fromName: string | null;
  toEmails: Participant[];
  ccEmails: Participant[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  sentAt: string;
  isDraft: boolean;
  labelIds: string[];
  attachments: Array<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    externalId: string;
  }>;
};

export type NormalizedGmailThread = {
  externalId: string;
  subject: string;
  snippet: string;
  participants: Participant[];
  status: ThreadStatus;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  lastMessageAt: string;
  labelIds: string[];
  messages: NormalizedGmailMessage[];
};

export function normalizeGmailThread(input: {
  thread: GmailThread;
  accountEmail: string;
}): NormalizedGmailThread {
  const messages = (input.thread.messages ?? []).map((message) =>
    normalizeGmailMessage({
      message,
      accountEmail: input.accountEmail,
      threadExternalId: input.thread.id,
    }),
  );

  const labelIds = Array.from(
    new Set(messages.flatMap((message) => message.labelIds)),
  );
  const flags = mapLabelIdsToStatus(labelIds);
  const last = messages[messages.length - 1];
  const participants = dedupeParticipants(
    messages.flatMap((message) => [
      { email: message.fromEmail, name: message.fromName },
      ...message.toEmails,
      ...message.ccEmails,
    ]),
  );

  return {
    externalId: input.thread.id,
    subject: last?.subject || "(no subject)",
    snippet: last?.bodyText.slice(0, 240) || "",
    participants,
    status: flags.status,
    isUnread: flags.isUnread,
    isStarred: flags.isStarred,
    hasAttachments: messages.some((message) => message.attachments.length > 0),
    lastMessageAt: last?.sentAt ?? new Date().toISOString(),
    labelIds,
    messages,
  };
}

export function normalizeGmailMessage(input: {
  message: GmailMessage;
  accountEmail: string;
  threadExternalId: string;
}): NormalizedGmailMessage {
  const from = parseAddressList(headerValue(input.message, "From"))[0];
  const toEmails = parseAddressList(headerValue(input.message, "To"));
  const ccEmails = parseAddressList(headerValue(input.message, "Cc"));
  const subject = headerValue(input.message, "Subject") ?? "";
  const labelIds = input.message.labelIds ?? [];
  const flags = mapLabelIdsToStatus(labelIds);
  const fromEmail = from?.email ?? "unknown@unknown";
  const account = input.accountEmail.toLowerCase();
  const direction: "inbound" | "outbound" =
    fromEmail.toLowerCase() === account || labelIds.includes("SENT")
      ? "outbound"
      : "inbound";

  const sentAt = input.message.internalDate
    ? new Date(Number(input.message.internalDate)).toISOString()
    : new Date().toISOString();

  return {
    externalId: input.message.id,
    threadExternalId: input.threadExternalId,
    direction,
    fromEmail,
    fromName: from?.name ?? null,
    toEmails,
    ccEmails,
    subject,
    bodyText: extractPlainText(input.message.payload),
    bodyHtml: extractHtml(input.message.payload),
    sentAt,
    isDraft: flags.isDraft,
    labelIds,
    attachments: extractAttachments(input.message.payload),
  };
}

function dedupeParticipants(participants: Participant[]): Participant[] {
  const map = new Map<string, Participant>();
  for (const participant of participants) {
    const key = participant.email.toLowerCase();
    if (!map.has(key)) map.set(key, participant);
  }
  return [...map.values()];
}

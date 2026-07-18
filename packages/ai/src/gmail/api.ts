import { buildRawEmail } from "./mime";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailLabel = {
  id: string;
  name: string;
  type?: string;
};

export type GmailMessagePart = {
  filename?: string;
  mimeType?: string;
  body?: { size?: number; data?: string; attachmentId?: string };
  parts?: GmailMessagePart[];
  headers?: Array<{ name: string; value: string }>;
};

export type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  internalDate?: string;
  payload?: GmailMessagePart;
};

export type GmailThread = {
  id: string;
  historyId?: string;
  messages?: GmailMessage[];
};

export type GmailListThreadsResponse = {
  threads?: Array<{ id: string; historyId?: string; snippet?: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailHistoryResponse = {
  history?: Array<{
    id: string;
    messagesAdded?: Array<{ message: { id: string; threadId: string } }>;
    messagesDeleted?: Array<{ message: { id: string; threadId: string } }>;
    labelsAdded?: Array<{ message: { id: string; threadId: string } }>;
    labelsRemoved?: Array<{ message: { id: string; threadId: string } }>;
  }>;
  historyId?: string;
  nextPageToken?: string;
};

export type GmailProfile = {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
};

export class GmailApiError extends Error {
  readonly status: number;
  readonly path: string;
  readonly responseBody: string;

  constructor(input: { status: number; path: string; responseBody: string }) {
    super(
      `Gmail API ${input.path} failed (${input.status}): ${input.responseBody}`,
    );
    this.name = "GmailApiError";
    this.status = input.status;
    this.path = input.path;
    this.responseBody = input.responseBody;
  }
}

export function isGmailAuthError(error: unknown): boolean {
  if (error instanceof GmailApiError) {
    return error.status === 401 || error.status === 403;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /\bGmail API .* failed \((401|403)\):/.test(message);
}

async function gmailFetch<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${GMAIL_API}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    console.error("[gmail.api] request failed — exact Google response", {
      method: init?.method ?? "GET",
      url,
      status: response.status,
      statusText: response.statusText,
      body: text,
      accessTokenPrefix: accessToken ? `${accessToken.slice(0, 12)}…` : "MISSING",
    });
    throw new GmailApiError({
      status: response.status,
      path,
      responseBody: text,
    });
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getGmailProfile(accessToken: string): Promise<GmailProfile> {
  return gmailFetch(accessToken, "/profile");
}

export async function listGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const data = await gmailFetch<{ labels?: GmailLabel[] }>(
    accessToken,
    "/labels",
  );
  return data.labels ?? [];
}

export async function listGmailThreads(input: {
  accessToken: string;
  query?: string;
  labelIds?: string[];
  pageToken?: string;
  maxResults?: number;
}): Promise<GmailListThreadsResponse> {
  const params = new URLSearchParams({
    maxResults: String(input.maxResults ?? 50),
  });
  if (input.query) params.set("q", input.query);
  if (input.pageToken) params.set("pageToken", input.pageToken);
  for (const labelId of input.labelIds ?? []) {
    params.append("labelIds", labelId);
  }
  return gmailFetch(input.accessToken, `/threads?${params.toString()}`);
}

export async function getGmailThread(input: {
  accessToken: string;
  threadId: string;
  format?: "full" | "metadata" | "minimal";
}): Promise<GmailThread> {
  const params = new URLSearchParams({
    format: input.format ?? "full",
  });
  return gmailFetch(
    input.accessToken,
    `/threads/${input.threadId}?${params.toString()}`,
  );
}

export async function getGmailMessage(input: {
  accessToken: string;
  messageId: string;
  format?: "full" | "metadata" | "minimal" | "raw";
}): Promise<GmailMessage> {
  const params = new URLSearchParams({
    format: input.format ?? "full",
  });
  return gmailFetch(
    input.accessToken,
    `/messages/${input.messageId}?${params.toString()}`,
  );
}

export async function listGmailHistory(input: {
  accessToken: string;
  startHistoryId: string;
  pageToken?: string;
}): Promise<GmailHistoryResponse> {
  const params = new URLSearchParams({
    startHistoryId: input.startHistoryId,
  });
  if (input.pageToken) params.set("pageToken", input.pageToken);
  return gmailFetch(input.accessToken, `/history?${params.toString()}`);
}

export async function modifyGmailThread(input: {
  accessToken: string;
  threadId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<GmailThread> {
  return gmailFetch(input.accessToken, `/threads/${input.threadId}/modify`, {
    method: "POST",
    body: JSON.stringify({
      addLabelIds: input.addLabelIds ?? [],
      removeLabelIds: input.removeLabelIds ?? [],
    }),
  });
}

export async function trashGmailThread(input: {
  accessToken: string;
  threadId: string;
}): Promise<GmailThread> {
  return gmailFetch(input.accessToken, `/threads/${input.threadId}/trash`, {
    method: "POST",
  });
}

export async function sendGmailRaw(input: {
  accessToken: string;
  raw: string;
  threadId?: string | null;
}): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  return gmailFetch(input.accessToken, "/messages/send", {
    method: "POST",
    body: JSON.stringify({
      raw: input.raw,
      threadId: input.threadId ?? undefined,
    }),
  });
}

export async function createGmailDraft(input: {
  accessToken: string;
  raw: string;
  threadId?: string | null;
}): Promise<{ id: string; message: { id: string; threadId: string } }> {
  return gmailFetch(input.accessToken, "/drafts", {
    method: "POST",
    body: JSON.stringify({
      message: {
        raw: input.raw,
        threadId: input.threadId ?? undefined,
      },
    }),
  });
}

/** Send an existing Gmail draft via drafts.send. */
export async function sendGmailDraft(input: {
  accessToken: string;
  draftId: string;
}): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  return gmailFetch(input.accessToken, "/drafts/send", {
    method: "POST",
    body: JSON.stringify({ id: input.draftId }),
  });
}

export async function sendGmailMessage(input: {
  accessToken: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  threadId?: string | null;
  inReplyTo?: string | null;
  references?: string | null;
}): Promise<{ id: string; threadId: string }> {
  const raw = buildRawEmail(input);
  return sendGmailRaw({
    accessToken: input.accessToken,
    raw,
    threadId: input.threadId,
  });
}

export async function createGmailDraftMessage(input: {
  accessToken: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  threadId?: string | null;
}): Promise<{ id: string; messageId: string; threadId: string }> {
  const raw = buildRawEmail(input);
  const draft = await createGmailDraft({
    accessToken: input.accessToken,
    raw,
    threadId: input.threadId,
  });
  return {
    id: draft.id,
    messageId: draft.message.id,
    threadId: draft.message.threadId,
  };
}

export function headerValue(
  message: GmailMessage,
  name: string,
): string | null {
  const headers = message.payload?.headers ?? [];
  const match = headers.find(
    (header) => header.name.toLowerCase() === name.toLowerCase(),
  );
  return match?.value ?? null;
}

export function decodeGmailBodyData(data?: string): string {
  if (!data) return "";
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

export function extractPlainText(part?: GmailMessagePart): string {
  if (!part) return "";
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeGmailBodyData(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const text = extractPlainText(child);
    if (text) return text;
  }
  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decodeGmailBodyData(part.body.data));
  }
  return "";
}

export function extractHtml(part?: GmailMessagePart): string | null {
  if (!part) return null;
  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeGmailBodyData(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const html = extractHtml(child);
    if (html) return html;
  }
  return null;
}

export function extractAttachments(part?: GmailMessagePart): Array<{
  filename: string;
  mimeType: string;
  sizeBytes: number;
  externalId: string;
}> {
  if (!part) return [];
  const results: Array<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    externalId: string;
  }> = [];
  if (part.filename && part.body?.attachmentId) {
    results.push({
      filename: part.filename,
      mimeType: part.mimeType ?? "application/octet-stream",
      sizeBytes: part.body.size ?? 0,
      externalId: part.body.attachmentId,
    });
  }
  for (const child of part.parts ?? []) {
    results.push(...extractAttachments(child));
  }
  return results;
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseAddressList(value: string | null): Array<{
  email: string;
  name?: string | null;
}> {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(?:"?([^"]*)"?\s)?<?([^>]+@[^>]+)>?$/);
      if (!match) {
        return { email: part, name: null };
      }
      return {
        name: match[1]?.trim() || null,
        email: match[2]!.trim(),
      };
    });
}

export function mapLabelIdsToStatus(labelIds: string[] = []): {
  status: "open" | "archived" | "trashed" | "spam";
  isUnread: boolean;
  isStarred: boolean;
  isDraft: boolean;
} {
  const set = new Set(labelIds);
  const isUnread = set.has("UNREAD");
  const isStarred = set.has("STARRED");
  const isDraft = set.has("DRAFT");
  let status: "open" | "archived" | "trashed" | "spam" = "open";
  if (set.has("TRASH")) status = "trashed";
  else if (set.has("SPAM")) status = "spam";
  else if (!set.has("INBOX") && !isDraft) status = "archived";
  return { status, isUnread, isStarred, isDraft };
}

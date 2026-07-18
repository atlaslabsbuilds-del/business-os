import {
  classifyEmailHeuristic,
  createGmailClassifier,
  createGateway,
  createGmailDraftMessage,
  createInboxSummarizer,
  creditEngine,
  detectMeetingIntent,
  getGmailProfile,
  getGmailThread,
  isGmailAuthError,
  listGmailHistory,
  listGmailLabels,
  listGmailThreads,
  modifyGmailThread,
  normalizeGmailThread,
  refreshGmailAccessToken,
  sendGmailMessage,
  trashGmailThread,
  type NormalizedGmailThread,
} from "@repo/ai";
import {
  assignThreadLabelsByExternalIds,
  getGmailSyncProgress,
  getInboxAccountSecrets,
  getInboxAccountSecretsForSync,
  setGmailAccountSyncState,
  updateGmailAccountTokens,
  updateGmailSyncProgress,
  upsertGmailAttachment,
  upsertGmailLabel,
  upsertGmailMessage,
  upsertGmailThread,
} from "@repo/database/gmail";
import {
  archiveInboxThread,
  createInboxReply,
  createInboxTask,
  getInboxThread,
  getInboxThreadDetail,
  linkThreadToContact,
  listInboxCalendarEvents,
  listInboxTasks,
  listInboxThreads,
  markThreadRead,
  scheduleInboxMeeting,
  updateThreadSummary,
} from "@repo/database/inbox";
import {
  contactDisplayName,
  createActivity,
  createLead,
  listContacts,
} from "@repo/database/crm";
import { deductWorkspaceCredits } from "@repo/database/credits";
import type {
  GmailSyncProgress,
  GmailSyncProgressError,
  GmailSyncResult,
  GmailSuggestedAction,
  InboxAccountSecrets,
} from "@repo/types";

const TOKEN_SKEW_MS = 60_000;
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 600;

const FULL_SYNC_QUERIES: Array<{
  query: string;
  phase: GmailSyncProgress["phase"];
}> = [
  { query: "in:inbox", phase: "inbox" },
  { query: "in:sent", phase: "sent" },
  { query: "in:drafts", phase: "drafts" },
  { query: "in:trash", phase: "trash" },
  { query: "in:spam", phase: "spam" },
];

type SyncAccumulator = {
  threadsUpserted: number;
  messagesUpserted: number;
  labelsUpserted: number;
  attachmentsUpserted: number;
  linkedContacts: number;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
  errors: GmailSyncProgressError[];
};

function createSyncAccumulator(): SyncAccumulator {
  return {
    threadsUpserted: 0,
    messagesUpserted: 0,
    labelsUpserted: 0,
    attachmentsUpserted: 0,
    linkedContacts: 0,
    summariesGenerated: 0,
    tasksCreated: 0,
    meetingsScheduled: 0,
    errors: [],
  };
}

function createInitialProgress(input: {
  jobId: string;
  mode: "full" | "incremental";
}): GmailSyncProgress {
  const now = new Date().toISOString();
  return {
    jobId: input.jobId,
    status: "running",
    phase: "starting",
    mode: input.mode,
    startedAt: now,
    updatedAt: now,
    threadsTotal: 0,
    threadsProcessed: 0,
    messagesUpserted: 0,
    labelsUpserted: 0,
    attachmentsUpserted: 0,
    summariesGenerated: 0,
    tasksCreated: 0,
    meetingsScheduled: 0,
    linkedContacts: 0,
    errors: [],
    currentThreadSubject: null,
  };
}

function progressFromAccumulator(
  progress: GmailSyncProgress,
  accumulator: SyncAccumulator,
  patch: Partial<GmailSyncProgress> = {},
): GmailSyncProgress {
  return {
    ...progress,
    ...patch,
    updatedAt: new Date().toISOString(),
    messagesUpserted: accumulator.messagesUpserted,
    labelsUpserted: accumulator.labelsUpserted,
    attachmentsUpserted: accumulator.attachmentsUpserted,
    summariesGenerated: accumulator.summariesGenerated,
    tasksCreated: accumulator.tasksCreated,
    meetingsScheduled: accumulator.meetingsScheduled,
    linkedContacts: accumulator.linkedContacts,
    errors: accumulator.errors,
  };
}

async function publishSyncProgress(input: {
  workspaceId: string;
  accountId: string;
  progress: GmailSyncProgress;
  accumulator: SyncAccumulator;
  patch?: Partial<GmailSyncProgress>;
}): Promise<GmailSyncProgress> {
  const next = progressFromAccumulator(
    input.progress,
    input.accumulator,
    input.patch,
  );
  await updateGmailSyncProgress({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    progress: next,
  });
  return next;
}

function isRetryableGmailError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    /\b(429|500|502|503|504|ECONNRESET|ETIMEDOUT|fetch failed|rate limit)\b/i.test(
      message,
    ) || message.includes("Backend Error")
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? RETRY_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? RETRY_BASE_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableGmailError(error)) {
        break;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      console.warn(`[gmail.sync] retry ${label} attempt ${attempt + 1}`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function buildSyncResult(input: {
  accountId: string;
  mode: "full" | "incremental";
  historyId: string | null;
  accumulator: SyncAccumulator;
  progress: GmailSyncProgress;
}): GmailSyncResult {
  return {
    accountId: input.accountId,
    mode: input.mode,
    threadsUpserted: input.accumulator.threadsUpserted,
    messagesUpserted: input.accumulator.messagesUpserted,
    labelsUpserted: input.accumulator.labelsUpserted,
    attachmentsUpserted: input.accumulator.attachmentsUpserted,
    historyId: input.historyId,
    linkedContacts: input.accumulator.linkedContacts,
    summariesGenerated: input.accumulator.summariesGenerated,
    tasksCreated: input.accumulator.tasksCreated,
    meetingsScheduled: input.accumulator.meetingsScheduled,
    errors: input.accumulator.errors,
    progress: input.progress,
  };
}

type GmailAccessContext = {
  account: InboxAccountSecrets;
  getAccessToken: () => Promise<string>;
  callWithFreshToken: <T>(label: string, fn: (accessToken: string) => Promise<T>) => Promise<T>;
};

async function persistRefreshedTokens(
  account: InboxAccountSecrets,
  tokens: Awaited<ReturnType<typeof refreshGmailAccessToken>>,
): Promise<InboxAccountSecrets> {
  await updateGmailAccountTokens({
    workspaceId: account.workspaceId,
    accountId: account.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    tokenExpiresAt: tokens.expiresAt,
    scopes: tokens.scopes.length ? tokens.scopes : account.scopes,
  });

  return {
    ...account,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? account.refreshToken,
    tokenExpiresAt: tokens.expiresAt,
    scopes: tokens.scopes.length ? tokens.scopes : account.scopes,
  };
}

export async function ensureFreshGmailAccess(
  account: InboxAccountSecrets,
  options: { force?: boolean } = {},
): Promise<InboxAccountSecrets> {
  if (!account.refreshToken && !account.accessToken) {
    throw new Error("Gmail account has no OAuth tokens");
  }

  const expiresAt = account.tokenExpiresAt
    ? Date.parse(account.tokenExpiresAt)
    : 0;
  const needsRefresh =
    options.force ||
    !account.accessToken ||
    !expiresAt ||
    expiresAt - Date.now() < TOKEN_SKEW_MS;

  if (!needsRefresh) {
    return account;
  }

  if (!account.refreshToken) {
    console.warn("[gmail.tokens] access token stale but no refresh token", {
      accountId: account.id,
      email: account.email,
      tokenExpiresAt: account.tokenExpiresAt,
    });
    if (!account.accessToken) {
      throw new Error(
        "Gmail access token expired and no refresh token is stored — reconnect Gmail",
      );
    }
    return account;
  }

  console.info("[gmail.tokens] refreshing access token", {
    accountId: account.id,
    email: account.email,
    force: Boolean(options.force),
    previousExpiresAt: account.tokenExpiresAt,
    scopes: account.scopes,
  });

  const tokens = await refreshGmailAccessToken({
    refreshToken: account.refreshToken,
  });
  return persistRefreshedTokens(account, tokens);
}

function createGmailAccessContext(
  initialAccount: InboxAccountSecrets,
): GmailAccessContext {
  let account = initialAccount;

  async function refresh(force = false): Promise<string> {
    account = await ensureFreshGmailAccess(account, { force });
    if (!account.accessToken) {
      throw new Error("Missing Gmail access token after refresh");
    }
    return account.accessToken;
  }

  return {
    get account() {
      return account;
    },
    getAccessToken: () => refresh(false),
    async callWithFreshToken<T>(
      label: string,
      fn: (accessToken: string) => Promise<T>,
    ): Promise<T> {
      try {
        return await fn(await refresh(false));
      } catch (error) {
        if (!isGmailAuthError(error) || !account.refreshToken) {
          throw error;
        }
        console.warn("[gmail.sync] auth error — forcing token refresh", {
          label,
          accountId: account.id,
          error: error instanceof Error ? error.message : String(error),
        });
        return fn(await refresh(true));
      }
    },
  };
}

async function autoLinkThreadToCrm(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  participants: Array<{ email: string; name?: string | null }>;
  accountEmail: string;
  subject: string;
  snippet: string;
}): Promise<boolean> {
  const accountEmail = input.accountEmail.toLowerCase();
  const external = input.participants.find(
    (participant) => participant.email.toLowerCase() !== accountEmail,
  );
  if (!external) return false;

  const contacts = await listContacts({ workspaceId: input.workspaceId });
  let contact = contacts.find(
    (item) =>
      item.email && item.email.toLowerCase() === external.email.toLowerCase(),
  );

  if (!contact) {
    const nameParts = (external.name ?? external.email.split("@")[0] ?? "Lead")
      .trim()
      .split(/\s+/);
    contact = await createLead({
      workspaceId: input.workspaceId,
      userId: input.userId,
      firstName: nameParts[0] || "Lead",
      lastName: nameParts.slice(1).join(" ") || undefined,
      email: external.email,
      source: "gmail",
    });
  }

  await linkThreadToContact({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    contactId: contact.id,
    companyId: contact.companyId,
  });

  await createActivity({
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: "email",
    subject: `Email: ${input.subject}`,
    body: input.snippet,
    contactId: contact.id,
    companyId: contact.companyId,
  });

  return true;
}

async function enrichSyncedThreadWithAi(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  subject: string;
  messages: NormalizedGmailThread["messages"];
  suggestedActions?: GmailSuggestedAction[];
  priority?: string | null;
}): Promise<{
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
}> {
  let summariesGenerated = 0;
  let tasksCreated = 0;
  let meetingsScheduled = 0;

  const gateway = createGateway();
  const summarizer = createInboxSummarizer({ gateway });
  const summaryResult = await summarizer.summarizeThread({
    subject: input.subject,
    messages: input.messages.map((message) => ({
      fromEmail: message.fromEmail,
      fromName: message.fromName,
      bodyText: message.bodyText,
      sentAt: message.sentAt,
      direction: message.direction,
    })),
  });

  const meeting = detectMeetingIntent({
    subject: input.subject,
    bodies: input.messages.map((message) => message.bodyText),
  });

  await updateThreadSummary({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    aiSummary: summaryResult.summary,
    meetingDetected: meeting.detected,
    meetingConfidence: meeting.confidence,
  });

  if (summaryResult.credits > 0) {
    await deductWorkspaceCredits({
      workspaceId: input.workspaceId,
      amount: summaryResult.credits,
      reason: "gmail_sync_summarize",
      metadata: creditEngine.buildMetadata({
        totalTokens: summaryResult.totalTokens,
        model: "default",
        provider: "gateway",
        conversationId: input.threadId,
      }),
    });
  }
  summariesGenerated = 1;

  const openTasks = await listInboxTasks({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    status: "open",
  });
  const taskAction = input.suggestedActions?.find(
    (action) => action.type === "create_task" || action.type === "follow_up",
  );
  const shouldCreateTask =
    openTasks.length === 0 &&
    (taskAction?.confidence ?? 0) >= 0.6 &&
    (input.priority === "urgent" ||
      input.priority === "high" ||
      taskAction?.type === "create_task");

  if (shouldCreateTask) {
    await createInboxTask({
      workspaceId: input.workspaceId,
      userId: input.userId,
      threadId: input.threadId,
      title: (taskAction?.label ?? `Follow up: ${input.subject}`).slice(0, 160),
      description: summaryResult.summary.slice(0, 800),
    });
    tasksCreated = 1;
  }

  const upcomingEvents = await listInboxCalendarEvents({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    upcomingOnly: true,
  });
  const scheduleAction = input.suggestedActions?.find(
    (action) => action.type === "schedule_meeting",
  );
  const shouldScheduleMeeting =
    upcomingEvents.length === 0 &&
    meeting.detected &&
    meeting.confidence >= 0.45 &&
    ((scheduleAction?.confidence ?? 0) >= 0.55 ||
      meeting.confidence >= 0.55);

  if (
    shouldScheduleMeeting &&
    meeting.suggestedStartsAt &&
    meeting.suggestedEndsAt
  ) {
    await scheduleInboxMeeting({
      workspaceId: input.workspaceId,
      userId: input.userId,
      threadId: input.threadId,
      title: (meeting.suggestedTitle ?? `Meeting: ${input.subject}`).slice(
        0,
        160,
      ),
      startsAt: meeting.suggestedStartsAt,
      endsAt: meeting.suggestedEndsAt,
      location: meeting.location ?? null,
      provider: "gmail",
    });
    meetingsScheduled = 1;
  }

  return { summariesGenerated, tasksCreated, meetingsScheduled };
}

async function persistNormalizedThread(input: {
  workspaceId: string;
  userId: string;
  account: InboxAccountSecrets;
  normalized: NormalizedGmailThread;
  classify?: boolean;
  enrichAi?: boolean;
}): Promise<{
  threadId: string;
  messagesUpserted: number;
  attachmentsUpserted: number;
  linked: boolean;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
}> {
  const classification = input.classify
    ? classifyEmailHeuristic({
        subject: input.normalized.subject,
        body: input.normalized.messages.map((m) => m.bodyText).join("\n"),
        fromEmail:
          input.normalized.messages.find((m) => m.direction === "inbound")
            ?.fromEmail ?? input.account.email,
      })
    : null;

  const thread = await upsertGmailThread({
    workspaceId: input.workspaceId,
    accountId: input.account.id,
    externalId: input.normalized.externalId,
    subject: input.normalized.subject,
    snippet: input.normalized.snippet,
    participants: input.normalized.participants,
    status: input.normalized.status,
    isUnread: input.normalized.isUnread,
    isStarred: input.normalized.isStarred,
    messageCount: input.normalized.messages.length,
    hasAttachments: input.normalized.hasAttachments,
    lastMessageAt: input.normalized.lastMessageAt,
    aiPriority: classification?.priority ?? undefined,
    aiClassification: classification?.classification ?? undefined,
    aiSuggestedActions: classification?.suggestedActions,
  });

  let messagesUpserted = 0;
  let attachmentsUpserted = 0;
  for (const message of input.normalized.messages) {
    const saved = await upsertGmailMessage({
      workspaceId: input.workspaceId,
      accountId: input.account.id,
      threadId: thread.id,
      externalId: message.externalId,
      direction: message.direction,
      fromEmail: message.fromEmail,
      fromName: message.fromName,
      toEmails: message.toEmails,
      ccEmails: message.ccEmails,
      subject: message.subject,
      bodyText: message.bodyText,
      bodyHtml: message.bodyHtml,
      sentAt: message.sentAt,
      isDraft: message.isDraft,
    });
    messagesUpserted += 1;
    for (const attachment of message.attachments) {
      await upsertGmailAttachment({
        workspaceId: input.workspaceId,
        messageId: saved.id,
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
        externalId: attachment.externalId,
      });
      attachmentsUpserted += 1;
    }
  }

  await assignThreadLabelsByExternalIds({
    workspaceId: input.workspaceId,
    threadId: thread.id,
    accountId: input.account.id,
    labelExternalIds: input.normalized.labelIds,
  });

  let linked = false;
  if (!thread.contactId) {
    linked = await autoLinkThreadToCrm({
      workspaceId: input.workspaceId,
      userId: input.userId,
      threadId: thread.id,
      participants: input.normalized.participants,
      accountEmail: input.account.email,
      subject: input.normalized.subject,
      snippet: input.normalized.snippet,
    });
  }

  return {
    threadId: thread.id,
    messagesUpserted,
    attachmentsUpserted,
    linked,
    summariesGenerated: 0,
    tasksCreated: 0,
    meetingsScheduled: 0,
    ...(input.enrichAi
      ? await enrichSyncedThreadWithAi({
          workspaceId: input.workspaceId,
          userId: input.userId,
          threadId: thread.id,
          subject: input.normalized.subject,
          messages: input.normalized.messages,
          suggestedActions: classification?.suggestedActions,
          priority: classification?.priority ?? thread.aiPriority,
        }).catch((error) => {
          console.warn("[gmail.sync] AI enrichment skipped", {
            threadId: thread.id,
            error: error instanceof Error ? error.message : String(error),
          });
          return {
            summariesGenerated: 0,
            tasksCreated: 0,
            meetingsScheduled: 0,
          };
        })
      : {}),
  };
}

async function syncLabels(input: {
  workspaceId: string;
  access: GmailAccessContext;
}): Promise<number> {
  const labels = await input.access.callWithFreshToken("listGmailLabels", (accessToken) =>
    listGmailLabels(accessToken),
  );
  let count = 0;
  for (const label of labels) {
    await upsertGmailLabel({
      workspaceId: input.workspaceId,
      accountId: input.access.account.id,
      externalId: label.id,
      name: label.name,
    });
    count += 1;
  }
  return count;
}

async function syncThreadByExternalId(input: {
  workspaceId: string;
  userId: string;
  access: GmailAccessContext;
  threadExternalId: string;
  enrichAi?: boolean;
}): Promise<{
  messagesUpserted: number;
  attachmentsUpserted: number;
  linked: boolean;
  summariesGenerated: number;
  tasksCreated: number;
  meetingsScheduled: number;
  subject: string;
} | null> {
  const full = await input.access.callWithFreshToken(
    `getGmailThread:${input.threadExternalId}`,
    (accessToken) =>
      getGmailThread({
        accessToken,
        threadId: input.threadExternalId,
      }),
  );
  const normalized = normalizeGmailThread({
    thread: full,
    accountEmail: input.access.account.email,
  });
  const persisted = await persistNormalizedThread({
    workspaceId: input.workspaceId,
    userId: input.userId,
    account: input.access.account,
    normalized,
    classify: true,
    enrichAi: input.enrichAi ?? true,
  });
  return {
    messagesUpserted: persisted.messagesUpserted,
    attachmentsUpserted: persisted.attachmentsUpserted,
    linked: persisted.linked,
    summariesGenerated: persisted.summariesGenerated,
    tasksCreated: persisted.tasksCreated,
    meetingsScheduled: persisted.meetingsScheduled,
    subject: normalized.subject,
  };
}

async function processSyncedThread(input: {
  workspaceId: string;
  userId: string;
  access: GmailAccessContext;
  threadExternalId: string;
  accumulator: SyncAccumulator;
  progress: GmailSyncProgress;
  enrichAi?: boolean;
}): Promise<GmailSyncProgress> {
  let retries = 0;
  while (retries < RETRY_MAX_ATTEMPTS) {
    try {
      const result = await syncThreadByExternalId({
        workspaceId: input.workspaceId,
        userId: input.userId,
        access: input.access,
        threadExternalId: input.threadExternalId,
        enrichAi: input.enrichAi,
      });
      if (result) {
        input.accumulator.threadsUpserted += 1;
        input.accumulator.messagesUpserted += result.messagesUpserted;
        input.accumulator.attachmentsUpserted += result.attachmentsUpserted;
        input.accumulator.summariesGenerated += result.summariesGenerated;
        input.accumulator.tasksCreated += result.tasksCreated;
        input.accumulator.meetingsScheduled += result.meetingsScheduled;
        if (result.linked) input.accumulator.linkedContacts += 1;
      }
      input.progress.threadsProcessed += 1;
      return publishSyncProgress({
        workspaceId: input.workspaceId,
        accountId: input.access.account.id,
        progress: input.progress,
        accumulator: input.accumulator,
        patch: {
          phase: "ai",
          currentThreadSubject: result?.subject ?? null,
        },
      });
    } catch (error) {
      retries += 1;
      if (retries >= RETRY_MAX_ATTEMPTS || !isRetryableGmailError(error)) {
        input.accumulator.errors.push({
          threadExternalId: input.threadExternalId,
          message: error instanceof Error ? error.message : String(error),
          retries,
          at: new Date().toISOString(),
        });
        input.progress.threadsProcessed += 1;
        return publishSyncProgress({
          workspaceId: input.workspaceId,
          accountId: input.access.account.id,
          progress: input.progress,
          accumulator: input.accumulator,
          patch: { phase: "threads" },
        });
      }
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_BASE_DELAY_MS * 2 ** (retries - 1)),
      );
    }
  }
  return input.progress;
}

async function fullSync(input: {
  workspaceId: string;
  userId: string;
  access: GmailAccessContext;
  jobId: string;
}): Promise<GmailSyncResult> {
  const account = input.access.account;
  const accumulator = createSyncAccumulator();
  let progress = createInitialProgress({
    jobId: input.jobId,
    mode: "full",
  });
  progress = await publishSyncProgress({
    workspaceId: input.workspaceId,
    accountId: account.id,
    progress,
    accumulator,
    patch: { phase: "labels" },
  });

  accumulator.labelsUpserted = await syncLabels({
    workspaceId: input.workspaceId,
    access: input.access,
  });
  progress = await publishSyncProgress({
    workspaceId: input.workspaceId,
    accountId: account.id,
    progress,
    accumulator,
    patch: { phase: "inbox" },
  });

  const seen = new Set<string>();
  const threadQueue: string[] = [];

  for (const { query, phase } of FULL_SYNC_QUERIES) {
    progress = await publishSyncProgress({
      workspaceId: input.workspaceId,
      accountId: account.id,
      progress,
      accumulator,
      patch: { phase },
    });

    let pageToken: string | undefined;
    do {
      const page = await withRetry(`listGmailThreads:${query}`, () =>
        input.access.callWithFreshToken(`listGmailThreads:${query}`, (accessToken) =>
          listGmailThreads({
            accessToken,
            query,
            maxResults: 40,
            pageToken,
          }),
        ),
      );
      for (const item of page.threads ?? []) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);
        threadQueue.push(item.id);
      }
      progress.threadsTotal = threadQueue.length;
      progress = await publishSyncProgress({
        workspaceId: input.workspaceId,
        accountId: account.id,
        progress,
        accumulator,
        patch: { threadsTotal: threadQueue.length },
      });
      pageToken = page.nextPageToken;
    } while (pageToken);
  }

  progress = await publishSyncProgress({
    workspaceId: input.workspaceId,
    accountId: account.id,
    progress,
    accumulator,
    patch: { phase: "threads", threadsTotal: threadQueue.length },
  });

  for (const threadExternalId of threadQueue) {
    progress = await processSyncedThread({
      workspaceId: input.workspaceId,
      userId: input.userId,
      access: input.access,
      threadExternalId,
      accumulator,
      progress,
    });
  }

  progress = await publishSyncProgress({
    workspaceId: input.workspaceId,
    accountId: account.id,
    progress,
    accumulator,
    patch: { phase: "finalizing" },
  });

  const profile = await input.access.callWithFreshToken("getGmailProfile", (accessToken) =>
    getGmailProfile(accessToken),
  );

  progress = await publishSyncProgress({
    workspaceId: input.workspaceId,
    accountId: account.id,
    progress,
    accumulator,
    patch: {
      phase: "done",
      status: "completed",
      completedAt: new Date().toISOString(),
      historyId: profile.historyId,
      currentThreadSubject: null,
    },
  });

  await setGmailAccountSyncState({
    workspaceId: input.workspaceId,
    accountId: account.id,
    status: "connected",
    historyId: profile.historyId,
    syncError: accumulator.errors.length
      ? `${accumulator.errors.length} thread(s) failed during sync`
      : null,
    lastSyncedAt: new Date().toISOString(),
  });

  return buildSyncResult({
    accountId: account.id,
    mode: "full",
    historyId: profile.historyId,
    accumulator,
    progress,
  });
}

async function incrementalSync(input: {
  workspaceId: string;
  userId: string;
  access: GmailAccessContext;
  jobId: string;
}): Promise<GmailSyncResult> {
  const account = input.access.account;
  if (!account.historyId) {
    return fullSync(input);
  }

  const accumulator = createSyncAccumulator();
  let progress = createInitialProgress({
    jobId: input.jobId,
    mode: "incremental",
  });

  try {
    progress = await publishSyncProgress({
      workspaceId: input.workspaceId,
      accountId: account.id,
      progress,
      accumulator,
      patch: { phase: "labels" },
    });

    accumulator.labelsUpserted = await syncLabels({
      workspaceId: input.workspaceId,
      access: input.access,
    });

    progress = await publishSyncProgress({
      workspaceId: input.workspaceId,
      accountId: account.id,
      progress,
      accumulator,
      patch: { phase: "history" },
    });

    const threadIds = new Set<string>();
    let pageToken: string | undefined;
    let latestHistoryId = account.historyId;

    do {
      const history = await input.access.callWithFreshToken(
        "listGmailHistory",
        (accessToken) =>
          listGmailHistory({
            accessToken,
            startHistoryId: account.historyId!,
            pageToken,
          }),
      );
      for (const entry of history.history ?? []) {
        for (const added of entry.messagesAdded ?? []) {
          threadIds.add(added.message.threadId);
        }
        for (const labeled of entry.labelsAdded ?? []) {
          threadIds.add(labeled.message.threadId);
        }
        for (const labeled of entry.labelsRemoved ?? []) {
          threadIds.add(labeled.message.threadId);
        }
      }
      if (history.historyId) latestHistoryId = history.historyId;
      pageToken = history.nextPageToken;
    } while (pageToken);

    progress = await publishSyncProgress({
      workspaceId: input.workspaceId,
      accountId: account.id,
      progress,
      accumulator,
      patch: {
        phase: "threads",
        threadsTotal: threadIds.size,
      },
    });

    for (const threadExternalId of threadIds) {
      progress = await processSyncedThread({
        workspaceId: input.workspaceId,
        userId: input.userId,
        access: input.access,
        threadExternalId,
        accumulator,
        progress,
      });
    }

    progress = await publishSyncProgress({
      workspaceId: input.workspaceId,
      accountId: account.id,
      progress,
      accumulator,
      patch: {
        phase: "done",
        status: "completed",
        completedAt: new Date().toISOString(),
        historyId: latestHistoryId,
        currentThreadSubject: null,
      },
    });

    await setGmailAccountSyncState({
      workspaceId: input.workspaceId,
      accountId: account.id,
      status: "connected",
      historyId: latestHistoryId,
      syncError: accumulator.errors.length
        ? `${accumulator.errors.length} thread(s) failed during sync`
        : null,
      lastSyncedAt: new Date().toISOString(),
    });

    return buildSyncResult({
      accountId: account.id,
      mode: "incremental",
      historyId: latestHistoryId,
      accumulator,
      progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("404") || message.includes("historyId")) {
      return fullSync(input);
    }
    throw error;
  }
}

export async function readGmailSyncProgress(input: {
  workspaceId: string;
  accountId: string;
}): Promise<GmailSyncProgress | null> {
  return getGmailSyncProgress(input);
}

export async function startGmailSyncInBackground(input: {
  workspaceId: string;
  userId: string;
  accountId: string;
  full?: boolean;
}): Promise<{ jobId: string; accountId: string }> {
  const jobId = crypto.randomUUID();
  const progress = createInitialProgress({
    jobId,
    mode: input.full ? "full" : "incremental",
  });
  await updateGmailSyncProgress({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
    progress,
  });

  void syncGmailAccount({
    workspaceId: input.workspaceId,
    userId: input.userId,
    accountId: input.accountId,
    full: input.full,
    jobId,
  }).catch(async (error) => {
    const message = error instanceof Error ? error.message : "Gmail sync failed";
    await setGmailAccountSyncState({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
      status: "error",
      syncError: message,
    });
    const failed = await getGmailSyncProgress({
      workspaceId: input.workspaceId,
      accountId: input.accountId,
    });
    if (failed) {
      await updateGmailSyncProgress({
        workspaceId: input.workspaceId,
        accountId: input.accountId,
        progress: {
          ...failed,
          status: "error",
          phase: "done",
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          errors: [
            ...failed.errors,
            {
              message,
              retries: RETRY_MAX_ATTEMPTS,
              at: new Date().toISOString(),
            },
          ],
        },
      });
    }
  });

  return { jobId, accountId: input.accountId };
}

export async function syncGmailAccount(input: {
  workspaceId: string;
  userId: string;
  accountId: string;
  full?: boolean;
  jobId?: string;
}): Promise<GmailSyncResult> {
  let account = await getInboxAccountSecretsForSync({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
  });
  if (!account || account.provider !== "gmail") {
    throw new Error("Gmail account not found");
  }
  if (account.status === "disconnected") {
    throw new Error("Gmail account is disconnected");
  }

  account = await ensureFreshGmailAccess(account);
  const access = createGmailAccessContext(account);
  const jobId = input.jobId ?? crypto.randomUUID();

  await setGmailAccountSyncState({
    workspaceId: input.workspaceId,
    accountId: access.account.id,
    status: "syncing",
    syncError: null,
  });

  try {
    if (input.full || !access.account.historyId) {
      return await fullSync({
        workspaceId: input.workspaceId,
        userId: input.userId,
        access,
        jobId,
      });
    }
    return await incrementalSync({
      workspaceId: input.workspaceId,
      userId: input.userId,
      access,
      jobId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gmail sync failed";
    await setGmailAccountSyncState({
      workspaceId: input.workspaceId,
      accountId: access.account.id,
      status: "error",
      syncError: message,
    });
    const existing = await getGmailSyncProgress({
      workspaceId: input.workspaceId,
      accountId: access.account.id,
    });
    if (existing) {
      await updateGmailSyncProgress({
        workspaceId: input.workspaceId,
        accountId: access.account.id,
        progress: {
          ...existing,
          status: "error",
          phase: "done",
          updatedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          errors: [
            ...existing.errors,
            {
              message,
              retries: RETRY_MAX_ATTEMPTS,
              at: new Date().toISOString(),
            },
          ],
        },
      });
    }
    throw error;
  }
}

export async function syncAllGmailAccounts(input: {
  workspaceId: string;
  userId: string;
  full?: boolean;
}): Promise<GmailSyncResult[]> {
  const { listGmailAccountSecrets } = await import("@repo/database/gmail");
  const accounts = await listGmailAccountSecrets({
    workspaceId: input.workspaceId,
  });
  const results: GmailSyncResult[] = [];
  for (const account of accounts) {
    results.push(
      await syncGmailAccount({
        workspaceId: input.workspaceId,
        userId: input.userId,
        accountId: account.id,
        full: input.full,
      }),
    );
  }
  return results;
}

export async function gmailSend(input: {
  workspaceId: string;
  userId: string;
  accountId: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  threadId?: string | null;
}): Promise<{ messageId: string; threadId: string }> {
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
  });
  if (!account) throw new Error("Gmail account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  let threadExternalId: string | null = null;
  if (input.threadId) {
    const thread = await getInboxThread({
      workspaceId: input.workspaceId,
      threadId: input.threadId,
    });
    threadExternalId = thread?.externalId ?? null;
  }

  const sent = await sendGmailMessage({
    accessToken: account.accessToken,
    from: account.email,
    to: input.to,
    cc: input.cc,
    subject: input.subject,
    body: input.body,
    threadId: threadExternalId,
  });

  if (input.threadId) {
    await createInboxReply({
      workspaceId: input.workspaceId,
      threadId: input.threadId,
      accountId: account.id,
      fromEmail: account.email,
      toEmails: input.to.map((email) => ({ email })),
      subject: input.subject,
      bodyText: input.body,
    });
  } else {
    const access = createGmailAccessContext(account);
    await syncThreadByExternalId({
      workspaceId: input.workspaceId,
      userId: input.userId,
      access,
      threadExternalId: sent.threadId,
    });
  }

  return { messageId: sent.id, threadId: sent.threadId };
}

export async function gmailReply(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  body: string;
  replyAll?: boolean;
}): Promise<{ messageId: string; body: string }> {
  const detail = await getInboxThreadDetail({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!detail) throw new Error("Thread not found");

  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: detail.thread.accountId,
  });
  if (!account) throw new Error("Gmail account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken || !detail.thread.externalId) {
    throw new Error("Gmail thread is not linked to a remote message");
  }

  const lastInbound = [...detail.messages]
    .reverse()
    .find((message) => message.direction === "inbound");
  const to = input.replyAll
    ? Array.from(
        new Set([
          ...(lastInbound
            ? [lastInbound.fromEmail, ...lastInbound.toEmails.map((p) => p.email)]
            : detail.thread.participants.map((p) => p.email)),
        ]),
      ).filter((email) => email.toLowerCase() !== account!.email.toLowerCase())
    : lastInbound
      ? [lastInbound.fromEmail]
      : detail.thread.participants
          .map((p) => p.email)
          .filter((email) => email.toLowerCase() !== account!.email.toLowerCase());

  const subject = detail.thread.subject.startsWith("Re:")
    ? detail.thread.subject
    : `Re: ${detail.thread.subject}`;

  const sent = await sendGmailMessage({
    accessToken: account.accessToken,
    from: account.email,
    to,
    subject,
    body: input.body,
    threadId: detail.thread.externalId,
  });

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

  return { messageId: sent.id, body: input.body };
}

export async function gmailArchive(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
}): Promise<{ archived: true }> {
  const thread = await getInboxThread(input);
  if (!thread?.externalId) throw new Error("Thread not found");
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: thread.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  await modifyGmailThread({
    accessToken: account.accessToken,
    threadId: thread.externalId,
    removeLabelIds: ["INBOX"],
  });
  await archiveInboxThread(input);
  return { archived: true };
}

export async function gmailDelete(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
}): Promise<{ deleted: true }> {
  const thread = await getInboxThread(input);
  if (!thread?.externalId) throw new Error("Thread not found");
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: thread.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  await trashGmailThread({
    accessToken: account.accessToken,
    threadId: thread.externalId,
  });
  const { createServerClient } = await import("@repo/database/server");
  const supabase = await createServerClient();
  await supabase
    .from("inbox_threads")
    .update({ status: "trashed" })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId);
  return { deleted: true };
}

export async function gmailStar(input: {
  workspaceId: string;
  threadId: string;
  starred: boolean;
}): Promise<void> {
  const thread = await getInboxThread(input);
  if (!thread?.externalId) throw new Error("Thread not found");
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: thread.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  await modifyGmailThread({
    accessToken: account.accessToken,
    threadId: thread.externalId,
    addLabelIds: input.starred ? ["STARRED"] : [],
    removeLabelIds: input.starred ? [] : ["STARRED"],
  });
  const { createServerClient } = await import("@repo/database/server");
  const supabase = await createServerClient();
  await supabase
    .from("inbox_threads")
    .update({ is_starred: input.starred })
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.threadId);
}

export async function gmailSetReadState(input: {
  workspaceId: string;
  threadId: string;
  unread: boolean;
}): Promise<void> {
  const thread = await getInboxThread(input);
  if (!thread?.externalId) throw new Error("Thread not found");
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: thread.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  await modifyGmailThread({
    accessToken: account.accessToken,
    threadId: thread.externalId,
    addLabelIds: input.unread ? ["UNREAD"] : [],
    removeLabelIds: input.unread ? [] : ["UNREAD"],
  });
  await markThreadRead({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    isUnread: input.unread,
  });
}

export async function gmailMoveLabels(input: {
  workspaceId: string;
  threadId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}): Promise<void> {
  const thread = await getInboxThread(input);
  if (!thread?.externalId) throw new Error("Thread not found");
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: thread.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  await modifyGmailThread({
    accessToken: account.accessToken,
    threadId: thread.externalId,
    addLabelIds: input.addLabelIds,
    removeLabelIds: input.removeLabelIds,
  });
  await assignThreadLabelsByExternalIds({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    accountId: account.id,
    labelExternalIds: [
      ...(input.addLabelIds ?? []),
    ],
  });
}

export async function gmailCreateDraft(input: {
  workspaceId: string;
  userId: string;
  accountId: string;
  to: string[];
  subject: string;
  body: string;
  threadId?: string | null;
}): Promise<{ draftId: string }> {
  let account = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: input.accountId,
  });
  if (!account) throw new Error("Account not found");
  account = await ensureFreshGmailAccess(account);
  if (!account.accessToken) throw new Error("Gmail not authorized");

  let threadExternalId: string | null = null;
  if (input.threadId) {
    const thread = await getInboxThread({
      workspaceId: input.workspaceId,
      threadId: input.threadId,
    });
    threadExternalId = thread?.externalId ?? null;
  }

  const draft = await createGmailDraftMessage({
    accessToken: account.accessToken,
    from: account.email,
    to: input.to,
    subject: input.subject,
    body: input.body,
    threadId: threadExternalId,
  });
  return { draftId: draft.id };
}

export async function gmailSearch(input: {
  workspaceId: string;
  accountId?: string;
  query: string;
  limit?: number;
}): Promise<{ threads: Array<{ id: string; subject: string; snippet: string }> }> {
  const threads = await listInboxThreads({
    workspaceId: input.workspaceId,
    query: input.query,
    accountId: input.accountId,
  });
  return {
    threads: threads.slice(0, input.limit ?? 25).map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      snippet: thread.snippet,
    })),
  };
}

export async function gmailForward(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  to: string[];
  body?: string;
}): Promise<{ messageId: string }> {
  const detail = await getInboxThreadDetail(input);
  if (!detail) throw new Error("Thread not found");
  const transcript = detail.messages
    .map(
      (message) =>
        `---------- Forwarded message ----------\nFrom: ${message.fromEmail}\nDate: ${message.sentAt}\nSubject: ${message.subject}\n\n${message.bodyText}`,
    )
    .join("\n\n");
  const body = `${input.body?.trim() ? `${input.body.trim()}\n\n` : ""}${transcript}`;
  const sent = await gmailSend({
    workspaceId: input.workspaceId,
    userId: input.userId,
    accountId: detail.thread.accountId,
    to: input.to,
    subject: detail.thread.subject.startsWith("Fwd:")
      ? detail.thread.subject
      : `Fwd: ${detail.thread.subject}`,
    body,
  });
  return { messageId: sent.messageId };
}

export async function classifyGmailThreadWithAi(input: {
  workspaceId: string;
  threadId: string;
}): Promise<{
  priority: string;
  classification: string;
  suggestedActions: Array<{ type: string; label: string; confidence: number }>;
}> {
  const detail = await getInboxThreadDetail(input);
  if (!detail) throw new Error("Thread not found");
  const gateway = createGateway();
  const classifier = createGmailClassifier({ gateway });
  const fromEmail =
    detail.messages.find((m) => m.direction === "inbound")?.fromEmail ??
    detail.thread.participants[0]?.email ??
    "unknown";
  const result = await classifier.classify({
    subject: detail.thread.subject,
    body: detail.messages.map((m) => m.bodyText).join("\n\n"),
    fromEmail,
  });

  const { updateThreadAiClassification } = await import("@repo/database/gmail");
  await updateThreadAiClassification({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    aiPriority: result.priority,
    aiClassification: result.classification,
    aiSuggestedActions: result.suggestedActions,
  });

  if (result.credits > 0) {
    await deductWorkspaceCredits({
      workspaceId: input.workspaceId,
      amount: result.credits,
      reason: "gmail_classify",
      metadata: creditEngine.buildMetadata({
        totalTokens: result.totalTokens,
        model: "default",
        provider: "gateway",
        conversationId: input.threadId,
      }),
    });
  }

  return result;
}

export async function createLeadFromGmailThread(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
}) {
  const detail = await getInboxThreadDetail(input);
  if (!detail) throw new Error("Thread not found");
  const accounts = await getInboxAccountSecrets({
    workspaceId: input.workspaceId,
    accountId: detail.thread.accountId,
  });
  const accountEmail = accounts?.email.toLowerCase() ?? "";
  const participant = detail.thread.participants.find(
    (item) => item.email.toLowerCase() !== accountEmail,
  );
  if (!participant) throw new Error("No external participant to convert");

  const nameParts = (participant.name ?? participant.email.split("@")[0] ?? "Lead")
    .trim()
    .split(/\s+/);
  const lead = await createLead({
    workspaceId: input.workspaceId,
    userId: input.userId,
    firstName: nameParts[0] || "Lead",
    lastName: nameParts.slice(1).join(" ") || undefined,
    email: participant.email,
    source: "gmail",
  });
  await linkThreadToContact({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    contactId: lead.id,
  });
  await createActivity({
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: "email",
    subject: `Lead created from email: ${detail.thread.subject}`,
    body: detail.thread.snippet,
    contactId: lead.id,
  });
  return { leadId: lead.id, name: contactDisplayName(lead) };
}

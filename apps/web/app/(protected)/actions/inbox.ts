"use server";

import { getUser } from "@repo/auth/server";
import { getMembershipRole } from "@repo/database/workspace";
import {
  assignInboxLabel,
  connectInboxAccount,
  createInboxLabel,
  disconnectInboxAccount,
  getInboxDashboardStats,
  getInboxThreadDetail,
  linkThreadToContact,
  listInboxAccounts,
  listInboxCalendarEvents,
  listInboxLabels,
  listInboxTasks,
  listInboxThreads,
  markThreadRead,
  seedDemoInbox,
  unassignInboxLabel,
  updateInboxTaskStatus,
} from "@repo/database/inbox";
import {
  archiveThreadSchema,
  assignInboxLabelSchema,
  connectInboxAccountSchema,
  createInboxLabelSchema,
  createInboxTaskSchema,
  inboxSearchSchema,
  replyThreadSchema,
  scheduleMeetingSchema,
  seedDemoInboxSchema,
  generateSmartReplySchema,
  listSmartReplyDraftsSchema,
  sendSmartReplySchema,
  summarizeThreadSchema,
  updateSmartReplyDraftSchema,
} from "@repo/types";
import { getGmailOAuthRedirectUri, getMailProviderAdapter } from "@repo/ai";
import { ensureInboxAiToolsRegistered } from "../../../lib/inbox-ai";
import { getOrCreateEmailThreadSummary } from "../../../lib/email-summary";
import {
  generateSmartReplyDraft,
  listSmartReplyHistory,
  saveSmartReplyDraftEdits,
  sendSmartReply,
} from "../../../lib/smart-reply";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import type { EmailThreadSummary, InboxAiReplyDraft } from "@repo/types";

export type InboxActionResult<T> =
  | { ok: true; data: T; tools?: string[] }
  | { ok: false; error: string };

async function requireInboxContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  const { registered } = ensureInboxAiToolsRegistered();
  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    tools: registered,
  };
}

function fail(error: unknown): InboxActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Inbox action failed",
  };
}

export async function getInboxDashboardAction(): Promise<
  InboxActionResult<{
    stats: Awaited<ReturnType<typeof getInboxDashboardStats>>;
    accounts: Awaited<ReturnType<typeof listInboxAccounts>>;
    tools: string[];
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const [stats, accounts] = await Promise.all([
      getInboxDashboardStats({ workspaceId: ctx.workspaceId }),
      listInboxAccounts({ workspaceId: ctx.workspaceId }),
    ]);
    return { ok: true, data: { stats, accounts, tools: ctx.tools } };
  } catch (error) {
    return fail(error);
  }
}

export async function listInboxThreadsAction(
  input: unknown,
): Promise<
  InboxActionResult<{ threads: Awaited<ReturnType<typeof listInboxThreads>> }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = inboxSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const threads = await listInboxThreads({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
      status: parsed.data.status,
      accountId: parsed.data.accountId,
      unreadOnly: parsed.data.unreadOnly,
      contactId: parsed.data.contactId,
    });
    return { ok: true, data: { threads }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function getInboxThreadAction(input: {
  threadId: string;
}): Promise<
  InboxActionResult<{
    detail: NonNullable<Awaited<ReturnType<typeof getInboxThreadDetail>>>;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const detail = await getInboxThreadDetail({
      workspaceId: ctx.workspaceId,
      threadId: input.threadId,
    });
    if (!detail) return { ok: false, error: "Thread not found" };
    await markThreadRead({
      workspaceId: ctx.workspaceId,
      threadId: input.threadId,
      isUnread: false,
    });
    return { ok: true, data: { detail }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function connectInboxAccountAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    account: Awaited<ReturnType<typeof connectInboxAccount>>;
    authUrl?: string;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = connectInboxAccountSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const account = await connectInboxAccount({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    const adapter = getMailProviderAdapter(parsed.data.provider);
    const redirectUri =
      parsed.data.provider === "gmail"
        ? getGmailOAuthRedirectUri()
        : `${(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/api/inbox/oauth/callback`;
    if (parsed.data.provider === "gmail") {
      console.info(
        "[gmail.oauth] connectInboxAccountAction redirect_uri (exact):",
        redirectUri,
      );
    }
    const authUrl = adapter.getAuthUrl({
      workspaceId: ctx.workspaceId,
      redirectUri,
      state: `${ctx.workspaceId}:${account.id}`,
    });
    return { ok: true, data: { account, authUrl }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function disconnectInboxAccountAction(input: {
  id: string;
}): Promise<InboxActionResult<{ disconnected: true }>> {
  try {
    const ctx = await requireInboxContext();
    await disconnectInboxAccount({
      workspaceId: ctx.workspaceId,
      id: input.id,
    });
    return { ok: true, data: { disconnected: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function seedDemoInboxAction(
  input: unknown,
): Promise<InboxActionResult<{ seeded: true }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = seedDemoInboxSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await seedDemoInbox({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      provider: parsed.data.provider,
    });
    return { ok: true, data: { seeded: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function summarizeInboxThreadAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    summary: string;
    structured: EmailThreadSummary;
    cached: boolean;
    credits?: number;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = summarizeThreadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureInboxAiToolsRegistered();
    const result = await getOrCreateEmailThreadSummary({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
      force: parsed.data.force ?? true,
    });
    return {
      ok: true,
      data: {
        summary: result.summary.shortSummary,
        structured: result.summary,
        cached: result.cached,
        credits: result.credits,
      },
      tools: ctx.tools,
    };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Load or generate structured AI email summary.
 * Uses cache unless force=true or messages changed since last generation.
 */
export async function getEmailThreadSummaryAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    summary: EmailThreadSummary;
    cached: boolean;
    credits: number;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = summarizeThreadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureInboxAiToolsRegistered();
    const result = await getOrCreateEmailThreadSummary({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
      force: parsed.data.force ?? false,
    });
    return {
      ok: true,
      data: {
        summary: result.summary,
        cached: result.cached,
        credits: result.credits,
      },
      tools: ctx.tools,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function smartReplyInboxThreadAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    reply: string;
    tone: string;
    draftId: string;
    credits: number;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = generateSmartReplySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureInboxAiToolsRegistered();
    const result = await generateSmartReplyDraft({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
      style: parsed.data.style,
    });
    return {
      ok: true,
      data: {
        reply: result.reply,
        tone: result.draft.style,
        draftId: result.draft.id,
        credits: result.credits,
      },
      tools: ctx.tools,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function generateSmartReplyAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    reply: string;
    draft: InboxAiReplyDraft;
    credits: number;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = generateSmartReplySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureInboxAiToolsRegistered();
    const result = await generateSmartReplyDraft({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
      style: parsed.data.style,
    });
    return {
      ok: true,
      data: {
        reply: result.reply,
        draft: result.draft,
        credits: result.credits,
      },
      tools: ctx.tools,
    };
  } catch (error) {
    return fail(error);
  }
}

export async function updateSmartReplyDraftAction(
  input: unknown,
): Promise<InboxActionResult<{ draft: InboxAiReplyDraft }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = updateSmartReplyDraftSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const draft = await saveSmartReplyDraftEdits({
      workspaceId: ctx.workspaceId,
      draftId: parsed.data.draftId,
      body: parsed.data.body,
    });
    return { ok: true, data: { draft }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function sendSmartReplyAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    messageId: string;
    usedDraftSend: boolean;
    draft: InboxAiReplyDraft | null;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = sendSmartReplySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    ensureInboxAiToolsRegistered();
    const result = await sendSmartReply({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      threadId: parsed.data.threadId,
      draftId: parsed.data.draftId,
      body: parsed.data.body,
      replyAll: parsed.data.replyAll,
    });
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listSmartReplyDraftsAction(
  input: unknown,
): Promise<InboxActionResult<{ drafts: InboxAiReplyDraft[] }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = listSmartReplyDraftsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const drafts = await listSmartReplyHistory({
      workspaceId: ctx.workspaceId,
      threadId: parsed.data.threadId,
    });
    return { ok: true, data: { drafts }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function replyInboxThreadAction(
  input: unknown,
): Promise<InboxActionResult<{ messageId: string; body: string }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = replyThreadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureInboxAiToolsRegistered();
    const result = (await registry.execute(
      "inbox.reply",
      {
        threadId: parsed.data.threadId,
        body: parsed.data.body,
        useSmartReply: parsed.data.useSmartReply,
      },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { messageId: string; body: string };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function archiveInboxThreadAction(
  input: unknown,
): Promise<InboxActionResult<{ archived: true }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = archiveThreadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureInboxAiToolsRegistered();
    await registry.execute(
      "inbox.archive",
      { threadId: parsed.data.threadId },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    );
    return { ok: true, data: { archived: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createInboxTaskAction(
  input: unknown,
): Promise<InboxActionResult<{ task: { id: string; title: string } }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = createInboxTaskSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureInboxAiToolsRegistered();
    const result = (await registry.execute(
      "inbox.createTask",
      {
        threadId: parsed.data.threadId ?? undefined,
        title: parsed.data.title,
        description: parsed.data.description,
        dueAt: parsed.data.dueAt,
      },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as { created: boolean; task: { id: string; title: string } };
    return { ok: true, data: { task: result.task }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function scheduleInboxMeetingAction(
  input: unknown,
): Promise<
  InboxActionResult<{
    event: { id: string; title: string; startsAt: string };
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const parsed = scheduleMeetingSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { registry } = ensureInboxAiToolsRegistered();
    const result = (await registry.execute(
      "inbox.scheduleMeeting",
      {
        threadId: parsed.data.threadId ?? undefined,
        title: parsed.data.title,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        location: parsed.data.location,
      },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as {
      scheduled: boolean;
      event: { id: string; title: string; startsAt: string };
    };
    return { ok: true, data: { event: result.event }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function detectInboxMeetingAction(input: {
  threadId: string;
}): Promise<
  InboxActionResult<{
    detected: boolean;
    confidence: number;
    suggestedTitle?: string;
    suggestedStartsAt?: string;
    suggestedEndsAt?: string;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const { registry } = ensureInboxAiToolsRegistered();
    const result = (await registry.execute(
      "inbox.detectMeeting",
      { threadId: input.threadId },
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
    )) as {
      detected: boolean;
      confidence: number;
      suggestedTitle?: string;
      suggestedStartsAt?: string;
      suggestedEndsAt?: string;
    };
    return { ok: true, data: result, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listInboxLabelsAction(): Promise<
  InboxActionResult<{ labels: Awaited<ReturnType<typeof listInboxLabels>> }>
> {
  try {
    const ctx = await requireInboxContext();
    const labels = await listInboxLabels({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { labels }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createInboxLabelAction(
  input: unknown,
): Promise<InboxActionResult<{ label: Awaited<ReturnType<typeof createInboxLabel>> }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = createInboxLabelSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const label = await createInboxLabel({
      workspaceId: ctx.workspaceId,
      ...parsed.data,
    });
    return { ok: true, data: { label }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function assignInboxLabelAction(
  input: unknown,
): Promise<InboxActionResult<{ assigned: true }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = assignInboxLabelSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await assignInboxLabel({ workspaceId: ctx.workspaceId, ...parsed.data });
    return { ok: true, data: { assigned: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function unassignInboxLabelAction(
  input: unknown,
): Promise<InboxActionResult<{ unassigned: true }>> {
  try {
    const ctx = await requireInboxContext();
    const parsed = assignInboxLabelSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await unassignInboxLabel({ workspaceId: ctx.workspaceId, ...parsed.data });
    return { ok: true, data: { unassigned: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listInboxTasksAction(): Promise<
  InboxActionResult<{ tasks: Awaited<ReturnType<typeof listInboxTasks>> }>
> {
  try {
    const ctx = await requireInboxContext();
    const tasks = await listInboxTasks({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { tasks }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function completeInboxTaskAction(input: {
  id: string;
}): Promise<InboxActionResult<{ done: true }>> {
  try {
    const ctx = await requireInboxContext();
    await updateInboxTaskStatus({
      workspaceId: ctx.workspaceId,
      id: input.id,
      status: "done",
    });
    return { ok: true, data: { done: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listInboxMeetingsAction(): Promise<
  InboxActionResult<{
    events: Awaited<ReturnType<typeof listInboxCalendarEvents>>;
  }>
> {
  try {
    const ctx = await requireInboxContext();
    const events = await listInboxCalendarEvents({
      workspaceId: ctx.workspaceId,
      upcomingOnly: true,
    });
    return { ok: true, data: { events }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function linkInboxThreadToCrmAction(input: {
  threadId: string;
  contactId?: string | null;
  companyId?: string | null;
}): Promise<InboxActionResult<{ linked: true }>> {
  try {
    const ctx = await requireInboxContext();
    await linkThreadToContact({
      workspaceId: ctx.workspaceId,
      threadId: input.threadId,
      contactId: input.contactId,
      companyId: input.companyId,
    });
    return { ok: true, data: { linked: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

"use server";

import { z } from "zod";
import { getDashboardSnapshot } from "@repo/database/dashboard";
import {
  createWorkspaceActivityEvent,
  listWorkspaceActivityEvents,
} from "@repo/database/activity";
import {
  createWorkspaceAiMemory,
  deleteWorkspaceAiMemory,
  getWorkspaceAiSettings,
  listWorkspaceAiMemory,
  setWorkspaceMemoryEnabled,
  updateWorkspaceAiMemory,
} from "@repo/database/workspace-memory";
import {
  completeOnboardingStep,
  createAiOutputVersion,
  createKairosAgentRun,
  dismissAiSuggestion,
  duplicateAiOutputVersion,
  getOnboardingProgress,
  listAiOutputVersions,
  listAiSuggestions,
  listKairosAgentRuns,
  renameAiOutputVersion,
  restoreAiOutputVersion,
  upsertAiSuggestions,
} from "@repo/database/kairos-intelligence";
import {
  completeOnboardingStepSchema,
  createAiOutputVersionSchema,
  createKairosAgentRunSchema,
  createWorkspaceAiMemorySchema,
  deleteWorkspaceAiMemorySchema,
  dismissAiSuggestionSchema,
  renameAiOutputVersionSchema,
  restoreAiOutputVersionSchema,
  setWorkspaceMemoryEnabledSchema,
  updateWorkspaceAiMemorySchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { buildDashboardAiContext } from "../../../lib/dashboard-ai-context";
import { globalSearch, type GlobalSearchResult } from "../../../lib/global-search";
import { getKairosAgent } from "../../../lib/kairos-agents";
import { ONBOARDING_STEPS, onboardingProgressPercent } from "../../../lib/onboarding-checklist";

export type PlatformActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const globalSearchSchema = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(20).optional(),
});

export async function globalSearchAction(
  input: unknown,
): Promise<PlatformActionResult<{ results: GlobalSearchResult[] }>> {
  const parsed = globalSearchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const context = await resolveActiveWorkspace();
  if (!context) {
    return { ok: false, error: "Workspace required" };
  }

  try {
    const results = await globalSearch({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      query: parsed.data.query,
      limit: parsed.data.limit,
    });
    return { ok: true, data: { results } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

export async function workspaceNotificationsAction(): Promise<
  PlatformActionResult<{
    notifications: Array<{
      id: string;
      title: string;
      body: string | null;
      module: string;
      actionUrl: string | null;
      readAt: string | null;
      createdAt: string;
    }>;
  }>
> {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return { ok: false, error: "Workspace required" };
  }

  try {
    const snapshot = await getDashboardSnapshot({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      membershipCount: context.memberships.length,
      role: context.active.role,
      workspaceName: context.active.workspace.name,
    });
    return { ok: true, data: { notifications: snapshot.notifications } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load notifications",
    };
  }
}

export async function dashboardAiContextAction(): Promise<
  PlatformActionResult<{ context: string }>
> {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return { ok: false, error: "Workspace required" };
  }

  try {
    const snapshot = await getDashboardSnapshot({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      membershipCount: context.memberships.length,
      role: context.active.role,
      workspaceName: context.active.workspace.name,
    });
    return { ok: true, data: { context: buildDashboardAiContext(snapshot) } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to build dashboard AI context",
    };
  }
}

export async function rememberWorkspaceFactAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = createWorkspaceAiMemorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const context = await resolveActiveWorkspace();
  if (!context) {
    return { ok: false, error: "Workspace required" };
  }

  try {
    const memory = await createWorkspaceAiMemory({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      sourceModule: parsed.data.sourceModule,
      scope: parsed.data.scope,
      fact: parsed.data.fact,
      summary: parsed.data.summary,
      importance: parsed.data.importance,
      metadata: parsed.data.metadata,
    });
    await createWorkspaceActivityEvent({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      module: "assistant",
      eventType: "memory.created",
      title: "Kairos remembered a workspace fact",
      body: parsed.data.fact.slice(0, 160),
      actionUrl: "/ai/memory",
    }).catch(() => undefined);
    return { ok: true, data: { id: memory.id } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save workspace memory",
    };
  }
}

async function requireWorkspace() {
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Workspace required");
  return context;
}

export async function listKairosMemoryAction(): Promise<
  PlatformActionResult<{
    memory: Awaited<ReturnType<typeof listWorkspaceAiMemory>>;
    settings: Awaited<ReturnType<typeof getWorkspaceAiSettings>>;
  }>
> {
  try {
    const context = await requireWorkspace();
    const [memory, settings] = await Promise.all([
      listWorkspaceAiMemory({
        workspaceId: context.active.workspace.id,
        limit: 100,
      }),
      getWorkspaceAiSettings({ workspaceId: context.active.workspace.id }),
    ]);
    return { ok: true, data: { memory, settings } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load memory",
    };
  }
}

export async function updateKairosMemoryAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = updateWorkspaceAiMemorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const memory = await updateWorkspaceAiMemory({
      workspaceId: context.active.workspace.id,
      memoryId: parsed.data.memoryId,
      fact: parsed.data.fact,
      summary: parsed.data.summary,
      importance: parsed.data.importance,
      scope: parsed.data.scope,
    });
    return { ok: true, data: { id: memory.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update memory",
    };
  }
}

export async function deleteKairosMemoryAction(
  input: unknown,
): Promise<PlatformActionResult<{ deleted: true }>> {
  const parsed = deleteWorkspaceAiMemorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    await deleteWorkspaceAiMemory({
      workspaceId: context.active.workspace.id,
      memoryId: parsed.data.memoryId,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete memory",
    };
  }
}

export async function setKairosMemoryEnabledAction(
  input: unknown,
): Promise<PlatformActionResult<{ enabled: boolean }>> {
  const parsed = setWorkspaceMemoryEnabledSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const settings = await setWorkspaceMemoryEnabled({
      workspaceId: context.active.workspace.id,
      enabled: parsed.data.enabled,
    });
    return { ok: true, data: { enabled: settings.memoryEnabled } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update setting",
    };
  }
}

export async function listWorkspaceActivityAction(input?: {
  range?: "today" | "week" | "month" | "all";
  module?: string;
  actorId?: string;
}): Promise<
  PlatformActionResult<{
    events: Awaited<ReturnType<typeof listWorkspaceActivityEvents>>;
  }>
> {
  try {
    const context = await requireWorkspace();
    const now = new Date();
    let since: string | undefined;
    if (input?.range === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      since = start.toISOString();
    } else if (input?.range === "week") {
      since = new Date(now.getTime() - 7 * 86400000).toISOString();
    } else if (input?.range === "month") {
      since = new Date(now.getTime() - 30 * 86400000).toISOString();
    }
    const events = await listWorkspaceActivityEvents({
      workspaceId: context.active.workspace.id,
      module: input?.module,
      actorId: input?.actorId,
      since,
      limit: 80,
    });
    return { ok: true, data: { events } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load activity",
    };
  }
}

export async function runKairosAgentAction(
  input: unknown,
): Promise<
  PlatformActionResult<{ runId: string; chatHref: string; summary: string }>
> {
  const parsed = createKairosAgentRunSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const agent = getKairosAgent(parsed.data.agentId);
    if (!agent) return { ok: false, error: "Unknown agent" };
    const summary = `${agent.name} queued: ${parsed.data.prompt.slice(0, 160)}`;
    const run = await createKairosAgentRun({
      workspaceId: context.active.workspace.id,
      agentId: agent.id,
      title: parsed.data.title ?? `${agent.name} task`,
      prompt: parsed.data.prompt,
      userId: context.userId,
      resultSummary: summary,
      status: "completed",
    });
    await createWorkspaceActivityEvent({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      module: "assistant",
      eventType: "agent.run",
      title: `${agent.name} completed a task`,
      body: parsed.data.prompt.slice(0, 160),
      actionUrl: `/ai/agents?agent=${agent.id}`,
    }).catch(() => undefined);
    return {
      ok: true,
      data: {
        runId: run.id,
        chatHref: `${agent.chatHref}&prompt=${encodeURIComponent(parsed.data.prompt)}`,
        summary,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to run agent",
    };
  }
}

export async function listKairosAgentRunsAction(input?: {
  agentId?: string;
}): Promise<
  PlatformActionResult<{ runs: Awaited<ReturnType<typeof listKairosAgentRuns>> }>
> {
  try {
    const context = await requireWorkspace();
    const runs = await listKairosAgentRuns({
      workspaceId: context.active.workspace.id,
      agentId: input?.agentId,
      limit: 40,
    });
    return { ok: true, data: { runs } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load agent runs",
    };
  }
}

export async function listAiVersionsAction(): Promise<
  PlatformActionResult<{
    versions: Awaited<ReturnType<typeof listAiOutputVersions>>;
  }>
> {
  try {
    const context = await requireWorkspace();
    const versions = await listAiOutputVersions({
      workspaceId: context.active.workspace.id,
      limit: 60,
    });
    return { ok: true, data: { versions } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load versions",
    };
  }
}

export async function createAiVersionAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = createAiOutputVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const version = await createAiOutputVersion({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      ...parsed.data,
    });
    return { ok: true, data: { id: version.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to create version",
    };
  }
}

export async function renameAiVersionAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = renameAiOutputVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const version = await renameAiOutputVersion({
      workspaceId: context.active.workspace.id,
      versionId: parsed.data.versionId,
      title: parsed.data.title,
    });
    return { ok: true, data: { id: version.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to rename version",
    };
  }
}

export async function restoreAiVersionAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = restoreAiOutputVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const version = await restoreAiOutputVersion({
      workspaceId: context.active.workspace.id,
      versionId: parsed.data.versionId,
      userId: context.userId,
    });
    return { ok: true, data: { id: version.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to restore version",
    };
  }
}

export async function duplicateAiVersionAction(
  input: unknown,
): Promise<PlatformActionResult<{ id: string }>> {
  const parsed = restoreAiOutputVersionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const version = await duplicateAiOutputVersion({
      workspaceId: context.active.workspace.id,
      versionId: parsed.data.versionId,
      userId: context.userId,
    });
    return { ok: true, data: { id: version.id } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to duplicate version",
    };
  }
}

export async function getOnboardingChecklistAction(): Promise<
  PlatformActionResult<{
    steps: typeof ONBOARDING_STEPS;
    completedSteps: string[];
    percent: number;
    celebratedAt: string | null;
  }>
> {
  try {
    const context = await requireWorkspace();
    const progress = await getOnboardingProgress({
      workspaceId: context.active.workspace.id,
    });
    return {
      ok: true,
      data: {
        steps: ONBOARDING_STEPS,
        completedSteps: progress.completedSteps,
        percent: onboardingProgressPercent(progress.completedSteps),
        celebratedAt: progress.celebratedAt,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load checklist",
    };
  }
}

export async function completeOnboardingStepAction(
  input: unknown,
): Promise<
  PlatformActionResult<{ percent: number; celebratedAt: string | null }>
> {
  const parsed = completeOnboardingStepSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    const nextSteps = Array.from(
      new Set([
        ...(
          await getOnboardingProgress({
            workspaceId: context.active.workspace.id,
          })
        ).completedSteps,
        parsed.data.stepId,
      ]),
    );
    const percent = onboardingProgressPercent(nextSteps);
    const progress = await completeOnboardingStep({
      workspaceId: context.active.workspace.id,
      stepId: parsed.data.stepId,
      celebrate: percent >= 100,
    });
    return {
      ok: true,
      data: {
        percent: onboardingProgressPercent(progress.completedSteps),
        celebratedAt: progress.celebratedAt,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update checklist",
    };
  }
}

export async function listKairosSuggestionsAction(): Promise<
  PlatformActionResult<{
    suggestions: Awaited<ReturnType<typeof listAiSuggestions>>;
  }>
> {
  try {
    const context = await requireWorkspace();
    const snapshot = await getDashboardSnapshot({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      membershipCount: context.memberships.length,
      role: context.active.role,
      workspaceName: context.active.workspace.name,
    });

    const seeded = [
      ...(snapshot.inbox.unread > 0
        ? [
            {
              module: "inbox",
              title: "Reply within 2 hours",
              body: `You have ${snapshot.inbox.unread} unread threads waiting.`,
              actionLabel: "Open Inbox",
              actionUrl: "/inbox",
              severity: "warning",
            },
          ]
        : []),
      ...(snapshot.crm.openDeals > 0
        ? [
            {
              module: "crm",
              title: "Follow up with this lead",
              body: `${snapshot.crm.openDeals} open deals need pipeline attention.`,
              actionLabel: "View deals",
              actionUrl: "/deals",
              severity: "info",
            },
          ]
        : []),
      {
        module: "kairos",
        title: "Create a customer",
        body: "Kairos can open a prefilled create form — try /customer or +customer.",
        actionLabel: "Create",
        actionUrl: "kairos://create-customer",
        severity: "info",
      },
      {
        module: "kairos",
        title: "Onboard a new lead",
        body: "Multi-step workflow: customer → deal → follow-up task.",
        actionLabel: "Start workflow",
        actionUrl: "kairos://workflow-onboard-lead",
        severity: "success",
      },
      {
        module: "analytics",
        title: "Show today's revenue",
        body:
          snapshot.finance.wonValue > 0
            ? `Won pipeline value is $${snapshot.finance.wonValue.toLocaleString()}.`
            : "Review analytics and pipeline value with Kairos.",
        actionLabel: "Show revenue",
        actionUrl: "kairos://today-revenue",
        severity: "success",
      },
      {
        module: "kairos",
        title: "Set a reminder",
        body: "Capture a follow-up before it slips — due in 24 hours by default.",
        actionLabel: "Remind me",
        actionUrl: "kairos://create-reminder",
        severity: "info",
      },
      {
        module: "marketing",
        title: "Launch Advora",
        body: "Open Advora for AI marketing campaigns. Kairos will confirm before leaving.",
        actionLabel: "Open Advora",
        actionUrl: "kairos://open-marketing",
        severity: "info",
      },
    ];

    const suggestions = await upsertAiSuggestions({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      suggestions: seeded,
    });
    return { ok: true, data: { suggestions } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to load suggestions",
    };
  }
}

export async function dismissKairosSuggestionAction(
  input: unknown,
): Promise<PlatformActionResult<{ dismissed: true }>> {
  const parsed = dismissAiSuggestionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const context = await requireWorkspace();
    await dismissAiSuggestion({
      workspaceId: context.active.workspace.id,
      suggestionId: parsed.data.suggestionId,
    });
    return { ok: true, data: { dismissed: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to dismiss",
    };
  }
}

"use server";

import { z } from "zod";
import { getDashboardSnapshot } from "@repo/database/dashboard";
import { createWorkspaceAiMemory } from "@repo/database/workspace-memory";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { buildDashboardAiContext } from "../../../lib/dashboard-ai-context";
import { globalSearch, type GlobalSearchResult } from "../../../lib/global-search";

export type PlatformActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const globalSearchSchema = z.object({
  query: z.string().trim().min(1).max(120),
  limit: z.number().int().min(1).max(20).optional(),
});

const rememberWorkspaceFactSchema = z.object({
  fact: z.string().trim().min(1).max(4000),
  summary: z.string().trim().max(1000).optional().nullable(),
  sourceModule: z.string().trim().min(1).max(80).default("assistant"),
  importance: z.number().int().min(1).max(5).default(1),
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
  const parsed = rememberWorkspaceFactSchema.safeParse(input);
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
      fact: parsed.data.fact,
      summary: parsed.data.summary,
      importance: parsed.data.importance,
    });
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

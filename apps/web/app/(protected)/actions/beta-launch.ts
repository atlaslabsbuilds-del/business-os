"use server";

import { getUser } from "@repo/auth/server";
import {
  getBetaLaunchReadiness,
  getWorkspaceBetaLaunchProfile,
  seedDemoWorkspace,
  trackBetaAnalyticsEvent,
  upsertWorkspaceBetaLaunchProfile,
} from "@repo/database/beta-launch";
import {
  seedDemoWorkspaceSchema,
  trackBetaAnalyticsEventSchema,
  upsertWorkspaceBetaProfileSchema,
  type WorkspaceBetaLaunchProfile,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Workspace required");
  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    role: context.active.role,
  };
}

export async function getBetaLaunchProfileAction(): Promise<
  Result<{ profile: WorkspaceBetaLaunchProfile; readiness: Awaited<ReturnType<typeof getBetaLaunchReadiness>> }>
> {
  try {
    const ctx = await requireContext();
    const readiness = await getBetaLaunchReadiness({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { profile: readiness.profile, readiness } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to load beta profile",
    };
  }
}

export async function updateBetaLaunchProfileAction(
  input: unknown,
): Promise<Result<{ profile: WorkspaceBetaLaunchProfile }>> {
  const parsed = upsertWorkspaceBetaProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireContext();
    const profile = await upsertWorkspaceBetaLaunchProfile({
      workspaceId: ctx.workspaceId,
      ...parsed.data,
    });
    await trackBetaAnalyticsEvent({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      eventName: "workspace_template_selected",
      eventCategory: "workspace_creation",
      metadata: { templateKey: parsed.data.templateKey },
    });
    return { ok: true, data: { profile } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save template",
    };
  }
}

export async function seedDemoWorkspaceAction(
  input: unknown,
): Promise<Result<{ seeded: boolean; profile: WorkspaceBetaLaunchProfile }>> {
  const parsed = seedDemoWorkspaceSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireContext();
    if (ctx.role !== "owner" && ctx.role !== "admin") {
      return { ok: false, error: "Only workspace admins can generate demo data." };
    }
    const result = await seedDemoWorkspace({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      templateKey: parsed.data.templateKey,
    });
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate demo workspace",
    };
  }
}

export async function trackBetaEventAction(input: unknown): Promise<Result<{ tracked: true }>> {
  const parsed = trackBetaAnalyticsEventSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    const ctx = await requireContext();
    await trackBetaAnalyticsEvent({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      eventName: parsed.data.eventName,
      eventCategory: parsed.data.eventCategory,
      path: parsed.data.path,
      metadata: parsed.data.metadata,
    });
    return { ok: true, data: { tracked: true } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to track event",
    };
  }
}

export async function ensureBetaProfileAction(): Promise<
  Result<{ profile: WorkspaceBetaLaunchProfile }>
> {
  try {
    const ctx = await requireContext();
    const profile = await getWorkspaceBetaLaunchProfile({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { profile } };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to ensure profile",
    };
  }
}

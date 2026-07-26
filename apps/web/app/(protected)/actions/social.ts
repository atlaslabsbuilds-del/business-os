"use server";

import {
  createSocialPost,
  updateSocialPost,
} from "@repo/database/social";
import {
  createSocialPostSchema,
  generateSocialSchema,
  updateSocialPostSchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { generateSocialContent } from "../../../lib/social-ai";

export type SocialActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function generateSocialAction(
  input: unknown,
): Promise<SocialActionResult<{ content: string }>> {
  const parsed = generateSocialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    return {
      ok: true,
      data: { content: await generateSocialContent(parsed.data) },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate social content",
    };
  }
}

export async function createSocialPostAction(
  input: unknown,
): Promise<SocialActionResult<{ id: string }>> {
  const parsed = createSocialPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const post = await createSocialPost({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      ...parsed.data,
    });
    return { ok: true, data: { id: post.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to create post" };
  }
}

export async function updateSocialPostAction(
  input: unknown,
): Promise<SocialActionResult<{ id: string }>> {
  const parsed = updateSocialPostSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const post = await updateSocialPost({
      workspaceId: context.active.workspace.id,
      ...parsed.data,
    });
    return { ok: true, data: { id: post.id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update post" };
  }
}

"use server";

import {
  createContentItem,
  getContentBrandVoice,
  updateContentItem,
  upsertContentBrandVoice,
} from "@repo/database/content";
import {
  createContentItemSchema,
  generateContentSchema,
  updateBrandVoiceSchema,
  updateContentItemSchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { generateContentWithAi } from "../../../lib/content-ai";

export type ContentActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function generateContentAction(
  input: unknown,
): Promise<ContentActionResult<{ content: string }>> {
  const parsed = generateContentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const voice = await getContentBrandVoice({
      workspaceId: context.active.workspace.id,
    });
    const content = await generateContentWithAi({ ...parsed.data, voice });
    return { ok: true, data: { content } };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to generate content") };
  }
}

export async function createContentAction(
  input: unknown,
): Promise<ContentActionResult<{ id: string }>> {
  const parsed = createContentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const item = await createContentItem({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      ...parsed.data,
    });
    return { ok: true, data: { id: item.id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to create draft") };
  }
}

export async function updateContentAction(
  input: unknown,
): Promise<ContentActionResult<{ id: string }>> {
  const parsed = updateContentItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const item = await updateContentItem({
      workspaceId: context.active.workspace.id,
      ...parsed.data,
    });
    return { ok: true, data: { id: item.id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to save content") };
  }
}

export async function saveBrandVoiceAction(
  input: unknown,
): Promise<ContentActionResult<{ id: string }>> {
  const parsed = updateBrandVoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false, error: "Workspace required" };
  try {
    const voice = await upsertContentBrandVoice({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      ...parsed.data,
    });
    return { ok: true, data: { id: voice.id } };
  } catch (error) {
    return { ok: false, error: errorMessage(error, "Failed to save brand voice") };
  }
}

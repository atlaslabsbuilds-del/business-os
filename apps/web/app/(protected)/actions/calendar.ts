"use server";

import { createBookingLink } from "@repo/database/calendar";
import { createBookingLinkSchema } from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export async function createBookingLinkAction(input: unknown) {
  const parsed = createBookingLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };
  try {
    const link = await createBookingLink({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      ...parsed.data,
    });
    return { ok: true as const, data: { id: link.id, slug: link.slug } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to create booking link" };
  }
}

"use server";

import { createWebsiteProject } from "@repo/database/website";
import { generateWebsiteSchema } from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { generateWebsiteBlueprint } from "../../../lib/website-ai";

export async function generateWebsiteAction(input: unknown) {
  const parsed = generateWebsiteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const context = await resolveActiveWorkspace();
  if (!context) return { ok: false as const, error: "Workspace required" };
  try {
    const blueprint = await generateWebsiteBlueprint(parsed.data);
    const slug = parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "site";
    const project = await createWebsiteProject({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
      name: parsed.data.name,
      projectType: parsed.data.projectType,
      template: parsed.data.template,
      slug: `${slug}-${Date.now().toString(36)}`,
      settings: { blueprint },
    });
    return { ok: true as const, data: { id: project.id, blueprint } };
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Failed to generate website" };
  }
}

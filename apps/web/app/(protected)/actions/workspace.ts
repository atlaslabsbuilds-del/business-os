"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser } from "@repo/auth/server";
import {
  createInvitation,
  createWorkspaceForUser,
  deleteWorkspace,
  getMembershipRole,
  transferWorkspaceOwnership,
  updateWorkspaceSettings,
} from "@repo/database/workspace";
import { emitWorkspaceNotification } from "@repo/database/notifications";
import {
  WORKSPACE_COOKIE,
  createWorkspaceSchema,
  deleteWorkspaceSchema,
  inviteMemberSchema,
  transferOwnershipSchema,
  updateWorkspaceSchema,
} from "@repo/types/workspace";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

function cookieOptions() {
  return {
    path: "/",
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function createWorkspaceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid workspace name",
    };
  }

  try {
    const workspace = await createWorkspaceForUser({
      name: parsed.data.name,
      userId: user.id,
    });

    const cookieStore = await cookies();
    cookieStore.set(WORKSPACE_COOKIE, workspace.id, cookieOptions());
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create workspace",
    };
  }

  redirect("/dashboard");
}

export async function switchWorkspaceAction(workspaceId: string): Promise<void> {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  const role = await getMembershipRole(workspaceId, user.id);
  if (!role) {
    throw new Error("You are not a member of this workspace.");
  }

  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, cookieOptions());

  redirect("/dashboard");
}

export async function inviteMemberAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "member",
  });

  if (!workspaceId) {
    return { ok: false, error: "Missing workspace." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid invitation",
    };
  }

  const role = await getMembershipRole(workspaceId, user.id);
  if (role !== "owner" && role !== "admin") {
    return { ok: false, error: "Only owners and admins can invite members." };
  }

  try {
    await createInvitation({
      workspaceId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedBy: user.id,
    });

    await emitWorkspaceNotification({
      workspaceId,
      module: "workspace",
      category: "team_invite",
      title: "Team invite sent",
      body: `${parsed.data.email} invited as ${parsed.data.role}`,
      actionUrl: "/team",
      userId: user.id,
      metadata: { email: parsed.data.email, role: parsed.data.role },
    });

    return {
      ok: true,
      message: `Invitation created for ${parsed.data.email}.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create invitation",
    };
  }
}

export async function updateWorkspaceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const parsed = updateWorkspaceSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    logoUrl: formData.get("logoUrl") ?? "",
  });

  if (!workspaceId) {
    return { ok: false, error: "Missing workspace." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid workspace settings",
    };
  }

  const role = await getMembershipRole(workspaceId, user.id);
  if (role !== "owner") {
    return { ok: false, error: "Only the owner can update workspace settings." };
  }

  try {
    await updateWorkspaceSettings({
      workspaceId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      logoUrl: parsed.data.logoUrl ? parsed.data.logoUrl : null,
    });

    await emitWorkspaceNotification({
      workspaceId,
      module: "workspace",
      category: "workspace_update",
      title: "Workspace updated",
      body: `${parsed.data.name} settings were saved.`,
      actionUrl: "/settings",
      userId: user.id,
    });

    return { ok: true, message: "Workspace settings saved." };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to update workspace",
    };
  }
}

export async function transferOwnershipAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const parsed = transferOwnershipSchema.safeParse({
    newOwnerUserId: formData.get("newOwnerUserId"),
  });

  if (!workspaceId) {
    return { ok: false, error: "Missing workspace." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid transfer target",
    };
  }

  const role = await getMembershipRole(workspaceId, user.id);
  if (role !== "owner") {
    return { ok: false, error: "Only the owner can transfer ownership." };
  }

  try {
    await transferWorkspaceOwnership({
      workspaceId,
      newOwnerUserId: parsed.data.newOwnerUserId,
    });
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to transfer ownership",
    };
  }

  redirect("/settings");
}

export async function deleteWorkspaceAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) {
    return { ok: false, error: "You must be signed in." };
  }

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const expectedName = String(formData.get("expectedName") ?? "");
  const parsed = deleteWorkspaceSchema.safeParse({
    confirmName: formData.get("confirmName"),
  });

  if (!workspaceId) {
    return { ok: false, error: "Missing workspace." };
  }

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Confirmation required",
    };
  }

  if (parsed.data.confirmName !== expectedName) {
    return { ok: false, error: "Workspace name does not match." };
  }

  const role = await getMembershipRole(workspaceId, user.id);
  if (role !== "owner") {
    return { ok: false, error: "Only the owner can delete this workspace." };
  }

  try {
    await deleteWorkspace(workspaceId);
    const cookieStore = await cookies();
    cookieStore.delete(WORKSPACE_COOKIE);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to delete workspace",
    };
  }

  redirect("/onboarding");
}

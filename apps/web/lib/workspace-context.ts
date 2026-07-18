import { cookies } from "next/headers";
import { getUser } from "@repo/auth/server";
import { listUserWorkspaces } from "@repo/database/workspace";
import type { WorkspaceMembership } from "@repo/types";
import { WORKSPACE_COOKIE } from "@repo/types/workspace";

export async function resolveActiveWorkspace(): Promise<{
  userId: string;
  email: string | null;
  memberships: WorkspaceMembership[];
  active: WorkspaceMembership;
} | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  const memberships = await listUserWorkspaces(user.id);
  if (memberships.length === 0) {
    return null;
  }

  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const active =
    memberships.find((item) => item.workspace.id === cookieWorkspaceId) ??
    memberships[0];

  if (!active) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    memberships,
    active,
  };
}

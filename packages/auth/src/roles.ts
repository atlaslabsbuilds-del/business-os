import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole, Database } from "@repo/types";
import { createAdminClient, createServerClient } from "@repo/database";

const ADMIN_ROLES: readonly AppRole[] = ["admin", "owner"];

export function isAdminRole(role: AppRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function hasRole(
  roles: readonly AppRole[],
  required: AppRole | readonly AppRole[],
): boolean {
  const requiredRoles = Array.isArray(required) ? required : [required];
  return requiredRoles.some((role) => roles.includes(role));
}

async function readRoles(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AppRole[]> {
  const { data, error } = await client
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load user roles: ${error.message}`);
  }

  return (data ?? []).map((row) => row.role as AppRole);
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  const supabase = await createServerClient();
  return readRoles(supabase, userId);
}

export async function userHasAdminAccess(
  userId: string,
  client?: SupabaseClient<Database>,
): Promise<boolean> {
  if (client) {
    try {
      const roles = await readRoles(client, userId);
      if (roles.some(isAdminRole)) {
        return true;
      }
    } catch {
      // Fall through to service-role lookup.
    }
  }

  try {
    const admin = createAdminClient();
    const roles = await readRoles(admin, userId);
    return roles.some(isAdminRole);
  } catch {
    return false;
  }
}

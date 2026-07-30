import { createServerClient } from "@repo/database/server";
import { mapSupabaseUser } from "@repo/database/helpers";
import type { AuthSession, AuthUser } from "@repo/types";
import { userHasAdminAccess } from "./roles";

export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return mapSupabaseUser(user);
}

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  const user = mapSupabaseUser(session.user);
  if (!user) {
    return null;
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at ?? null,
    user,
  };
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  const allowed = await userHasAdminAccess(user.id);
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function refreshSession() {
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export async function signOut() {
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

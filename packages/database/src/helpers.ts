import type { AuthUser } from "@repo/types";
import type { User } from "@supabase/supabase-js";

export type CookieMethods = {
  getAll: () => { name: string; value: string }[];
  setAll: (
    cookies: {
      name: string;
      value: string;
      options?: Record<string, unknown>;
    }[],
  ) => void;
};

export function getDatabasePackageName(): string {
  return "@repo/database";
}

export function mapSupabaseUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    emailConfirmedAt: user.email_confirmed_at ?? null,
    appMetadata: user.app_metadata ?? {},
    userMetadata: user.user_metadata ?? {},
  };
}

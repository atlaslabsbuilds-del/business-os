import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv } from "@repo/config/env";
import { mapSupabaseUser } from "@repo/database";
import type { AuthUser } from "@repo/types";
import type { NextRequest } from "next/server";

export type ApiAuthResult =
  | { ok: true; user: AuthUser; accessToken: string }
  | { ok: false; status: 401 | 403; message: string };

export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function verifyAccessToken(
  accessToken: string,
): Promise<AuthUser | null> {
  const env = getPublicSupabaseEnv();
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return mapSupabaseUser(user);
}

export async function requireApiUser(
  request: NextRequest,
): Promise<ApiAuthResult> {
  const accessToken = extractBearerToken(request);
  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      message: "Missing bearer token",
    };
  }

  const user = await verifyAccessToken(accessToken);
  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Invalid or expired token",
    };
  }

  return {
    ok: true,
    user,
    accessToken,
  };
}

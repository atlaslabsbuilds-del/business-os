import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeAuthNextPath } from "./site-url";

/**
 * Supabase OAuth / magic-link callback for Next.js App Router.
 *
 * Critical bug this fixes: exchanging the code via `cookies()` from
 * `next/headers` and then returning a *new* `NextResponse.redirect()`
 * drops the session Set-Cookie headers. The browser never stores the
 * session, so middleware sees no user and the visitor stays on `/`.
 *
 * Cookies must be written onto the same redirect response that is returned.
 */
export async function handleAuthCallback(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = sanitizeAuthNextPath(searchParams.get("next"));
  const isPasswordReset = next === "/reset-password" || next.startsWith("/reset-password/");

  const failPath = isPasswordReset
    ? "/reset-password?error=invalid"
    : "/signin?error=auth_callback";

  if (!code) {
    // Auth provider may bounce back with error_* query params on a bad/used link.
    const providerError =
      searchParams.get("error") ||
      searchParams.get("error_code") ||
      searchParams.get("error_description");
    if (providerError && isPasswordReset) {
      const expired =
        /expired|otp_expired|flow_state_expired/i.test(providerError) ||
        searchParams.get("error_code") === "otp_expired";
      return NextResponse.redirect(
        new URL(
          expired ? "/reset-password?error=expired" : "/reset-password?error=invalid",
          origin,
        ),
      );
    }
    return NextResponse.redirect(new URL(failPath, origin));
  }

  const destination = new URL(next, origin);
  let redirectResponse = NextResponse.redirect(destination);

  const env = getPublicSupabaseEnv();
  const supabase = createSupabaseServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          redirectResponse = NextResponse.redirect(destination);
          cookiesToSet.forEach(({ name, value, options }) => {
            redirectResponse.cookies.set(name, value, {
              path: "/",
              ...options,
            });
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    console.warn("[auth.callback] exchangeCodeForSession failed", {
      message: error?.message ?? "missing session",
    });
    const message = error?.message ?? "";
    if (isPasswordReset) {
      const expired = /expired|otp_expired|flow_state/i.test(message);
      const used = /already|reuse|consumed/i.test(message);
      const errorCode = used ? "used" : expired ? "expired" : "invalid";
      return NextResponse.redirect(
        new URL(`/reset-password?error=${errorCode}`, origin),
      );
    }
    return NextResponse.redirect(new URL("/signin?error=auth_callback", origin));
  }

  return redirectResponse;
}

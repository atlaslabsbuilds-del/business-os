import { NextResponse, type NextRequest } from "next/server";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import {
  decodeOAuthState,
  exchangeGmailAuthCode,
  fetchGoogleUserInfo,
  getGmailOAuthRedirectUri,
  getGmailProfile,
} from "@repo/ai";
import { upsertGmailAccountTokens } from "@repo/database/gmail";
import { createAdminClient } from "@repo/database/admin";
import { getPublicSupabaseEnv } from "@repo/database/env";
import { getUser } from "@repo/auth/server";
import { getSiteUrl } from "@repo/auth/site-url";
import { getMembershipRole } from "@repo/database/workspace";

export const runtime = "nodejs";

/**
 * Google OAuth callback — exchanges code, stores tokens, redirects to accounts.
 *
 * Critical: refreshed Supabase session cookies must be attached to the
 * redirect response. Middleware may refresh the session on NextResponse.next(),
 * but that response is discarded when this handler returns its own redirect —
 * without copying cookies, the browser loses the session and lands on /signin,
 * which then breaks pending Server Actions ("unexpected response").
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const siteUrl = getSiteUrl(request.nextUrl.origin);
  const accountsUrl = new URL("/inbox/accounts", siteUrl);

  console.info("[gmail.oauth] callback hit", {
    hasCode: Boolean(code),
    hasState: Boolean(state),
    oauthError,
    path: url.pathname,
  });

  if (oauthError) {
    accountsUrl.searchParams.set("oauth", "error");
    return redirectWithSession(request, accountsUrl);
  }

  if (!code || !state) {
    accountsUrl.searchParams.set("oauth", "missing");
    return redirectWithSession(request, accountsUrl);
  }

  try {
    const decoded = decodeOAuthState(state);
    if (decoded.provider !== "gmail") {
      accountsUrl.searchParams.set("oauth", "unsupported");
      return redirectWithSession(request, accountsUrl);
    }
    const sessionUser = await getUser();
    if (
      !sessionUser ||
      sessionUser.id !== decoded.userId ||
      !(await getMembershipRole(decoded.workspaceId, sessionUser.id))
    ) {
      accountsUrl.searchParams.set("oauth", "error");
      return redirectWithSession(request, accountsUrl);
    }

    const redirectUri = getGmailOAuthRedirectUri(siteUrl);
    console.info(
      "[gmail.oauth] callback token exchange redirect_uri (exact):",
      redirectUri,
    );

    const tokens = await exchangeGmailAuthCode({ code, redirectUri });
    console.info("[gmail.oauth] token exchange succeeded", {
      hasAccessToken: Boolean(tokens.accessToken),
      hasRefreshToken: Boolean(tokens.refreshToken),
      expiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
    });

    const userInfo = await fetchGoogleUserInfo(tokens.accessToken);
    let historyId: string | null = null;
    try {
      const profile = await getGmailProfile(tokens.accessToken);
      historyId = profile.historyId;
    } catch (profileError) {
      console.warn("[gmail.oauth] profile fetch skipped", {
        error:
          profileError instanceof Error
            ? profileError.message
            : String(profileError),
      });
    }

    const admin = createAdminClient();
    const account = await upsertGmailAccountTokens({
      workspaceId: decoded.workspaceId,
      userId: decoded.userId,
      email: userInfo.email,
      displayName: decoded.displayName ?? userInfo.name,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      scopes: tokens.scopes,
      historyId,
      client: admin,
    });

    console.info("[gmail.oauth] account upserted", {
      accountId: account.id,
      email: account.email,
      status: account.status,
      hasRefreshToken: Boolean(account.refreshToken),
      historyId: account.historyId,
    });

    accountsUrl.searchParams.set("oauth", "connected");
    accountsUrl.searchParams.set("email", userInfo.email);
    return redirectWithSession(request, accountsUrl);
  } catch (err) {
    console.error("[gmail.oauth] callback failed", {
      error: err instanceof Error ? err.message : "oauth_failed",
    });
    accountsUrl.searchParams.set("oauth", "error");
    return redirectWithSession(request, accountsUrl);
  }
}

/**
 * Redirect while refreshing/attaching Supabase auth cookies onto the response
 * so the user session survives the OAuth round-trip.
 */
async function redirectWithSession(request: NextRequest, destination: URL) {
  const response = NextResponse.redirect(destination);
  try {
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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.info("[gmail.oauth] session on redirect", {
      destination: `${destination.pathname}${destination.search}`,
      hasUser: Boolean(user),
      userId: user?.id ?? null,
      authError: error?.message ?? null,
    });
  } catch (sessionError) {
    console.warn("[gmail.oauth] session refresh on redirect failed", {
      error:
        sessionError instanceof Error
          ? sessionError.message
          : String(sessionError),
    });
  }

  return response;
}

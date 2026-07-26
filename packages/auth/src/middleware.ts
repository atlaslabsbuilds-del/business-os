import { createMiddlewareClient } from "@repo/database/middleware";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_ROUTES,
  ONBOARDING_PATH,
  isGuestOnlyRoute,
  isPublicRoute,
  requiresAdmin,
} from "./constants";
import { userHasAdminAccess } from "./roles";
import { consumeRateLimit } from "./rate-limit";

export type MiddlewareAuthOptions = {
  loginPath?: string;
  /** When true (default), every non-public route requires authentication. */
  protectAllRoutes?: boolean;
  allowPublicHome?: boolean;
  checkWorkspaceOnboarding?: boolean;
};

function isServerActionRequest(request: NextRequest): boolean {
  return (
    request.method === "POST" &&
    (request.headers.has("next-action") ||
      request.headers.has("Next-Action"))
  );
}

function isRscRequest(request: NextRequest): boolean {
  return (
    request.headers.get("rsc") === "1" ||
    request.headers.get("accept") === "text/x-component"
  );
}

/**
 * Redirects that Server Actions / RSC can understand.
 * A plain HTML redirect to /signin causes:
 * "An unexpected response was received from the server."
 */
function redirectForRequest(request: NextRequest, destination: URL) {
  if (isServerActionRequest(request) || isRscRequest(request)) {
    return new NextResponse(null, {
      status: 303,
      headers: {
        "x-action-redirect": `${destination.pathname}${destination.search}`,
      },
    });
  }
  return NextResponse.redirect(destination);
}

export async function updateSession(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request);
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.warn("[auth.middleware] getUser error", {
        message: error.message,
        path: request.nextUrl.pathname,
      });
    }
    return { response: getResponse(), user: user ?? null, supabase };
  } catch (error) {
    console.warn("[auth.middleware] getUser threw", {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname,
    });
    return { response: getResponse(), user: null, supabase };
  }
}

export function createWebMiddleware(options: MiddlewareAuthOptions = {}) {
  const loginPath = options.loginPath ?? "/signin";
  const checkWorkspaceOnboarding = options.checkWorkspaceOnboarding ?? true;

  return async function middleware(request: NextRequest) {
    const authRateLimitedPaths = [
      "/signin",
      "/signup",
      "/forgot-password",
      "/reset-password",
    ];
    if (
      request.method === "POST" &&
      authRateLimitedPaths.some(
        (path) =>
          request.nextUrl.pathname === path ||
          request.nextUrl.pathname.startsWith(`${path}/`),
      )
    ) {
      const forwardedFor = request.headers.get("x-forwarded-for");
      const clientKey =
        forwardedFor?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      const result = consumeRateLimit(
        `auth:${request.nextUrl.pathname}:${clientKey}`,
        12,
        60_000,
      );
      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests. Try again later." }),
          {
            status: 429,
            headers: {
              "content-type": "application/json",
              "retry-after": String(result.retryAfterSeconds),
            },
          },
        );
      }
    }

    const { response, user, supabase } = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (isGuestOnlyRoute(pathname) && user) {
      // After Gmail OAuth, middleware may briefly send users to /signin with
      // oauth=connected — bounce authenticated users back to the intended page.
      const nextParam = request.nextUrl.searchParams.get("next");
      const oauth = request.nextUrl.searchParams.get("oauth");
      const url = request.nextUrl.clone();
      if (
        oauth &&
        nextParam &&
        nextParam.startsWith("/") &&
        !nextParam.startsWith("//")
      ) {
        url.pathname = nextParam;
        url.search = "";
        if (oauth === "connected" || oauth === "error") {
          url.searchParams.set("oauth", oauth);
          const email = request.nextUrl.searchParams.get("email");
          const message = request.nextUrl.searchParams.get("message");
          if (email) url.searchParams.set("email", email);
          if (message) url.searchParams.set("message", message);
        }
        return redirectForRequest(request, url);
      }
      url.pathname = "/dashboard";
      url.search = "";
      return redirectForRequest(request, url);
    }

    if (pathname === "/reset-password" || pathname.startsWith("/reset-password/")) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = loginPath;
        url.search = "";
        url.searchParams.set("next", pathname);
        return redirectForRequest(request, url);
      }
      return response;
    }

    // Supabase may create an authenticated session before email confirmation.
    // Keep the verification route reachable, but do not allow unverified
    // accounts to access workspace data or invoke server actions.
    const isVerificationRoute =
      pathname === "/verify-email" || pathname.startsWith("/verify-email/");
    if (user && !user.email_confirmed_at && !isVerificationRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/verify-email";
      url.search = "";
      return redirectForRequest(request, url);
    }

    const isPublic = isPublicRoute(pathname);
    const protectAll = options.protectAllRoutes ?? true;
    const needsAuth = protectAll ? !isPublic : false;

    if (needsAuth && !user) {
      const url = request.nextUrl.clone();
      // Preserve destination path in `next`; carry oauth status so reconnect
      // messaging survives a session gap without breaking Server Actions.
      const oauth = url.searchParams.get("oauth");
      const email = url.searchParams.get("email");
      const message = url.searchParams.get("message");
      url.pathname = loginPath;
      url.search = "";
      url.searchParams.set("next", pathname);
      if (oauth) url.searchParams.set("oauth", oauth);
      if (email) url.searchParams.set("email", email);
      if (message) url.searchParams.set("message", message);
      return redirectForRequest(request, url);
    }

    if (user && checkWorkspaceOnboarding && !isPublic) {
      const { count, error } = await supabase
        .from("workspace_members")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const hasWorkspace = !error && (count ?? 0) > 0;
      const onOnboarding =
        pathname === ONBOARDING_PATH || pathname.startsWith(`${ONBOARDING_PATH}/`);

      if (!hasWorkspace && !onOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = ONBOARDING_PATH;
        url.search = "";
        return redirectForRequest(request, url);
      }

      if (hasWorkspace && onOnboarding) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = "";
        return redirectForRequest(request, url);
      }
    }

    return response;
  };
}

export function createAdminMiddleware() {
  return async function middleware(request: NextRequest) {
    const { response, user, supabase } = await updateSession(request);
    const { pathname } = request.nextUrl;

    if (pathname === ADMIN_ROUTES.login) {
      if (user) {
        const isAdmin = await userHasAdminAccess(user.id, supabase);
        if (isAdmin) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      }
      return response;
    }

    if (pathname === ADMIN_ROUTES.unauthorized) {
      return response;
    }

    if (!requiresAdmin(pathname)) {
      return response;
    }

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_ROUTES.login;
      url.searchParams.set("next", pathname);
      return redirectForRequest(request, url);
    }

    const isAdmin = await userHasAdminAccess(user.id, supabase);
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_ROUTES.unauthorized;
      return redirectForRequest(request, url);
    }

    return response;
  };
}

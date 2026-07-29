export const AUTH_CALLBACK_PATH = "/auth/callback";

/** Custom Gmail OAuth callback (not Supabase Auth). Must stay public. */
export const GMAIL_OAUTH_CALLBACK_PATH = "/api/inbox/oauth/callback";

/** Routes that signed-in users should leave (redirect to dashboard). */
export const GUEST_ONLY_ROUTES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/login",
] as const;

export const AUTH_ROUTES = [
  ...GUEST_ONLY_ROUTES,
  "/reset-password",
  "/verify-email",
  AUTH_CALLBACK_PATH,
] as const;

export const PUBLIC_API_ROUTES = ["/api/waitlist/stats"] as const;

export const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/credits",
  "/checkout",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
  "/refund",
  "/waitlist",
  "/roadmap",
  "/ref",
  "/offline",
  "/unauthorized",
  "/session-expired",
  "/api/waitlist",
  "/api/waitlist/stats",
  "/api/contact",
  "/api/checkout",
  ...AUTH_ROUTES,
  GMAIL_OAUTH_CALLBACK_PATH,
] as const;

export const ONBOARDING_PATH = "/onboarding";

/** Legacy prefix list — web middleware now protects all non-public routes. */
export const PROTECTED_PREFIXES = [
  "/dashboard",
  "/account",
  "/settings",
  "/onboarding",
  "/workspace",
  "/team",
] as const;

export const ADMIN_ROUTES = {
  login: "/login",
  unauthorized: "/unauthorized",
} as const;

function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === "/";
  }
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isGuestOnlyRoute(pathname: string): boolean {
  return GUEST_ONLY_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => matchesRoute(pathname, route));
}

export function isProtectedPath(
  pathname: string,
  protectedPrefixes: readonly string[] = PROTECTED_PREFIXES,
): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function requiresAdmin(pathname: string): boolean {
  if (pathname === ADMIN_ROUTES.login || pathname === ADMIN_ROUTES.unauthorized) {
    return false;
  }

  return true;
}

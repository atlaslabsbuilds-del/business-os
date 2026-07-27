/**
 * Origin for the current request.
 * Browser: always the active tab origin (fixes local dev when NEXT_PUBLIC_SITE_URL is production).
 * Server: NEXT_PUBLIC_SITE_URL, then optional request origin fallback.
 */
export function getSiteUrl(fallbackOrigin?: string): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }

  if (fallbackOrigin) {
    return fallbackOrigin.replace(/\/$/, "");
  }

  throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
}

export function sanitizeAuthNextPath(
  requested: string | null,
  fallback = "/dashboard",
): string {
  if (requested && requested.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }
  return fallback;
}

/** Supabase OAuth / email confirmation callback URL. */
export function buildAuthCallbackUrl(next = "/dashboard", baseUrl?: string): string {
  const site = baseUrl ?? getSiteUrl();
  const safeNext = sanitizeAuthNextPath(next);
  return `${site}/auth/callback?next=${encodeURIComponent(safeNext)}`;
}

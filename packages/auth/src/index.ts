export {
  AUTH_CALLBACK_PATH,
  GMAIL_OAUTH_CALLBACK_PATH,
  AUTH_ROUTES,
  GUEST_ONLY_ROUTES,
  PUBLIC_ROUTES,
  ONBOARDING_PATH,
  PROTECTED_PREFIXES,
  ADMIN_ROUTES,
  isAuthRoute,
  isGuestOnlyRoute,
  isPublicRoute,
  isProtectedPath,
  requiresAdmin,
} from "./constants";
export {
  getSession,
  getUser,
  requireUser,
  requireAdmin,
  signOut,
  refreshSession,
} from "./server";
export {
  hasRole,
  isAdminRole,
  getUserRoles,
  userHasAdminAccess,
} from "./roles";
export {
  updateSession,
  createWebMiddleware,
  createAdminMiddleware,
} from "./middleware";
export {
  extractBearerToken,
  verifyAccessToken,
  requireApiUser,
} from "./jwt";
export type { MiddlewareAuthOptions } from "./middleware";
export type { ApiAuthResult } from "./jwt";

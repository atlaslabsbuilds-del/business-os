import { createWebMiddleware } from "@repo/auth/middleware";

export default createWebMiddleware({
  loginPath: "/signin",
  protectAllRoutes: true,
  checkWorkspaceOnboarding: true,
});

export const config = {
  matcher: [
    /*
     * Match app routes. Keep API routes in the matcher so the Gmail OAuth
     * callback can refresh session cookies, but Server Actions are handled
     * inside middleware via x-action-redirect (not a broken HTML redirect).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@repo/auth/jwt";

/**
 * API authentication middleware helper for route handlers.
 * Public routes should skip this helper.
 */
export async function withApiAuth(request: NextRequest) {
  return requireApiUser(request);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json(
    { ok: false, error: { code: "unauthorized", message } },
    { status: 401 },
  );
}

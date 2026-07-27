import type { NextRequest } from "next/server";
import { handleAuthCallback } from "@repo/auth/oauth-callback";

export async function GET(request: NextRequest) {
  return handleAuthCallback(request);
}

import { NextResponse, type NextRequest } from "next/server";
import { requireApiUser } from "@repo/auth/jwt";

export async function GET(request: NextRequest) {
  const result = await requireApiUser(request);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: { code: "unauthorized", message: result.message } },
      { status: result.status },
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      id: result.user.id,
      email: result.user.email,
    },
  });
}

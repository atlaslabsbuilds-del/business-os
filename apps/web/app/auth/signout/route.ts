import { NextResponse } from "next/server";
import { createServerClient } from "@repo/database/server";
import { getUser } from "@repo/auth/server";
import { writeSecurityAuditLog } from "@repo/database/security";

export async function POST(request: Request) {
  const user = await getUser();
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  if (user) {
    await writeSecurityAuditLog({ actorUserId: user.id, eventType: "logout" });
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/signin", origin), {
    status: 303,
  });
}

export async function GET(request: Request) {
  const user = await getUser();
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  if (user) {
    await writeSecurityAuditLog({ actorUserId: user.id, eventType: "logout" });
  }

  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/signin", origin));
}

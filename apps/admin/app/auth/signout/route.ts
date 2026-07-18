import { NextResponse } from "next/server";
import { createServerClient } from "@repo/database/server";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/login", origin));
}

export async function POST(request: Request) {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(new URL("/login", origin), { status: 303 });
}

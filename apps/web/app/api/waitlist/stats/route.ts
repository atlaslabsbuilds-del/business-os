import { NextResponse } from "next/server";
import { getWaitlistStats } from "@repo/database/waitlist";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getWaitlistStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load waitlist stats.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

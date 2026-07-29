import { NextResponse } from "next/server";
import {
  EMPTY_WAITLIST_STATS,
  getPublicWaitlistStats,
} from "@repo/database/waitlist";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stats = await getPublicWaitlistStats();
    return NextResponse.json(stats, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.warn("[waitlist.stats] public stats unavailable", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(EMPTY_WAITLIST_STATS, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}

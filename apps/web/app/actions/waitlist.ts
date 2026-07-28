"use server";

import { headers } from "next/headers";
import {
  joinWaitlist,
  type WaitlistTeamSize,
  WAITLIST_TEAM_SIZES,
} from "@repo/database/waitlist";

async function getSiteUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanderbase.com";
}

export async function joinWaitlistAction(input: {
  name: string;
  email: string;
  company?: string | null;
  teamSize: WaitlistTeamSize;
  marketingConsent: boolean;
  referredByCode?: string | null;
}) {
  if (!WAITLIST_TEAM_SIZES.includes(input.teamSize)) {
    return {
      ok: false as const,
      code: "validation" as const,
      message: "Please choose a valid team size.",
    };
  }

  return joinWaitlist({
    ...input,
    siteUrl: await getSiteUrl(),
  });
}

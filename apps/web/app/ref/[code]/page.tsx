import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Join VanderBase — Referral",
  robots: { index: false, follow: false },
};

export default async function WaitlistReferralPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  if (normalized) {
    const cookieStore = await cookies();
    cookieStore.set("vb_waitlist_ref", normalized, {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
    });
  }

  redirect(normalized ? `/?ref=${encodeURIComponent(normalized)}` : "/");
}

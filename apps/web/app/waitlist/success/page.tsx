import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Gift, Share2, Trophy } from "lucide-react";
import { getWaitlistSuccessData } from "@repo/database/waitlist";
import { Button } from "@repo/ui/button";
import { WaitlistShareActions } from "../../../components/waitlist/waitlist-share-actions";
import { VanderBaseLogo } from "../../../components/branding/vanderbase-logo";
import "../../landing.css";

export const metadata: Metadata = {
  title: "You're on the VanderBase Waitlist",
  robots: { index: false, follow: false },
};

async function getSiteUrl() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "https";
  if (host) {
    return `${protocol}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanderbase.com";
}

const REWARDS = [
  { threshold: 1, label: "Move higher in the queue" },
  { threshold: 3, label: "Priority Early Access" },
  { threshold: 10, label: "Lifetime Founder Badge" },
  { threshold: 25, label: "3 Months of VanderBase Pro" },
] as const;

export default async function WaitlistSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const data = await getWaitlistSuccessData({
    entryId: id,
    siteUrl: await getSiteUrl(),
  });

  if (!data) notFound();

  const firstName = data.name.trim().split(/\s+/)[0] ?? data.name;

  return (
    <div className="landing-root min-h-screen px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-secondary transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <VanderBaseLogo size="sm" />
        </Link>

        <div className="landing-glass-strong landing-gradient-border mt-10 rounded-[32px] px-6 py-10 sm:px-10 sm:py-12">
          <div className="flex items-center gap-3">
            <VanderBaseLogo variant="icon" size="md" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Waitlist confirmed</p>
          </div>

          <h1 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
            🎉 You&apos;re officially on the VanderBase waitlist.
          </h1>
          <p className="mt-3 text-sm leading-6 text-secondary">
            Thanks, {firstName}. We&apos;ll reach out with early access updates as your spot moves forward.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="landing-glass rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Your Position</p>
              <p className="mt-2 text-4xl font-semibold text-primary">#{data.position}</p>
            </div>
            <div className="landing-glass rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Estimated Early Access</p>
              <p className="mt-2 text-4xl font-semibold">{data.estimatedEarlyAccess}</p>
            </div>
          </div>

          <div className="landing-glass mt-6 rounded-3xl p-5">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Invite friends to move up the waitlist.</p>
                <p className="mt-1 text-sm text-secondary">
                  Referral Progress:{" "}
                  <span className="font-medium text-foreground">
                    {data.referralCount} / 3 referrals
                  </span>
                </p>
                <WaitlistShareActions referralUrl={data.referralUrl} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.02] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Trophy className="h-4 w-4 text-primary" aria-hidden />
              Rewards
            </p>
            <ul className="mt-4 space-y-3">
              {REWARDS.map((reward) => {
                const unlocked = data.referralCount >= reward.threshold;
                return (
                  <li key={reward.threshold} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${
                        unlocked ? "bg-primary/20 text-primary" : "bg-white/5 text-muted"
                      }`}
                    >
                      {unlocked ? <Check className="h-3 w-3" aria-hidden /> : reward.threshold}
                    </span>
                    <span className={unlocked ? "text-foreground" : "text-secondary"}>
                      <span className="font-medium">{reward.threshold} Referral{reward.threshold > 1 ? "s" : ""}</span>
                      <span className="text-secondary"> — {reward.label}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/">
              <Button size="lg" variant="secondary" className="gap-2">
                <Share2 className="h-4 w-4" aria-hidden />
                Return Home
              </Button>
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Your referral link is private to this page. VanderBase never exposes emails or referral codes publicly.
        </p>
      </div>
    </div>
  );
}

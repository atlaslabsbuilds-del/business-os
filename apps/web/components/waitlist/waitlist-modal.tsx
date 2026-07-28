"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@repo/ui/button";
import { WAITLIST_TEAM_SIZES, type WaitlistTeamSize } from "@repo/database/waitlist";
import { joinWaitlistAction } from "../../app/actions/waitlist";
import { useLandingInteractions } from "../landing/landing-interactions";

const TEAM_SIZE_LABELS: Record<WaitlistTeamSize, string> = {
  "1": "1",
  "2-10": "2–10",
  "11-50": "11–50",
  "51-200": "51–200",
  "200+": "200+",
};

const REFERRAL_COOKIE = "vb_waitlist_ref";
const REFERRAL_STORAGE = "vb_waitlist_ref";

function readReferralCode(): string | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("ref")?.trim().toUpperCase();
  if (fromQuery) {
    window.sessionStorage.setItem(REFERRAL_STORAGE, fromQuery);
    return fromQuery;
  }

  const fromStorage = window.sessionStorage.getItem(REFERRAL_STORAGE)?.trim().toUpperCase();
  if (fromStorage) return fromStorage;

  const cookieMatch = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${REFERRAL_COOKIE}=`));
  return cookieMatch?.split("=")[1]?.trim().toUpperCase() ?? null;
}

const inputClassName =
  "landing-glass w-full rounded-2xl px-4 py-3 text-sm outline-none ring-1 ring-white/10 transition focus:ring-primary/40";

export function WaitlistModal() {
  const router = useRouter();
  const { overlay, closeOverlay, fireStartFreeConfetti } = useLandingInteractions();
  const open = overlay.id === "waitlist";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState<WaitlistTeamSize>("2-10");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReferralCode(readReferralCode());
    setError(null);
  }, [open]);

  const referredLabel = useMemo(() => {
    if (!referralCode) return null;
    return "You were referred by a founder — join to move up the waitlist.";
  }, [referralCode]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await joinWaitlistAction({
      name,
      email,
      company: company.trim() || null,
      teamSize,
      marketingConsent,
      referredByCode: referralCode,
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    fireStartFreeConfetti();
    closeOverlay();
    router.push(`/waitlist/success?id=${encodeURIComponent(result.entry.id)}`);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#050507]/88 p-4 backdrop-blur-xl sm:items-center"
      onClick={closeOverlay}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Join the VanderBase Waitlist"
        className="landing-glass-strong landing-gradient-border w-full max-w-xl overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/6 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Join the VanderBase Waitlist</h2>
              <p className="mt-1 text-sm leading-6 text-secondary">
                Be among the first businesses to experience the AI-native Business OS powered by Kairos.
              </p>
            </div>
          </div>
        </div>

        <form className="space-y-3 px-6 py-5 sm:px-8 sm:py-6" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-secondary">Full Name</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alex Rivera"
              className={inputClassName}
              autoComplete="name"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-secondary">Work Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className={inputClassName}
              autoComplete="email"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-secondary">
              Company Name <span className="text-muted">(Optional)</span>
            </span>
            <input
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Northstar Studio"
              className={inputClassName}
              autoComplete="organization"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-secondary">Team Size</span>
            <select
              required
              value={teamSize}
              onChange={(event) => setTeamSize(event.target.value as WaitlistTeamSize)}
              className={`${inputClassName} appearance-none`}
            >
              {WAITLIST_TEAM_SIZES.map((size) => (
                <option key={size} value={size} className="bg-[#111]">
                  {TEAM_SIZE_LABELS[size]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <input
              required
              type="checkbox"
              checked={marketingConsent}
              onChange={(event) => setMarketingConsent(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent accent-primary"
            />
            <span className="text-sm leading-6 text-secondary">I agree to receive product updates.</span>
          </label>

          {referredLabel ? (
            <p className="text-xs text-primary">{referredLabel}</p>
          ) : null}

          {error ? (
            <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="mt-2 w-full gap-2" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Joining…
              </>
            ) : (
              <>
                Join Waitlist
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

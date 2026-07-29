"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildAuthCallbackUrl,
  getAuthUser,
  isEmailVerified,
  onEmailVerification,
  refreshAuthSession,
  resendVerificationEmail,
  signOutClient,
} from "@repo/auth/client";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import { Spinner } from "@repo/ui/spinner";
import { cn } from "@repo/ui/utils";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useAuthToast } from "./auth-toast";
import { useResendCountdown } from "./use-resend-countdown";

type ViewState = "loading" | "pending" | "success" | "error";

const DEFAULT_ERROR = {
  title: "Invalid link",
  message:
    "This verification link is no longer valid. Request a new email to continue.",
} as const;

const ERROR_COPY: Record<string, { title: string; message: string }> = {
  expired: {
    title: "Link expired",
    message:
      "This verification link has expired. Request a new one and try again.",
  },
  invalid: DEFAULT_ERROR,
  verified: {
    title: "Already verified",
    message:
      "Your email is already verified. Sign in to access your VanderBase workspace.",
  },
  network: {
    title: "Connection issue",
    message:
      "We couldn't verify your status. Check your connection and try again.",
  },
};

function AuthIllustration({
  variant,
}: {
  variant: "mail" | "success" | "error" | "loading";
}) {
  const iconClass =
    variant === "success"
      ? "text-emerald-400"
      : variant === "error"
        ? "text-red-400"
        : "text-primary";

  return (
    <div
      className="relative mx-auto flex h-20 w-20 items-center justify-center"
      aria-hidden
    >
      <span
        className={cn(
          "absolute inset-0 rounded-full opacity-40 blur-xl",
          variant === "success"
            ? "bg-emerald-500/30"
            : variant === "error"
              ? "bg-red-500/25"
              : "bg-primary/35",
        )}
      />
      <span
        className={cn(
          "relative flex h-16 w-16 items-center justify-center rounded-2xl border shadow-[0_0_32px_rgba(255,122,0,0.2)]",
          variant === "success"
            ? "border-emerald-500/30 bg-emerald-500/10"
            : variant === "error"
              ? "border-red-500/30 bg-red-500/10"
              : "border-primary/25 bg-primary/10",
          variant === "loading" && "animate-pulse",
          variant === "success" && "animate-in zoom-in-95 duration-500",
        )}
      >
        {variant === "loading" ? (
          <RefreshCw className={cn("h-7 w-7 animate-spin", iconClass)} />
        ) : variant === "success" ? (
          <CheckCircle2 className={cn("h-8 w-8", iconClass)} />
        ) : variant === "error" ? (
          <AlertCircle className={cn("h-7 w-7", iconClass)} />
        ) : (
          <Mail className={cn("h-7 w-7", iconClass)} />
        )}
      </span>
    </div>
  );
}

function sanitizeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useAuthToast();
  const { secondsLeft, canResend, startCountdown } = useResendCountdown();

  const emailFromQuery = searchParams.get("email") ?? "";
  const errorParam = searchParams.get("error");
  const fromSignIn = searchParams.get("from") === "signin";
  const verifiedParam = searchParams.get("verified") === "1";
  const nextPath = sanitizeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState(emailFromQuery);
  const [view, setView] = useState<ViewState>("loading");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const redirectTo = useMemo(
    () => buildAuthCallbackUrl("/verify-email"),
    [],
  );

  useEffect(() => {
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("vb_verify_email", emailFromQuery);
      }
    } else if (typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("vb_verify_email");
      if (stored) setEmail(stored);
    }
  }, [emailFromQuery]);

  useEffect(() => {
    if (errorParam && ERROR_COPY[errorParam]) {
      setView("error");
      setErrorDetail(errorParam);
      return;
    }

    let cancelled = false;

    async function detectStatus() {
      try {
        const user = await getAuthUser();
        if (cancelled) return;

        if (isEmailVerified(user)) {
          setView("success");
          await refreshAuthSession();
          return;
        }

        if (verifiedParam) {
          setView("pending");
          return;
        }

        setView("pending");
      } catch {
        if (cancelled) return;
        if (verifiedParam || errorParam) {
          setView(errorParam ? "error" : "pending");
          return;
        }
        setView("pending");
      }
    }

    void detectStatus();

    const unsubscribe = onEmailVerification((verified) => {
      if (verified) {
        setView("success");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [errorParam, verifiedParam]);

  useEffect(() => {
    if (view !== "success") return;

    let cancelled = false;

    async function completeVerification() {
      try {
        await refreshAuthSession();
        if (cancelled) return;
        showToast("Email verified successfully.", "success");
        router.replace(nextPath);
        router.refresh();
      } catch {
        if (cancelled) return;
        showToast("Verified, but session refresh failed. Sign in again.", "error");
        router.replace("/signin");
      }
    }

    const timer = window.setTimeout(() => {
      void completeVerification();
    }, 1800);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [view, nextPath, router, showToast]);

  function onResend() {
    if (!canResend) return;

    const trimmed = email.trim();
    if (!trimmed) {
      showToast("Enter the email address you used to sign up.", "error");
      return;
    }

    startTransition(async () => {
      try {
        await resendVerificationEmail(trimmed, redirectTo);
        startCountdown();
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("vb_verify_email", trimmed);
        }
        showToast("Verification email sent. Check your inbox and spam folder.", "success");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to send verification email.";
        showToast(message, "error");
      }
    });
  }

  async function onChangeEmail() {
    try {
      await signOutClient();
    } catch {
      // Continue to signup even if sign-out fails.
    }
    router.replace("/signup");
  }

  if (view === "loading") {
    return (
      <div
        className="grid gap-6 py-4 animate-in fade-in duration-300"
        role="status"
        aria-busy="true"
        aria-label="Checking verification status"
      >
        <AuthIllustration variant="loading" />
        <div className="space-y-3 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Verifying your email
          </h1>
          <p className="text-sm text-secondary">
            Hang tight while we confirm your account status.
          </p>
        </div>
        <Spinner label="Checking verification status" className="mx-auto" />
      </div>
    );
  }

  if (view === "success") {
    return (
      <div
        className="grid gap-6 py-2 animate-in fade-in zoom-in-95 duration-500"
        role="status"
        aria-live="polite"
      >
        <AuthIllustration variant="success" />
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Email verified
          </h1>
          <p className="text-sm leading-relaxed text-secondary">
            Your account is confirmed. Redirecting you to your workspace…
          </p>
        </div>
        <Spinner label="Redirecting to dashboard" className="mx-auto" />
      </div>
    );
  }

  if (view === "error" && errorDetail) {
    const copy = ERROR_COPY[errorDetail] ?? DEFAULT_ERROR;

    return (
      <div className="grid gap-5 animate-in fade-in duration-300">
        <AuthIllustration variant="error" />
        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {copy.title}
          </h1>
          <p className="text-sm leading-relaxed text-secondary">{copy.message}</p>
        </div>
        {errorDetail !== "verified" ? (
          <>
            <FormField
              label="Email"
              htmlFor="verify-email-error"
              description="We'll send a fresh VanderBase verification link."
            >
              <Input
                id="verify-email-error"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
              />
            </FormField>
            <Button
              type="button"
              loading={pending}
              disabled={!canResend}
              className="w-full"
              onClick={onResend}
            >
              {canResend ? "Resend verification" : `Resend in ${secondsLeft}s`}
            </Button>
          </>
        ) : (
          <Link href="/signin">
            <Button className="w-full">Continue to login</Button>
          </Link>
        )}
        <Link href="/signin">
          <Button variant="secondary" className="w-full">
            Back to login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 animate-in fade-in duration-300">
      <AuthIllustration variant="mail" />

      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {fromSignIn ? "Verify your email to continue" : "Check your email"}
        </h1>
        <p className="text-sm leading-relaxed text-secondary">
          {fromSignIn
            ? "Your email address hasn't been verified yet."
            : "We've sent a verification link to your email address. Please verify your account to continue."}
        </p>
        {email ? (
          <p className="break-all text-xs font-medium text-primary">{email}</p>
        ) : null}
      </div>

      {!fromSignIn ? (
        <Alert variant="info">
          Open the link in your inbox to unlock your VanderBase workspace. Links
          expire for your security.
        </Alert>
      ) : null}

      <FormField
        label="Email"
        htmlFor="verify-email"
        description="Update if needed, then resend your verification link."
      >
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
        />
      </FormField>

      <Button
        type="button"
        loading={pending}
        disabled={!canResend}
        className="w-full"
        onClick={onResend}
      >
        {canResend ? "Resend verification" : `Resend in ${secondsLeft}s`}
      </Button>

      {fromSignIn ? (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void onChangeEmail()}
        >
          Change email
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void onChangeEmail()}
        >
          Use a different email
        </Button>
      )}

      <Link href="/signin">
        <Button variant="ghost" className="w-full">
          Back to login
        </Button>
      </Link>
    </div>
  );
}

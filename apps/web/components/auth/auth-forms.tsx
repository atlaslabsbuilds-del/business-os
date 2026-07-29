"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildAuthCallbackUrl,
  getAuthSession,
  requestPasswordReset,
  resendVerificationEmail,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  updatePassword,
} from "@repo/auth/client";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@repo/types/auth";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";

function fieldErrors(error: { issues: { path: PropertyKey[]; message: string }[] }) {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!result[key]) {
      result[key] = issue.message;
    }
  }
  return result;
}

function AuthLegalNote() {
  return (
    <p className="text-center text-xs leading-5 text-muted">
      By continuing, you agree to VanderBase{" "}
      <Link href="/terms" className="text-secondary underline-offset-2 hover:text-foreground hover:underline">
        Terms
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="text-secondary underline-offset-2 hover:text-foreground hover:underline">
        Privacy Policy
      </Link>
      .
    </p>
  );
}

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");
  const oauthStatus = searchParams.get("oauth");
  const oauthEmail = searchParams.get("email");
  const [error, setError] = useState<string | null>(
    authError === "auth_callback"
      ? "Authentication failed. Please try again."
      : authError === "session_expired"
        ? "Your session expired. Please sign in again."
        : null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await signInWithPassword(parsed.data);
        const target =
          oauthStatus && nextPath.startsWith("/")
            ? `${nextPath}${nextPath.includes("?") ? "&" : "?"}oauth=${encodeURIComponent(oauthStatus)}${
                oauthEmail ? `&email=${encodeURIComponent(oauthEmail)}` : ""
              }`
            : nextPath;
        router.replace(target);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign in");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {oauthStatus === "connected" ? (
        <Alert variant="success">
          Gmail connected{oauthEmail ? ` (${oauthEmail})` : ""}. Sign in again to
          return to your inbox — your workspace session was refreshed.
        </Alert>
      ) : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-secondary transition duration-200 hover:text-foreground"
        >
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={pending} className="w-full">
        Sign in
      </Button>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-surface px-2 text-muted">Or</span>
        </div>
      </div>
      <GoogleButton label="Continue with Google" nextPath={nextPath} />
      <AuthLegalNote />
      <p className="text-center text-sm text-secondary">
        No account?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const redirectTo = useMemo(
    () => buildAuthCallbackUrl("/verify-email"),
    [],
  );

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    const parsed = signUpSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    if (formData.get("terms") !== "on") {
      setErrors({ terms: "Please accept the Terms and Privacy Policy." });
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const result = await signUpWithPassword(parsed.data, redirectTo);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("vb_verify_email", parsed.data.email);
        }
        if (result.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }
        setMessage("Check your email to verify your account.");
        router.push(`/verify-email?email=${encodeURIComponent(parsed.data.email)}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign up");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      <FormField label="Full name" htmlFor="fullName" error={errors.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required invalid={Boolean(errors.fullName)} />
      </FormField>
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)} />
      </FormField>
      <label className="flex items-start gap-3 rounded-xl border border-border bg-elevated/40 px-3 py-3 text-sm text-secondary">
        <input
          type="checkbox"
          name="terms"
          className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
          required
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="text-foreground underline-offset-2 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-foreground underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {errors.terms ? <p className="text-xs text-red-400">{errors.terms}</p> : null}
      <Button type="submit" loading={pending} className="w-full">
        Create account
      </Button>
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-surface px-2 text-muted">Or</span>
        </div>
      </div>
      <GoogleButton label="Sign up with Google" nextPath="/dashboard" />
      <AuthLegalNote />
      <p className="text-center text-sm text-secondary">
        Already have an account?{" "}
        <Link
          href="/signin"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const redirectTo = useMemo(
    () => buildAuthCallbackUrl("/reset-password"),
    [],
  );

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await requestPasswordReset(parsed.data, redirectTo);
        setMessage("If an account exists for that email, a VanderBase reset link has been sent.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send reset email");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      <FormField label="Email" htmlFor="email" error={errors.email} description="We will email you a password reset link.">
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <Button type="submit" loading={pending} className="w-full">
        Send reset link
      </Button>
      <p className="text-center text-sm text-secondary">
        <Link
          href="/signin"
          className="font-medium text-foreground transition duration-200 hover:text-secondary"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkError = searchParams.get("error");
  const [error, setError] = useState<string | null>(
    linkError === "expired"
      ? "This reset link has expired. Request a new one."
      : linkError === "invalid"
        ? "This reset link is invalid. Request a new one."
        : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const [checking, setChecking] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getAuthSession();
        if (cancelled) return;
        setSessionReady(Boolean(session));
        if (!session && !linkError) {
          setError("Open the reset link from your email to continue. Links expire after a short time.");
        }
      } catch {
        if (!cancelled) {
          setError("Unable to validate this reset session. Request a new link.");
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [linkError]);

  function onSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await updatePassword(parsed.data);
        setMessage("Password updated. Redirecting to sign in…");
        router.replace("/signin");
        router.refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to reset password";
        if (/expired|invalid|session/i.test(msg)) {
          setError("This reset link has expired or is invalid. Request a new one from Forgot password.");
        } else {
          setError(msg);
        }
      }
    });
  }

  if (checking) {
    return <p className="text-sm text-secondary">Validating reset link…</p>;
  }

  if (!sessionReady) {
    return (
      <div className="grid gap-4">
        <Alert variant="error">{error ?? "This reset link is no longer valid."}</Alert>
        <Link href="/forgot-password">
          <Button className="w-full">Request a new reset link</Button>
        </Link>
        <p className="text-center text-sm text-secondary">
          <Link href="/signin" className="font-medium text-foreground hover:text-secondary">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      <FormField label="New password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required invalid={Boolean(errors.confirmPassword)} />
      </FormField>
      <Button type="submit" loading={pending} className="w-full">
        Update password
      </Button>
    </form>
  );
}

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailFromQuery);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirectTo = useMemo(() => buildAuthCallbackUrl("/dashboard"), []);

  useEffect(() => {
    if (!email && typeof window !== "undefined") {
      const stored = window.sessionStorage.getItem("vb_verify_email");
      if (stored) setEmail(stored);
    }
  }, [email]);

  function onResend() {
    setError(null);
    setMessage(null);
    if (!email.trim()) {
      setError("Enter the email address you used to sign up.");
      return;
    }
    startTransition(async () => {
      try {
        await resendVerificationEmail(email.trim(), redirectTo);
        setMessage("Verification email resent. Check your inbox and spam folder.");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to resend verification email");
      }
    });
  }

  return (
    <div className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      {message ? <Alert variant="success">{message}</Alert> : null}
      <Alert variant="info">
        We sent a verification link from VanderBase. Confirm your email to unlock your workspace.
      </Alert>
      <FormField label="Email" htmlFor="verify-email" description="Used only to resend your verification link.">
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          placeholder="you@company.com"
        />
      </FormField>
      <Button type="button" loading={pending} className="w-full" onClick={onResend}>
        Resend verification email
      </Button>
      <Link href="/signin">
        <Button className="w-full" variant="secondary">
          Back to sign in
        </Button>
      </Link>
    </div>
  );
}

function GoogleButton({
  label,
  nextPath = "/dashboard",
}: {
  label: string;
  nextPath?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-2">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <Button
        type="button"
        variant="secondary"
        loading={pending}
        className="w-full"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              const data = await signInWithGoogle(undefined, nextPath);
              if (data.url) {
                window.location.assign(data.url);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : "Google sign-in failed");
            }
          });
        }}
      >
        {label}
      </Button>
    </div>
  );
}

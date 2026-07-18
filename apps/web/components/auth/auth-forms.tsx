"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  requestPasswordReset,
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

function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

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

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const authError = searchParams.get("error");
  const oauthStatus = searchParams.get("oauth");
  const oauthEmail = searchParams.get("email");
  const [error, setError] = useState<string | null>(
    authError === "auth_callback" ? "Authentication failed. Please try again." : null,
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
        // Preserve Gmail OAuth result query when returning to inbox accounts.
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
      <GoogleButton label="Continue with Google" />
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
    () => `${getSiteUrl()}/auth/callback?next=/verify-email`,
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

    setErrors({});
    startTransition(async () => {
      try {
        const result = await signUpWithPassword(parsed.data, redirectTo);
        if (result.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }
        setMessage("Check your email to verify your account.");
        router.push("/verify-email");
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
      <GoogleButton label="Sign up with Google" />
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
    () => `${getSiteUrl()}/auth/callback?next=/reset-password`,
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
        setMessage("If an account exists, a reset link has been sent.");
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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

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
        setError(err instanceof Error ? err.message : "Unable to reset password");
      }
    });
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

function GoogleButton({ label }: { label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirectTo = useMemo(
    () => `${getSiteUrl()}/auth/callback?next=/dashboard`,
    [],
  );

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
              const data = await signInWithGoogle(redirectTo);
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

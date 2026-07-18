"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPassword } from "@repo/auth/client";
import { signInSchema } from "@repo/types/auth";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import { PasswordInput } from "@repo/ui/password-input";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        await signInWithPassword(parsed.data);
        router.replace(nextPath);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to sign in");
      }
    });
  }

  return (
    <form action={onSubmit} className="grid gap-4">
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="Admin email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <PasswordInput id="password" name="password" autoComplete="current-password" required invalid={Boolean(errors.password)} />
      </FormField>
      <Button type="submit" loading={pending} className="w-full">
        Sign in to admin
      </Button>
    </form>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "../../../components/auth/auth-forms";
import { Spinner } from "@repo/ui/spinner";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email to finish setting up VanderBase.",
};

export default function VerifyEmailPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Verify your email
        </h1>
        <p className="text-sm text-secondary">
          Confirm your email address to finish setting up your VanderBase account.
        </p>
      </div>
      <Suspense fallback={<Spinner label="Loading verification" />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}

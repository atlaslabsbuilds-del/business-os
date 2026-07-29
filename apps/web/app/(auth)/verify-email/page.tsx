import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailForm } from "../../../components/auth/verify-email-form";
import { Spinner } from "@repo/ui/spinner";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email to finish setting up VanderBase.",
};

function VerifyEmailFallback() {
  return (
    <div className="grid gap-6 py-4" role="status" aria-busy="true">
      <Spinner label="Loading verification" className="mx-auto" />
      <p className="text-center text-sm text-secondary">Loading verification…</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailForm />
    </Suspense>
  );
}

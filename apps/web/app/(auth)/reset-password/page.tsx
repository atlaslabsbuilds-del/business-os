import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "../../../components/auth/auth-forms";
import { Spinner } from "@repo/ui/spinner";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new password for your VanderBase account.",
};

export default function ResetPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Reset password</h1>
        <p className="text-sm text-secondary">Choose a new password for your VanderBase account.</p>
      </div>
      <Suspense fallback={<Spinner label="Loading reset form" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

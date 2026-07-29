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
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Set a new password
        </h1>
        <p className="text-sm leading-relaxed text-secondary">
          Choose a strong password to secure your VanderBase workspace.
        </p>
      </div>
      <Suspense fallback={<Spinner label="Loading reset form" />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}

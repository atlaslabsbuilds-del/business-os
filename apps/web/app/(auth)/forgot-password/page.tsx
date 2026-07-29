import type { Metadata } from "next";
import { ForgotPasswordForm } from "../../../components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your VanderBase account password securely.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h1>
        <p className="text-sm leading-relaxed text-secondary">
          Enter your email and we&apos;ll send you a secure password reset link.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

import type { Metadata } from "next";
import { ForgotPasswordForm } from "../../../components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your VanderBase account password.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Forgot password</h1>
        <p className="text-sm text-secondary">We will email you a secure VanderBase reset link.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

import { ForgotPasswordForm } from "../../../components/auth/auth-forms";

export default function ForgotPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Forgot password</h2>
        <p className="text-sm text-secondary">We will email you a secure reset link.</p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}

import { ResetPasswordForm } from "../../../components/auth/auth-forms";

export default function ResetPasswordPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Reset password</h2>
        <p className="text-sm text-secondary">Choose a new password for your account.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}

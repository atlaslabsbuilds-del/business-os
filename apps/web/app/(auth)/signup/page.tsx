import { SignupForm } from "../../../components/auth/auth-forms";

export default function SignupPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Create account</h2>
        <p className="text-sm text-secondary">Start with email or Google.</p>
      </div>
      <SignupForm />
    </div>
  );
}

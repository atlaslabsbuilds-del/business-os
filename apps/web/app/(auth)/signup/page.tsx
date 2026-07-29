import type { Metadata } from "next";
import { SignupForm } from "../../../components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create your VanderBase account and join the AI-native Business OS.",
};

export default function SignUpPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Create account</h1>
        <p className="text-sm text-secondary">Start your VanderBase workspace in minutes.</p>
      </div>
      <SignupForm />
    </div>
  );
}

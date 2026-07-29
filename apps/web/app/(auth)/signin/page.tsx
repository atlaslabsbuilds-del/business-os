import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "../../../components/auth/auth-forms";
import { Spinner } from "@repo/ui/spinner";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your VanderBase workspace.",
};

export default function SignInPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="text-sm text-secondary">Access your VanderBase workspace.</p>
      </div>
      <Suspense fallback={<Spinner label="Loading sign in" />}>
        <SignInForm />
      </Suspense>
    </div>
  );
}

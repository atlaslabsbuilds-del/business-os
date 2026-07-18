import Link from "next/link";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";

export default function VerifyEmailPage() {
  return (
    <div className="grid gap-6">
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Verify your email</h2>
        <p className="text-sm text-secondary">
          Confirm your email address to finish setting up your account.
        </p>
      </div>
      <Alert variant="info">
        Check your inbox for a verification link from Supabase Auth. After verifying,
        you can sign in and continue to your dashboard.
      </Alert>
      <Link href="/signin">
        <Button className="w-full" variant="secondary">
          Back to sign in
        </Button>
      </Link>
    </div>
  );
}

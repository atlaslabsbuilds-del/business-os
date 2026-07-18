import { Suspense } from "react";
import Link from "next/link";
import { AdminLoginForm } from "../../components/auth/admin-login-form";
import { Spinner } from "@repo/ui/spinner";

export default function AdminLoginPage() {
  return (
    <div className="bos-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-soft">
              B
            </span>
            Business OS
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">Admin</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface/90 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
            <p className="text-sm text-secondary">Restricted to platform operators.</p>
          </div>
          <Suspense fallback={<Spinner label="Loading admin sign in" />}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

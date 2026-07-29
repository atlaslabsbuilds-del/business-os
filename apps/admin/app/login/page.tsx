import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdminLoginForm } from "../../components/auth/admin-login-form";
import { Spinner } from "@repo/ui/spinner";

export default function AdminLoginPage() {
  return (
    <div className="bos-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center py-1"
            aria-label="VanderBase"
          >
            <Image
              src="/branding/vanderbase-wordmark.png"
              alt="VanderBase"
              width={360}
              height={42}
              priority
              className="h-8 w-auto object-contain sm:h-[42px]"
            />
          </Link>
          <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">Admin</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevated sm:p-8 pbos-animate-scale">
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

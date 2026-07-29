import Link from "next/link";
import type { Metadata } from "next";
import { VanderBaseLogo } from "../../components/branding/vanderbase-logo";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s | VanderBase",
  },
  description: "Secure VanderBase authentication — sign in, sign up, and manage your account.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bos-atmosphere relative flex min-h-screen items-center justify-center px-4 py-12">
      <div className="relative z-10 w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center py-1 transition duration-200 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <VanderBaseLogo size="nav" priority />
          </Link>
          <p className="mt-3 text-xs text-muted">The AI-native Business OS</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevated sm:p-8 pbos-animate-scale">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-foreground">
            Contact
          </Link>
        </p>
      </div>
    </div>
  );
}

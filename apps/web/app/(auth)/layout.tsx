import Link from "next/link";
import { VanderBaseLogo } from "../../components/branding/vanderbase-logo";

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
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition duration-200 hover:text-secondary"
          >
            <VanderBaseLogo compact priority />
            <span className="uppercase tracking-[0.18em]">
              <span className="text-white">VANDER</span>
              <span className="text-primary">BASE</span>
            </span>
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-elevated sm:p-8 pbos-animate-scale">
          {children}
        </div>
      </div>
    </div>
  );
}

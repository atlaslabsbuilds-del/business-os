import Link from "next/link";

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
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white shadow-soft">
              B
            </span>
            Business OS
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-surface/90 p-6 shadow-elevated backdrop-blur-sm sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

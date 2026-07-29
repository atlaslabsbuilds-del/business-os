import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Home, RefreshCw, ShieldAlert, WifiOff } from "lucide-react";
import { Button } from "@repo/ui/button";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

export function ErrorShell({
  code,
  title,
  body,
  icon,
  primaryHref = "/",
  primaryLabel = "Return home",
  secondaryHref,
  secondaryLabel,
}: {
  code?: string;
  title: string;
  body: string;
  icon?: ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="bos-atmosphere flex min-h-screen items-center justify-center px-5 py-16">
      <div className="relative z-10 w-full max-w-lg text-center">
        <Link href="/" className="inline-flex items-center py-1">
          <VanderBaseLogo size="nav" priority />
        </Link>
        <div className="mt-10 rounded-3xl border border-border bg-surface/90 p-8 shadow-elevated sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            {icon ?? <Home className="h-6 w-6" aria-hidden />}
          </div>
          {code ? (
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-primary">{code}</p>
          ) : null}
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-secondary">{body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={primaryHref}>
              <Button className="gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {primaryLabel}
              </Button>
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref}>
                <Button variant="secondary">{secondaryLabel}</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfflineIcon() {
  return <WifiOff className="h-6 w-6" aria-hidden />;
}

export function UnauthorizedIcon() {
  return <ShieldAlert className="h-6 w-6" aria-hidden />;
}

export function RetryIcon() {
  return <RefreshCw className="h-6 w-6" aria-hidden />;
}

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/utils";

export function SectionShell({
  title,
  description,
  actionHref,
  actionLabel,
  children,
  className,
  elevated = false,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: ReactNode;
  className?: string;
  elevated?: boolean;
}) {
  return (
    <Card
      elevated={elevated}
      className={cn("bos-float pbos-animate-rise h-full overflow-hidden", className)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition hover:text-accent"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : null}
        </div>
      </CardHeader>
      {children}
    </Card>
  );
}

export function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="bos-glass relative overflow-hidden rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_60%)]"
        aria-hidden
      />
      <div className="relative">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted">{body}</p>
        {href && cta ? (
          <Link
            href={href}
            className="mt-5 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            {cta}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("bos-skeleton rounded-2xl border border-border/40", className)}
      aria-hidden
    />
  );
}

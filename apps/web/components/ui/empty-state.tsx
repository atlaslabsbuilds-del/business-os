import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellOff,
  ChartColumn,
  ClipboardList,
  FileText,
  Inbox,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@repo/ui/utils";

const PRESETS = {
  customers: {
    icon: Users,
    title: "No customers yet",
    body: "Add your first contact or company to start building your CRM pipeline.",
    cta: "Add customer",
    href: "/crm/contacts",
  },
  invoices: {
    icon: FileText,
    title: "No invoices yet",
    body: "Create an invoice when you’re ready to bill — Finance will keep status in sync.",
    cta: "Open finance",
    href: "/finance",
  },
  analytics: {
    icon: ChartColumn,
    title: "No analytics yet",
    body: "Once activity flows through your workspace, insights will appear here.",
    cta: "Go to dashboard",
    href: "/dashboard",
  },
  tasks: {
    icon: ClipboardList,
    title: "No tasks yet",
    body: "Capture follow-ups from CRM, Inbox, or Kairos so nothing slips.",
    cta: "Create task",
    href: "/crm/activities",
  },
  notifications: {
    icon: BellOff,
    title: "No notifications",
    body: "You’re all caught up. Workspace alerts will show up here.",
  },
  inbox: {
    icon: Inbox,
    title: "Inbox is empty",
    body: "Connect Gmail to sync threads, summaries, and smart replies.",
    cta: "Connect inbox",
    href: "/inbox/accounts",
  },
} as const;

export type EmptyPreset = keyof typeof PRESETS;

export function EmptyState({
  title,
  body,
  href,
  cta,
  icon: Icon,
  preset,
  className,
  children,
}: {
  title?: string;
  body?: string;
  href?: string;
  cta?: string;
  icon?: LucideIcon;
  preset?: EmptyPreset;
  className?: string;
  children?: ReactNode;
}) {
  const config = preset ? PRESETS[preset] : null;
  const ResolvedIcon = Icon ?? config?.icon ?? Users;
  const resolvedTitle = title ?? config?.title ?? "Nothing here yet";
  const resolvedBody = body ?? config?.body ?? "Get started to see content in this space.";
  const resolvedHref = href ?? ("href" in (config ?? {}) ? (config as { href?: string }).href : undefined);
  const resolvedCta = cta ?? ("cta" in (config ?? {}) ? (config as { cta?: string }).cta : undefined);

  return (
    <div
      className={cn(
        "bos-glass relative overflow-hidden rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_60%)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ResolvedIcon className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">{resolvedTitle}</p>
        <p className="mt-2 text-sm text-muted">{resolvedBody}</p>
        {children}
        {resolvedHref && resolvedCta ? (
          <Link
            href={resolvedHref}
            className="mt-5 inline-flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {resolvedCta}
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

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading table">
      <SkeletonBlock className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <SkeletonBlock key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy aria-label="Loading cards">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="h-28 w-full" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return <SkeletonBlock className={cn("h-64 w-full", className)} />;
}

export function FormSkeleton() {
  return (
    <div className="space-y-3" aria-busy aria-label="Loading form">
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-10 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-10 w-32" />
    </div>
  );
}

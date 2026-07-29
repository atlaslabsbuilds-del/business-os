import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { cn } from "@repo/ui/utils";

export {
  EmptyState,
  SkeletonBlock,
  TableSkeleton,
  CardGridSkeleton,
  ChartSkeleton,
  FormSkeleton,
  type EmptyPreset,
} from "../ui/empty-state";

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
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-primary transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

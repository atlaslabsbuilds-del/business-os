import * as React from "react";
import { cn } from "./utils";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "accent" | "success" | "warning" | "error" | "info";
};

const variants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-border bg-elevated text-secondary",
  accent: "border-accent/30 bg-accent-muted text-accent-hover",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  error: "border-error/30 bg-error/10 text-error",
  info: "border-info/30 bg-info/10 text-info",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-medium transition duration-200",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

import * as React from "react";
import { cn } from "./utils";

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "error" | "success" | "info" | "warning";
};

const variantClasses: Record<NonNullable<AlertProps["variant"]>, string> = {
  error: "border-error/30 bg-error/10 text-error",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
};

export function Alert({
  className,
  variant = "info",
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed transition duration-200",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

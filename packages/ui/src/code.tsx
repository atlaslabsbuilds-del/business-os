import * as React from "react";
import { cn } from "./utils";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded-lg border border-border bg-elevated px-1.5 py-0.5 font-mono text-[0.8125rem] text-secondary",
        className,
      )}
    >
      {children}
    </code>
  );
}

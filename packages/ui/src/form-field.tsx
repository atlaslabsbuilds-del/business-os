import * as React from "react";
import { Label } from "./label";
import { cn } from "./utils";

export type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function FormField({
  label,
  htmlFor,
  error,
  description,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {description && !error ? (
        <p className="text-xs leading-relaxed text-muted">{description}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

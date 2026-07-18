import * as React from "react";
import { cn } from "./utils";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id ?? props.name;

    return (
      <label
        htmlFor={checkboxId}
        className="inline-flex cursor-pointer items-center gap-2.5 text-sm text-secondary transition duration-200 hover:text-foreground"
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-border bg-elevated text-accent transition duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
          {...props}
        />
        {label ? <span>{label}</span> : null}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

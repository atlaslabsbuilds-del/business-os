"use client";

import * as React from "react";
import { Input, type InputProps } from "./input";
import { cn } from "./utils";

export type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={cn("pr-16", className)}
          {...props}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-1.5 my-auto h-7 rounded-lg px-2.5 text-xs font-medium text-muted transition duration-200 hover:bg-surface hover:text-foreground"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

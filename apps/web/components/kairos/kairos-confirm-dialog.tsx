"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@repo/ui/button";
import { useAppChrome } from "../app/app-chrome-provider";

export function KairosConfirmDialog() {
  const { confirmState, resolveConfirm } = useAppChrome();
  const action = confirmState?.action;
  const open = Boolean(action);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) resolveConfirm(false);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[145] bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="bos-glass-strong bos-noise fixed top-1/2 left-1/2 z-[146] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[22px] p-6 shadow-elevated outline-none max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-warning/15 text-warning">
            {action?.kind === "external" ? (
              <ExternalLink className="h-4 w-4" aria-hidden />
            ) : (
              <AlertTriangle className="h-4 w-4" aria-hidden />
            )}
          </div>
          <DialogPrimitive.Title className="text-base font-semibold tracking-tight">
            {action?.confirmTitle ?? "Confirm action?"}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1.5 text-sm text-secondary">
            {action?.confirmBody ??
              `Kairos is about to run “${action?.label ?? "this action"}”.`}
          </DialogPrimitive.Description>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => resolveConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant={action?.danger ? "danger" : "primary"}
              onClick={() => resolveConfirm(true)}
            >
              {action?.kind === "external" ? "Open Advora" : "Confirm"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

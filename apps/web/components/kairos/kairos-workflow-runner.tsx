"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Button } from "@repo/ui/button";
import {
  getKairosActionById,
  getKairosWorkflow,
  runKairosHandler,
  buildWorkspaceContext,
  type KairosAction,
} from "../../lib/kairos-agent";
import { useAppChrome } from "../app/app-chrome-provider";

export function KairosWorkflowRunner() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    workflowState,
    cancelWorkflow,
    advanceWorkflow,
    setWorkflowStep,
    showActionStatus,
    openQuickCreate,
    requestConfirm,
    startWorkflow,
    pushToast,
    quickCreate,
  } = useAppChrome();

  const workflow = workflowState
    ? getKairosWorkflow(workflowState.workflowId)
    : null;
  const step = workflow?.steps[workflowState?.stepIndex ?? 0];
  const open = Boolean(workflow && step && !quickCreate);

  const progress = useMemo(() => {
    if (!workflow || !workflowState) return 0;
    return Math.round(
      (workflowState.stepIndex / Math.max(workflow.steps.length, 1)) * 100,
    );
  }, [workflow, workflowState]);

  useEffect(() => {
    if (!workflowState || !workflow) return;
    if (workflowState.stepIndex >= workflow.steps.length) {
      pushToast({
        title: "Workflow complete",
        description: workflow.label,
        variant: "success",
      });
      cancelWorkflow();
    }
  }, [workflowState, workflow, cancelWorkflow, pushToast]);

  async function runCurrentStep() {
    if (!workflow || !workflowState || !step) return;
    const base = getKairosActionById(step.actionId);
    if (!base) {
      pushToast({
        title: "Missing step action",
        description: step.actionId,
        variant: "error",
      });
      return;
    }

    const action: KairosAction = {
      ...base,
      draft: {
        ...workflowState.draft,
        ...step.draftFrom,
        ...base.draft,
      },
      requiresConfirmation: base.requiresConfirmation && base.kind === "external",
    };

    const result = await runKairosHandler({
      action,
      workspace: buildWorkspaceContext(pathname),
      navigate: (href) => router.push(href),
      openExternal: (url) => window.location.assign(url),
      showStatus: showActionStatus,
      openQuickCreate: (entity, draft) => {
        openQuickCreate(entity, draft, {
          workflowId: workflow.id,
          stepIndex: workflowState.stepIndex,
        });
      },
      requestConfirm,
      startWorkflow,
    });

    if (result.status === "cancelled") return;

    if (result.status === "create") {
      openQuickCreate(result.entity, result.draft, {
        workflowId: workflow.id,
        stepIndex: workflowState.stepIndex,
      });
      return;
    }

    if (result.status === "ok" || result.status === "search") {
      advanceWorkflow();
    }
  }

  if (!workflow || !workflowState || !step) return null;

  const completed = workflow.steps.slice(0, workflowState.stepIndex);
  const remaining = workflow.steps.slice(workflowState.stepIndex + 1);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) cancelWorkflow();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[146] bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="bos-glass-strong bos-noise fixed top-1/2 left-1/2 z-[147] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[22px] p-6 shadow-elevated outline-none max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-b-none">
          <div className="mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Kairos Workflow
            </p>
            <DialogPrimitive.Title className="mt-1 text-lg font-semibold tracking-tight">
              {workflow.label}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mt-1 text-sm text-secondary">
              {workflow.description}
            </DialogPrimitive.Description>
          </div>

          <div className="mt-5 space-y-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            <ul className="space-y-2">
              {completed.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-border/40 bg-elevated/40 px-3 py-2 text-sm text-muted"
                >
                  <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                  <span className="line-through">{item.label}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-3 text-sm">
                <ChevronRight
                  className="mt-0.5 h-3.5 w-3.5 text-primary"
                  aria-hidden
                />
                <span>
                  <span className="block font-medium text-foreground">
                    {step.label}
                  </span>
                  <span className="block text-xs text-secondary">
                    {step.description}
                  </span>
                </span>
              </li>
              {remaining.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 rounded-xl border border-border/30 px-3 py-2 text-sm text-muted"
                >
                  <span className="h-3.5 w-3.5 rounded-full border border-border/60" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={cancelWorkflow}>
              <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Cancel
            </Button>
            {workflowState.stepIndex > 0 ? (
              <Button
                variant="ghost"
                onClick={() => setWorkflowStep(workflowState.stepIndex - 1)}
              >
                Back
              </Button>
            ) : null}
            <Button onClick={() => void runCurrentStep()}>
              {workflowState.stepIndex === workflow.steps.length - 1
                ? "Finish step"
                : "Run step"}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, PartyPopper, Sparkles } from "lucide-react";
import {
  completeOnboardingStepAction,
  getOnboardingChecklistAction,
} from "../../app/(protected)/actions/platform";
import type { OnboardingStep } from "../../lib/onboarding-checklist";

export function OnboardingChecklist({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [percent, setPercent] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getOnboardingChecklistAction();
      if (!result.ok) return;
      setSteps(result.data.steps);
      setCompleted(result.data.completedSteps);
      setPercent(result.data.percent);
      setCelebrated(Boolean(result.data.celebratedAt) || result.data.percent >= 100);
    });
  }, []);

  function markComplete(stepId: string) {
    startTransition(async () => {
      const result = await completeOnboardingStepAction({ stepId });
      if (!result.ok) return;
      setCompleted((prev) => Array.from(new Set([...prev, stepId])));
      setPercent(result.data.percent);
      if (result.data.percent >= 100) setCelebrated(true);
    });
  }

  if (steps.length === 0) return null;
  if (compact && percent >= 100 && celebrated) return null;

  return (
    <section className="bos-glass-strong bos-gradient-border relative overflow-hidden rounded-[24px] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.14),transparent_50%)]" />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Onboarding
            </p>
            <h3 className="mt-1 text-lg font-semibold">Launch checklist</h3>
            <p className="mt-1 text-sm text-secondary">
              Complete these steps to unlock the full Business OS experience.
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-primary">{percent}%</p>
            <p className="text-[11px] text-muted">complete</p>
          </div>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-elevated">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-amber-300"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        <AnimatePresence>
          {celebrated && percent >= 100 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 rounded-2xl bg-primary/15 px-4 py-3 text-sm"
            >
              <PartyPopper className="h-5 w-5 text-primary" aria-hidden />
              <span>
                Workspace launch complete. Kairos is ready to run with you.
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <ul className={`grid gap-2 ${compact ? "" : "md:grid-cols-2"}`}>
          {steps.map((step) => {
            const done = completed.includes(step.id);
            return (
              <li
                key={step.id}
                className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-elevated/40 px-3 py-3"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                      done ? "bg-primary text-white" : "bg-elevated text-muted"
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="mt-0.5 text-xs text-secondary">{step.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Link
                    href={step.href}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    {step.cta}
                  </Link>
                  {!done ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => markComplete(step.id)}
                      className="text-[11px] text-muted hover:text-foreground"
                    >
                      Mark done
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

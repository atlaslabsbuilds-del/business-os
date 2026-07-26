import { Sparkles } from "lucide-react";
import type { PricingPlan } from "../../lib/pricing";
import { CREDITS_USAGE_HINT, formatPlanCredits } from "../../lib/pricing";

export function PlanCreditsBlock({
  plan,
  highlighted = false,
}: {
  plan: PricingPlan;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`mt-4 rounded-2xl border px-3.5 py-3 ${
        highlighted
          ? "border-primary/35 bg-primary/10"
          : "border-border bg-elevated/60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            highlighted ? "bg-primary/20 text-primary" : "bg-primary/15 text-primary"
          }`}
          aria-hidden
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm font-semibold leading-snug text-foreground">
          {formatPlanCredits(plan)}
        </p>
      </div>
      <p className="mt-2 pl-9 text-[11px] leading-5 text-muted">{CREDITS_USAGE_HINT}</p>
    </div>
  );
}

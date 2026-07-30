"use client";

import { Button } from "@repo/ui/button";
import { FinanceShell } from "../../../components/finance/finance-shell";

export default function FinanceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FinanceShell tab="overview">
      <div className="bos-glass-strong flex min-h-[280px] flex-col items-center justify-center rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">Finance data could not load</p>
        <p className="mt-2 text-sm text-secondary">Retry the module or check the workspace connection.</p>
        <Button className="mt-5" onClick={reset}>Retry</Button>
      </div>
    </FinanceShell>
  );
}

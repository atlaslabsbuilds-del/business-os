"use client";

import { Button } from "@repo/ui/button";
import { CrmShell } from "../../../components/crm/crm-shell";

export default function CrmError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <CrmShell title="CRM" description="Something went wrong loading CRM data.">
      <div className="bos-glass-strong flex min-h-[280px] flex-col items-center justify-center rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">CRM data could not load</p>
        <p className="mt-2 text-sm text-secondary">
          Retry the module or check the workspace connection.
        </p>
        <Button className="mt-5" onClick={reset}>
          Retry
        </Button>
      </div>
    </CrmShell>
  );
}

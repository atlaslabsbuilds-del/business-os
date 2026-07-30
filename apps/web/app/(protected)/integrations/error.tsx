"use client";

import Link from "next/link";
import { Button } from "@repo/ui/button";
import { IntegrationsShell } from "../../../components/integrations/integrations-shell";

export default function IntegrationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <IntegrationsShell title="Integrations" description="Something went wrong loading the hub.">
      <div className="bos-glass-strong flex min-h-[280px] flex-col items-center justify-center rounded-[24px] px-6 py-12 text-center">
        <p className="text-lg font-semibold">Couldn't load integrations</p>
        <p className="mt-2 max-w-md text-sm text-secondary">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Retry</Button>
          <Link
            href="/integrations"
            className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm"
          >
            Reset
          </Link>
        </div>
      </div>
    </IntegrationsShell>
  );
}

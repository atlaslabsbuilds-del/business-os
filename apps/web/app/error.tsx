"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { ErrorShell, RetryIcon } from "../components/marketing/error-shell";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <ErrorShell
        code="500"
        title="Something went wrong"
        body="VanderBase hit an unexpected error. Try again, or return home while we sort it out."
        icon={<AlertTriangle className="h-6 w-6" aria-hidden />}
        primaryHref="/"
        primaryLabel="Return home"
      />
      <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center px-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-sm text-secondary shadow-soft transition hover:text-foreground"
        >
          <RetryIcon />
          Try again
        </button>
      </div>
    </div>
  );
}

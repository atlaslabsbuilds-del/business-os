"use client";

import { Button } from "@repo/ui/button";
import { DocumentsShell } from "../../../components/documents/documents-shell";

export default function DocumentsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <DocumentsShell title="Documents" description="Something went wrong loading documents.">
      <div className="bos-glass-strong flex min-h-[280px] flex-col items-center justify-center rounded-3xl p-8 text-center">
        <p className="text-lg font-semibold">Documents could not load</p>
        <Button className="mt-5" onClick={reset}>
          Retry
        </Button>
      </div>
    </DocumentsShell>
  );
}

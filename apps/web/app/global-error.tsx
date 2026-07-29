"use client";

import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0B0F] text-white antialiased">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#121218] p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
              <AlertTriangle className="h-6 w-6" aria-hidden />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">500</p>
            <h1 className="mt-3 text-2xl font-semibold">VanderBase unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              A critical error interrupted the app. {error.digest ? `Reference: ${error.digest}` : "Please try again."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-orange-400"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

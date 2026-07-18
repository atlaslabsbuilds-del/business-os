import { Suspense } from "react";

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<div className="text-sm text-muted">Loading inbox…</div>}
    >
      {children}
    </Suspense>
  );
}

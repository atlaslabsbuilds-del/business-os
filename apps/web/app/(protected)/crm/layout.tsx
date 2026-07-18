import { Suspense } from "react";

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="text-sm text-muted">Loading CRM…</div>}>{children}</Suspense>;
}

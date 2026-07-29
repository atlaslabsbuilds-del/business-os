import type { Metadata } from "next";
import { Suspense } from "react";
import { ModulePageShell } from "../../../components/app/module-page-shell";
import { BillingClient } from "../../../components/pricing/billing-client";

export const metadata: Metadata = {
  title: "Billing | VanderBase",
  description: "Manage one-time VanderBase purchases, AI credits, and team seats.",
};

export default function BillingPage() {
  return (
    <ModulePageShell
      badge="Billing"
      title="Billing & purchases"
      description="Own VanderBase with a one-time purchase. Buy AI credits and seats only when you need them—never a subscription."
      navItems={[
        { href: "/settings", label: "General" },
        { href: "/billing", label: "Billing" },
        { href: "/credits", label: "AI Credits" },
        { href: "/team", label: "Team" },
      ]}
    >
      <Suspense fallback={<p className="text-sm text-secondary">Loading billing…</p>}>
        <BillingClient />
      </Suspense>
    </ModulePageShell>
  );
}

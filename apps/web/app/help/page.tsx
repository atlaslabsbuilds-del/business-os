import type { Metadata } from "next";
import Link from "next/link";
import { HelpCenterClient } from "../../components/help/help-center-client";
import { MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Help Center",
  description:
    "VanderBase documentation, getting started guides, tutorials, FAQs, videos, release notes, and support resources.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <MarketingShell
      title="Help Center"
      subtitle="Documentation, tutorials, videos, FAQs, and release notes for launching your VanderBase public beta workspace."
    >
      <div className="mb-8 flex flex-wrap gap-2">
        {["Getting Started", "Tutorials", "Videos", "FAQs", "Release Notes"].map(
          (item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-elevated/40 px-3 py-1.5 text-xs text-secondary"
            >
              {item}
            </span>
          ),
        )}
        <Link
          href="/support"
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white"
        >
          Contact support
        </Link>
      </div>
      <HelpCenterClient />
    </MarketingShell>
  );
}

import type { Metadata } from "next";
import { LegalProse, LegalSection, MarketingShell } from "../../components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "VanderBase refund and cancellation policy.",
};

export default function RefundPage() {
  return (
    <MarketingShell
      title="Refund Policy"
      subtitle="Last updated: July 29, 2026. Placeholder policy for pre-launch billing."
    >
      <LegalProse>
        <LegalSection title="1. Pre-launch access">
          <p>
            During waitlist and early access periods, VanderBase may be offered without charge. No
            payment is required to join the waitlist.
          </p>
        </LegalSection>
        <LegalSection title="2. Paid subscriptions">
          <p>
            When paid plans become available, charges will be disclosed at checkout. Unless otherwise
            stated at purchase, monthly subscriptions renew until cancelled, and annual plans are
            billed up front for the term.
          </p>
        </LegalSection>
        <LegalSection title="3. Cancellations">
          <p>
            You may cancel a paid subscription from workspace billing settings (when available).
            Access continues through the end of the paid period.
          </p>
        </LegalSection>
        <LegalSection title="4. Refunds">
          <p>
            Refund eligibility will follow the terms shown at purchase. As a general guideline, we
            aim to resolve billing issues fairly within 14 days of an initial paid charge when a
            material service defect is reported. This section is a placeholder and will be finalized
            before public paid launch.
          </p>
        </LegalSection>
        <LegalSection title="5. Contact">
          <p>
            Billing questions:{" "}
            <a href="mailto:billing@vanderbase.com" className="text-primary hover:underline">
              billing@vanderbase.com
            </a>{" "}
            or{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact
            </a>
            .
          </p>
        </LegalSection>
      </LegalProse>
    </MarketingShell>
  );
}

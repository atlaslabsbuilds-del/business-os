import type { Metadata } from "next";
import { CreditsPurchasePage } from "../../components/pricing/credits-purchase-page";

export const metadata: Metadata = {
  title: "AI Credits | VanderBase",
  description:
    "Buy VanderBase AI credit packs as one-time purchases. From 1,000 to 500,000 credits—no subscriptions.",
};

export default function CreditsRoute() {
  return <CreditsPurchasePage />;
}

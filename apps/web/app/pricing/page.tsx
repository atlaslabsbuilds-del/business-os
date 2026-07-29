import type { Metadata } from "next";
import { PricingPage } from "../../components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | VanderBase",
  description:
    "Own VanderBase with a one-time purchase. Buy AI credits only when you need them. Free, Pro $99 once, credit packs, and enterprise.",
};

export default function PricingRoute() {
  return <PricingPage />;
}

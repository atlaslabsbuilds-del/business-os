import type { Metadata } from "next";
import { PricingPage } from "../../components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | VanderBase",
  description: "Simple, transparent plans for the AI-native VanderBase.",
};

export default function PricingRoute() {
  return <PricingPage />;
}

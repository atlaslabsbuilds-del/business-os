import type { Metadata } from "next";
import { PricingPage } from "../../components/pricing/pricing-page";

export const metadata: Metadata = {
  title: "Pricing | Business OS",
  description: "Simple, transparent plans for the AI-native Business OS.",
};

export default function PricingRoute() {
  return <PricingPage />;
}

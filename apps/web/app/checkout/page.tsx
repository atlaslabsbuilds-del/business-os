import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutPage } from "../../components/pricing/checkout-page";

export const metadata: Metadata = {
  title: "Checkout | VanderBase",
  description: "Complete a one-time VanderBase purchase for Pro, AI credits, or team seats.",
};

export default function CheckoutRoute() {
  return (
    <Suspense
      fallback={
        <div className="bos-atmosphere flex min-h-screen items-center justify-center text-sm text-secondary">
          Preparing checkout…
        </div>
      }
    >
      <CheckoutPage />
    </Suspense>
  );
}

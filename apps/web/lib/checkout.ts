/**
 * One-time payment checkout helpers for VanderBase.
 * Supports Stripe and Razorpay payment intents / orders — never recurring subscriptions.
 */

import {
  ADDITIONAL_TEAM_SEAT,
  AI_CREDIT_PACKS,
  getCreditPackById,
  getPlanById,
  type CreditPack,
  type PricingPlan,
  type TeamSeatProduct,
} from "./pricing";

export type CheckoutProvider = "stripe" | "razorpay";

export type CheckoutProductKind = "plan" | "credit_pack" | "team_seat";

export type CheckoutProduct = {
  kind: CheckoutProductKind;
  id: string;
  name: string;
  /** Amount in USD cents for one-time charge. null = contact sales. */
  amountCents: number | null;
  description: string;
  metadata: Record<string, string | number | boolean>;
};

export type OneTimeCheckoutSessionInput = {
  product: CheckoutProduct;
  provider: CheckoutProvider;
  workspaceId?: string;
  userId?: string;
  successUrl: string;
  cancelUrl: string;
  quantity?: number;
};

export type OneTimeCheckoutSession = {
  mode: "payment";
  provider: CheckoutProvider;
  productId: string;
  productKind: CheckoutProductKind;
  amountCents: number;
  currency: "usd";
  quantity: number;
  successUrl: string;
  cancelUrl: string;
  workspaceId?: string;
  userId?: string;
  metadata: Record<string, string>;
  /** Provider-specific payload ready for Stripe Checkout Session or Razorpay Order. */
  providerPayload: Record<string, unknown>;
};

export function resolveCheckoutProduct(input: {
  product?: string | null;
  pack?: string | null;
  seats?: number | null;
}): CheckoutProduct | null {
  if (input.product === "pro") {
    const plan = getPlanById("pro");
    if (!plan || plan.price === null) return null;
    return planToCheckoutProduct(plan);
  }

  if (input.product === "additional-seat" || input.seats) {
    return seatToCheckoutProduct(ADDITIONAL_TEAM_SEAT, input.seats ?? 1);
  }

  if (input.pack || input.product?.startsWith("credits-")) {
    const pack = getCreditPackById(input.pack ?? input.product ?? "");
    if (!pack) return null;
    return creditPackToCheckoutProduct(pack);
  }

  return null;
}

export function planToCheckoutProduct(plan: PricingPlan): CheckoutProduct | null {
  if (plan.price === null) return null;
  return {
    kind: "plan",
    id: plan.id,
    name: `VanderBase ${plan.name}`,
    amountCents: Math.round(plan.price * 100),
    description: plan.description,
    metadata: {
      planId: plan.id,
      billing: "one_time",
      creditsIncluded: plan.credits ?? 0,
      teamMembers: plan.teamMembers ?? 0,
    },
  };
}

export function creditPackToCheckoutProduct(pack: CreditPack): CheckoutProduct | null {
  if (pack.contactSales || pack.price === null) return null;
  return {
    kind: "credit_pack",
    id: pack.id,
    name: `AI Credits — ${pack.label}`,
    amountCents: Math.round(pack.price * 100),
    description: `${pack.credits?.toLocaleString() ?? "Custom"} AI credits (one-time)`,
    metadata: {
      packId: pack.id,
      credits: pack.credits ?? 0,
      billing: "one_time",
    },
  };
}

export function seatToCheckoutProduct(
  seat: TeamSeatProduct = ADDITIONAL_TEAM_SEAT,
  quantity = 1,
): CheckoutProduct {
  const qty = Math.max(1, Math.floor(quantity));
  return {
    kind: "team_seat",
    id: seat.id,
    name: qty === 1 ? seat.name : `${seat.name} × ${qty}`,
    amountCents: Math.round(seat.price * 100) * qty,
    description: seat.description,
    metadata: {
      productId: seat.id,
      quantity: qty,
      unitPrice: seat.price,
      billing: "one_time",
    },
  };
}

/**
 * Build a one-time (non-recurring) checkout session for Stripe or Razorpay.
 * Explicitly sets mode/payment type so providers never create subscriptions.
 */
export function createOneTimeCheckoutSession(
  input: OneTimeCheckoutSessionInput,
): OneTimeCheckoutSession {
  if (input.product.amountCents === null || input.product.amountCents <= 0) {
    throw new Error("Product requires contact sales or is not purchasable.");
  }

  const quantity = Math.max(1, input.quantity ?? 1);
  const unitAmountCents =
    input.product.kind === "team_seat"
      ? Math.round(ADDITIONAL_TEAM_SEAT.price * 100)
      : input.product.amountCents;
  const lineQuantity =
    input.product.kind === "team_seat"
      ? Number(input.product.metadata.quantity ?? quantity)
      : quantity;
  const amountCents = unitAmountCents * lineQuantity;

  const metadata: Record<string, string> = {
    billing: "one_time",
    productKind: input.product.kind,
    productId: input.product.id,
    workspaceId: input.workspaceId ?? "",
    userId: input.userId ?? "",
  };

  for (const [key, value] of Object.entries(input.product.metadata)) {
    metadata[key] = String(value);
  }

  const providerPayload =
    input.provider === "stripe"
      ? {
          // Stripe Checkout Session — payment mode only (never "subscription")
          mode: "payment" as const,
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: unitAmountCents,
                product_data: {
                  name: input.product.name,
                  description: input.product.description,
                  metadata,
                },
              },
              quantity: lineQuantity,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          metadata,
        }
      : {
          // Razorpay Order — one-time payment only (no subscription/plan_id)
          amount: amountCents,
          currency: "USD",
          receipt: `vb_${input.product.id}_${Date.now()}`,
          notes: metadata,
          payment: {
            capture: true,
          },
        };

  return {
    mode: "payment",
    provider: input.provider,
    productId: input.product.id,
    productKind: input.product.kind,
    amountCents,
    currency: "usd",
    quantity,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    workspaceId: input.workspaceId,
    userId: input.userId,
    metadata,
    providerPayload,
  };
}

export function listPurchasableCreditPacks(): CreditPack[] {
  return AI_CREDIT_PACKS.filter((pack) => !pack.contactSales && pack.price !== null);
}

export function formatUsdFromCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

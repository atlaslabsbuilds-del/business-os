/**
 * VanderBase pricing — one-time ownership model.
 * No monthly/yearly subscriptions. Buy Pro once; buy AI credits when needed.
 */

export type PricingPlanId = "free" | "pro" | "enterprise";

export type PricingPlan = {
  id: PricingPlanId;
  name: string;
  description: string;
  /** One-time price in USD. null = custom / contact sales. */
  price: number | null;
  /** Billing cadence label shown in UI. */
  billingLabel: "Free forever" | "One-time purchase" | "Custom pricing";
  credits: number | null;
  teamMembers: number | null;
  workspaces: number | null;
  features: string[];
  popular?: boolean;
  cta: string;
  ctaHref: string;
};

export type CreditPack = {
  id: string;
  credits: number | null;
  price: number | null;
  label: string;
  popular?: boolean;
  contactSales?: boolean;
};

export type TeamSeatProduct = {
  id: "additional-seat";
  name: string;
  price: number;
  billingLabel: "One-time purchase";
  description: string;
};

export const PRICING_TAGLINE =
  "Own VanderBase with a one-time purchase. Buy AI credits only when you need them.";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Start with the essentials—no card required.",
    price: 0,
    billingLabel: "Free forever",
    credits: 100,
    teamMembers: 3,
    workspaces: 1,
    features: [
      "1 Workspace",
      "Up to 3 Team Members",
      "100 AI Credits",
      "Basic Business OS Features",
    ],
    cta: "Get started free",
    ctaHref: "/?join=waitlist",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Own the full Business OS with a single purchase.",
    price: 99,
    billingLabel: "One-time purchase",
    credits: 1000,
    teamMembers: 10,
    workspaces: 1,
    popular: true,
    features: [
      "1 Workspace",
      "Up to 10 Team Members",
      "All Business OS Modules",
      "Advanced AI Features",
      "Priority Support",
      "1,000 AI Credits Included",
    ],
    cta: "Buy Pro — $99",
    ctaHref: "/checkout?product=pro",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Security, scale, and support shaped around your org.",
    price: null,
    billingLabel: "Custom pricing",
    credits: null,
    teamMembers: null,
    workspaces: null,
    features: [
      "Custom Pricing",
      "SSO",
      "Dedicated Support",
      "Custom Integrations",
      "SLA",
    ],
    cta: "Contact sales",
    ctaHref: "mailto:sales@vanderbase.com",
  },
];

export const ADDITIONAL_TEAM_SEAT: TeamSeatProduct = {
  id: "additional-seat",
  name: "Additional Team Member",
  price: 25,
  billingLabel: "One-time purchase",
  description:
    "Expand beyond your plan’s included seats. Each additional member is a one-time purchase.",
};

export const AI_CREDIT_PACKS: CreditPack[] = [
  {
    id: "credits-1k",
    credits: 1_000,
    price: 9,
    label: "1,000 Credits",
  },
  {
    id: "credits-5k",
    credits: 5_000,
    price: 29,
    label: "5,000 Credits",
    popular: true,
  },
  {
    id: "credits-10k",
    credits: 10_000,
    price: 49,
    label: "10,000 Credits",
  },
  {
    id: "credits-25k",
    credits: 25_000,
    price: 99,
    label: "25,000 Credits",
  },
  {
    id: "credits-50k",
    credits: 50_000,
    price: 179,
    label: "50,000 Credits",
  },
  {
    id: "credits-100k",
    credits: 100_000,
    price: 299,
    label: "100,000 Credits",
  },
  {
    id: "credits-250k",
    credits: 250_000,
    price: 599,
    label: "250,000 Credits",
  },
  {
    id: "credits-500k",
    credits: 500_000,
    price: null,
    label: "500,000 Credits",
    contactSales: true,
  },
];

export const COMPARISON_ROWS: string[][] = [
  ["Price", "$0", "$99 once", "Custom"],
  ["Billing", "Free forever", "One-time purchase", "Custom"],
  ["Workspaces", "1", "1", "Custom"],
  ["Team members", "Up to 3", "Up to 10", "Custom"],
  ["AI credits included", "100", "1,000", "Custom"],
  ["Business OS modules", "Basic", "All modules", "All + custom"],
  ["Advanced AI", "—", "Included", "Included"],
  ["Priority support", "—", "Included", "Dedicated"],
  ["SSO", "—", "—", "Included"],
  ["Custom integrations", "—", "—", "Included"],
  ["SLA", "—", "—", "Included"],
];

export const CREDITS_USAGE_HINT =
  "Shared across chat, inbox, content, agents, and automations. Buy more packs anytime—never a subscription.";

export function formatPlanPrice(plan: PricingPlan): string {
  if (plan.price === null) return "Custom";
  if (plan.price === 0) return "$0";
  return `$${plan.price}`;
}

export function formatPlanCredits(plan: PricingPlan): string {
  if (plan.credits === null) return "Custom AI Credits";
  return `${plan.credits.toLocaleString()} AI Credits included`;
}

export function formatCreditPackPrice(pack: CreditPack): string {
  if (pack.contactSales || pack.price === null) return "Contact Sales";
  return `$${pack.price}`;
}

export function getPlanById(id: PricingPlanId): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function getCreditPackById(id: string): CreditPack | undefined {
  return AI_CREDIT_PACKS.find((pack) => pack.id === id);
}

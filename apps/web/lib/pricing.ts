export type PricingPlan = {
  id: "free" | "starter" | "builder" | "pro" | "elite" | "enterprise";
  name: string;
  description: string;
  monthly: number | null;
  credits: number | null;
  features: string[];
  popular?: boolean;
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "A focused start for solo operators.",
    monthly: 0,
    credits: 25,
    features: ["1 Workspace", "25 AI Credits/month", "Basic CRM", "Basic AI Inbox", "Basic Content OS", "Community Support"],
  },
  {
    id: "starter",
    name: "Starter",
    description: "The essential operating system for one person.",
    monthly: 20,
    credits: 100,
    features: ["Everything in Free", "1 User", "CRM", "AI Inbox", "Content OS", "Social OS", "Calendar OS", "Email Support"],
  },
  {
    id: "builder",
    name: "Builder",
    description: "Build the full engine behind your growth.",
    monthly: 40,
    credits: 250,
    popular: true,
    features: ["Everything in Starter", "Website OS", "Lead Generation OS", "Client Portal", "Finance OS", "Email Marketing", "Advanced Analytics", "Priority Support"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Automate more of the work that moves you forward.",
    monthly: 80,
    credits: 500,
    features: ["Everything in Builder", "AI Studio", "Advanced AI Agents", "Workflow Automations", "API Access", "Team Collaboration", "Advanced Reports", "Priority AI Processing"],
  },
  {
    id: "elite",
    name: "Elite",
    description: "Serious infrastructure for ambitious teams.",
    monthly: 180,
    credits: 1300,
    features: ["Everything in Pro", "Up to 10 Team Members", "Unlimited Workspaces", "Roles & Permissions", "Audit Logs", "Premium Support", "Early Access Features"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "A secure operating layer shaped around your business.",
    monthly: null,
    credits: null,
    features: ["Contact Sales", "Custom AI Credits", "Unlimited Users", "SSO/SAML", "Dedicated Infrastructure", "White Label", "Custom Integrations", "Dedicated Success Manager", "SLA Support"],
  },
];

export const COMPARISON_ROWS = [
  ["AI Credits / month", "25", "100", "250", "500", "1,300", "Custom"],
  ["Workspaces", "1", "1", "1", "1", "Unlimited", "Unlimited"],
  ["CRM + AI Inbox", "Basic", "Included", "Included", "Included", "Included", "Included"],
  ["Content + Social OS", "Basic", "Included", "Included", "Included", "Included", "Included"],
  ["Website + Lead Generation", "—", "—", "Included", "Included", "Included", "Included"],
  ["AI Studio + Agents", "—", "—", "—", "Included", "Included", "Included"],
  ["Team collaboration", "—", "—", "—", "Included", "10 members", "Unlimited"],
  ["API access", "—", "—", "—", "Included", "Included", "Custom"],
  ["Support", "Community", "Email", "Priority", "Priority", "Premium", "Dedicated"],
];

export const CREDITS_USAGE_HINT =
  "Shared across chat, inbox, content, agents, and automations.";

export function formatPlanCredits(plan: PricingPlan): string {
  if (plan.credits === null) return "Custom AI Credits";
  return `${plan.credits.toLocaleString()} AI Credits/month`;
}

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "connect_gmail",
    title: "Connect Gmail",
    description: "Sync your inbox so Kairos can summarize and reply.",
    href: "/inbox/accounts",
    cta: "Connect",
  },
  {
    id: "connect_calendar",
    title: "Connect Calendar",
    description: "Bring meetings and booking into Calendar OS.",
    href: "/calendar",
    cta: "Open calendar",
  },
  {
    id: "invite_team",
    title: "Invite Team",
    description: "Add teammates so work stays shared.",
    href: "/team",
    cta: "Invite",
  },
  {
    id: "import_contacts",
    title: "Import Contacts",
    description: "Seed CRM with your first contacts or leads.",
    href: "/crm/contacts",
    cta: "Open CRM",
  },
  {
    id: "create_workflow",
    title: "Create first workflow",
    description: "Ask Operations Agent to design a repeatable process.",
    href: "/ai/agents?agent=operations",
    cta: "Create",
  },
  {
    id: "generate_content",
    title: "Generate first content",
    description: "Draft your first post with Content Agent.",
    href: "/content",
    cta: "Generate",
  },
  {
    id: "install_integrations",
    title: "Install integrations",
    description: "Connect tools from Settings and Inbox accounts.",
    href: "/settings",
    cta: "Explore",
  },
  {
    id: "complete_profile",
    title: "Complete profile",
    description: "Set workspace name, brand voice, and team preferences.",
    href: "/settings",
    cta: "Complete",
  },
];

export function onboardingProgressPercent(completed: string[]): number {
  if (ONBOARDING_STEPS.length === 0) return 0;
  const unique = new Set(
    completed.filter((id) => ONBOARDING_STEPS.some((step) => step.id === id)),
  );
  return Math.round((unique.size / ONBOARDING_STEPS.length) * 100);
}

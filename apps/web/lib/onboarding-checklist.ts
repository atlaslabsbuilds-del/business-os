export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "create_workspace",
    title: "First workspace setup",
    description: "Confirm workspace name, brand, and ownership.",
    href: "/settings",
    cta: "Open settings",
  },
  {
    id: "invite_team",
    title: "Invite team",
    description: "Add teammates so work stays shared.",
    href: "/team",
    cta: "Invite",
  },
  {
    id: "install_integrations",
    title: "Connect integrations",
    description: "Link Gmail, calendar, and other tools from Integrations.",
    href: "/integrations",
    cta: "Connect",
  },
  {
    id: "create_first_project",
    title: "Create first project",
    description: "Spin up a project so delivery tracking can begin.",
    href: "/projects",
    cta: "Create project",
  },
  {
    id: "create_first_document",
    title: "Create first document",
    description: "Capture knowledge in Documents or Knowledge Base.",
    href: "/documents",
    cta: "New document",
  },
  {
    id: "first_ai_chat",
    title: "First AI chat",
    description: "Ask Kairos to summarize activity or optimize your workspace.",
    href: "/chat",
    cta: "Chat with Kairos",
  },
  {
    id: "review_notifications",
    title: "Configure notifications",
    description: "Set channels, quiet hours, and priority rules.",
    href: "/notifications/preferences",
    cta: "Preferences",
  },
  {
    id: "review_security",
    title: "Review security",
    description: "Check sessions, API keys, and MFA-ready controls.",
    href: "/settings/security",
    cta: "Security",
  },
];

export function onboardingProgressPercent(completed: string[]): number {
  if (ONBOARDING_STEPS.length === 0) return 0;
  const unique = new Set(
    completed.filter((id) => ONBOARDING_STEPS.some((step) => step.id === id)),
  );
  return Math.round((unique.size / ONBOARDING_STEPS.length) * 100);
}

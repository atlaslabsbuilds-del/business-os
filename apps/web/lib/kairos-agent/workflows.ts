import type { KairosWorkflow } from "./types";

export const KAIROS_WORKFLOWS: KairosWorkflow[] = [
  {
    id: "onboard-lead",
    label: "Onboard Lead",
    description: "Customer → Deal → Follow-up task",
    confirmation: "Starting lead onboarding...",
    requiresConfirmation: true,
    keywords: ["onboard lead", "new lead", "lead workflow"],
    steps: [
      {
        id: "customer",
        label: "Create customer",
        description: "Capture the contact",
        actionId: "create-customer",
      },
      {
        id: "deal",
        label: "Create deal",
        description: "Add pipeline opportunity",
        actionId: "create-deal",
      },
      {
        id: "task",
        label: "Create follow-up",
        description: "Schedule next step",
        actionId: "create-task",
        draftFrom: { title: "Follow up with new lead" },
      },
    ],
  },
  {
    id: "daily-pulse",
    label: "Daily Pulse",
    description: "Revenue → Signups → Inbox",
    confirmation: "Running daily pulse...",
    keywords: ["daily pulse", "daily review"],
    steps: [
      {
        id: "revenue",
        label: "Today's revenue",
        description: "Open analytics focus",
        actionId: "today-revenue",
      },
      {
        id: "signups",
        label: "Today's signups",
        description: "Review new customers",
        actionId: "today-signups",
      },
      {
        id: "inbox",
        label: "Check inbox",
        description: "Clear unread threads",
        actionId: "open-inbox",
      },
    ],
  },
];

export function getKairosWorkflow(id: string): KairosWorkflow | undefined {
  return KAIROS_WORKFLOWS.find((workflow) => workflow.id === id);
}

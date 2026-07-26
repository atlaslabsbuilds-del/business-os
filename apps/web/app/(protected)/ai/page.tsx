import { CommandCenterShell } from "../../../components/ai/command-center-shell";
import { KairosSuggestions } from "../../../components/ai/kairos-suggestions";
import { OnboardingChecklist } from "../../../components/ai/onboarding-checklist";

export const dynamic = "force-dynamic";

export default function AiCommandPage() {
  return (
    <div className="space-y-6">
      <CommandCenterShell />
      <KairosSuggestions />
      <OnboardingChecklist compact />
    </div>
  );
}

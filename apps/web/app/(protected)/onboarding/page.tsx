import { getWorkspaceBetaLaunchProfile } from "@repo/database/beta-launch";
import { CreateWorkspaceForm } from "../../../components/workspace/create-workspace-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { WelcomeWizard } from "../../../components/onboarding/welcome-wizard";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const context = await resolveActiveWorkspace();
  if (context) {
    const profile = await getWorkspaceBetaLaunchProfile({
      workspaceId: context.active.workspace.id,
    });
    return (
      <div className="bos-atmosphere min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <WelcomeWizard
          initialProfile={profile}
          workspaceName={context.active.workspace.name}
        />
      </div>
    );
  }

  return (
    <div className="bos-atmosphere flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl" elevated>
        <CardHeader className="mb-6">
          <p className="text-xs uppercase tracking-[0.14em] text-primary">
            Public Beta Onboarding
          </p>
          <CardTitle className="text-xl">Create your VanderBase workspace</CardTitle>
          <CardDescription>
            Set up a workspace, pick a template, invite your team, generate demo
            data, and talk to Kairos.
          </CardDescription>
        </CardHeader>
        <CreateWorkspaceForm />
      </Card>
    </div>
  );
}

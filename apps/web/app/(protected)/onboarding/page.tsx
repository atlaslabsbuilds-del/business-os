import { CreateWorkspaceForm } from "../../../components/workspace/create-workspace-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

export default function OnboardingPage() {
  return (
    <div className="bos-atmosphere flex min-h-screen items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md" elevated>
        <CardHeader className="mb-6">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Onboarding</p>
          <CardTitle className="text-xl">Create your workspace</CardTitle>
          <CardDescription>
            One workspace per account. You’ll be assigned the owner role.
          </CardDescription>
        </CardHeader>
        <CreateWorkspaceForm />
      </Card>
    </div>
  );
}

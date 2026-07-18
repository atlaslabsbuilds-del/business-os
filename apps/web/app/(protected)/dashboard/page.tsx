import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "@repo/database/workspace";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, email, memberships } = context;
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(active.workspace.id),
    listWorkspaceInvitations(active.workspace.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="space-y-2">
        <Badge variant="accent">Workspace</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {active.workspace.name}
        </h1>
        <p className="text-sm text-secondary">
          Signed in as <span className="text-foreground">{email ?? "unknown"}</span>
          {" · "}
          Role <span className="capitalize text-foreground">{active.role}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Foundation</CardTitle>
            <CardDescription>
              Multi-tenant workspace shell is ready. CRM and AI modules come next.
            </CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold tracking-tight text-foreground">Live</p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              Team size for the active workspace. Manage people on Team.
            </CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold tracking-tight text-secondary">
            {members.length}
          </p>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>
              Switch between workspaces you belong to from the sidebar.
            </CardDescription>
          </CardHeader>
          <p className="text-3xl font-semibold tracking-tight text-secondary">
            {memberships.length}
          </p>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>
              {invitations.filter((item) => item.status === "pending").length} waiting ·
              email delivery not wired yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

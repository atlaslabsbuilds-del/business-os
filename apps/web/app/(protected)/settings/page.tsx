import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "@repo/database/workspace";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { Separator } from "@repo/ui/separator";
import { SettingsNav } from "../../../components/app/settings-nav";
import { DeleteWorkspaceForm } from "../../../components/workspace/delete-workspace-form";
import { TransferOwnershipForm } from "../../../components/workspace/transfer-ownership-form";
import { WorkspaceSettingsForm } from "../../../components/workspace/workspace-settings-form";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, userId } = context;
  const isOwner = active.role === "owner";
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(active.workspace.id),
    listWorkspaceInvitations(active.workspace.id),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="mb-4 space-y-2 lg:sticky lg:top-20">
          <Badge variant="accent">Settings</Badge>
          <p className="text-sm text-secondary">Workspace, billing, and security</p>
        </div>
        <SettingsNav />
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="bos-gradient-border bos-glass-strong bos-noise rounded-[24px] p-6 pbos-animate-rise">
          <h1 className="text-2xl font-semibold tracking-tight">Workspace settings</h1>
          <p className="mt-2 text-sm text-secondary">
            Configure{" "}
            <span className="text-foreground">{active.workspace.name}</span>
            {" · "}
            <span className="capitalize">{active.role}</span>
          </p>
        </div>

        <Card elevated className="pbos-animate-rise">
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Name, slug, and logo for this workspace.</CardDescription>
          </CardHeader>
          <div className="mb-5 flex items-center gap-3">
            {active.workspace.logoUrl ? (
              <div
                className="h-12 w-12 rounded-xl border border-border bg-cover bg-center"
                style={{ backgroundImage: `url(${active.workspace.logoUrl})` }}
                role="img"
                aria-label={`${active.workspace.name} logo`}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-elevated text-sm font-semibold text-secondary">
                {active.workspace.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{active.workspace.name}</p>
              <p className="truncate text-xs text-muted">/{active.workspace.slug}</p>
            </div>
          </div>
          <WorkspaceSettingsForm
            workspaceId={active.workspace.id}
            name={active.workspace.name}
            slug={active.workspace.slug}
            logoUrl={active.workspace.logoUrl}
            canEdit={isOwner}
          />
        </Card>

        <Card className="pbos-animate-rise">
          <CardHeader>
            <CardTitle>Invitations</CardTitle>
            <CardDescription>
              {invitations.filter((i) => i.status === "pending").length} pending · manage invites
              from Team.
            </CardDescription>
          </CardHeader>
        </Card>

        {isOwner ? (
          <>
            <Card elevated className="pbos-animate-rise">
              <CardHeader>
                <CardTitle>Transfer ownership</CardTitle>
                <CardDescription>
                  Pass owner role to another member. You become an admin.
                </CardDescription>
              </CardHeader>
              <TransferOwnershipForm
                workspaceId={active.workspace.id}
                members={members}
                currentUserId={userId}
              />
            </Card>

            <Card className="border-error/30 pbos-animate-rise">
              <CardHeader>
                <CardTitle className="text-error">Danger zone</CardTitle>
                <CardDescription>
                  Permanently delete this workspace and all memberships.
                </CardDescription>
              </CardHeader>
              <Separator className="mb-4" />
              <DeleteWorkspaceForm
                workspaceId={active.workspace.id}
                workspaceName={active.workspace.name}
              />
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}

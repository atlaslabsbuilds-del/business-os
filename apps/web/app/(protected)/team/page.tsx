import {
  listWorkspaceInvitations,
  listWorkspaceMembers,
} from "@repo/database/workspace";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { InviteMemberModal } from "../../../components/workspace/invite-member-modal";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

function roleBadgeVariant(role: string): "accent" | "info" | "default" {
  if (role === "owner") return "accent";
  if (role === "admin") return "info";
  return "default";
}

export default async function TeamPage() {
  const context = await resolveActiveWorkspace();
  if (!context) {
    return null;
  }

  const { active, userId } = context;
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(active.workspace.id),
    listWorkspaceInvitations(active.workspace.id),
  ]);

  const canInvite = active.role === "owner" || active.role === "admin";
  const pending = invitations.filter((item) => item.status === "pending");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="accent">Team</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-secondary">
            Everyone with access to{" "}
            <span className="text-foreground">{active.workspace.name}</span>.
          </p>
        </div>
        <InviteMemberModal
          workspaceId={active.workspace.id}
          canInvite={canInvite}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workspace members</CardTitle>
          <CardDescription>
            Roles: owner, admin, member. {members.length} total.
          </CardDescription>
        </CardHeader>
        <ul className="divide-y divide-border">
          {members.map((member) => {
            const isYou = member.userId === userId;
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-xs font-semibold text-secondary">
                    {(member.fullName || member.email || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {member.fullName || member.email || "Unknown user"}
                      {isYou ? (
                        <span className="ml-2 text-xs font-normal text-muted">you</span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {member.email ?? member.userId}
                    </p>
                  </div>
                </div>
                <Badge variant={roleBadgeVariant(member.role)} className="capitalize">
                  {member.role}
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending invitations</CardTitle>
          <CardDescription>
            Email invitations waiting to be accepted.
          </CardDescription>
        </CardHeader>
        <ul className="divide-y divide-border">
          {pending.length === 0 ? (
            <li className="py-3 text-sm text-muted">No pending invitations.</li>
          ) : (
            pending.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted capitalize">{invite.role}</p>
                </div>
                <Badge variant="warning">{invite.status}</Badge>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

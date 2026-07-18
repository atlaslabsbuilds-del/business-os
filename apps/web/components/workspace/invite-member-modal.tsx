"use client";

import { useActionState, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/dialog";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  inviteMemberAction,
  type ActionResult,
} from "../../app/(protected)/actions/workspace";

const initialState: ActionResult | null = null;

export function InviteMemberModal({
  workspaceId,
  canInvite,
}: {
  workspaceId: string;
  canInvite: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    inviteMemberAction,
    initialState,
  );

  useEffect(() => {
    if (state?.ok) {
      setOpen(false);
    }
  }, [state]);

  if (!canInvite) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an email invitation to join this workspace. Delivery comes next —
            this creates a pending invitation.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {state && !state.ok ? <Alert variant="error">{state.error}</Alert> : null}
          {state?.ok && state.message ? (
            <Alert variant="success">{state.message}</Alert>
          ) : null}
          <FormField label="Email" htmlFor="invite-email">
            <Input
              id="invite-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              required
            />
          </FormField>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              name="role"
              defaultValue="member"
              className="flex h-10 w-full rounded-xl border border-border bg-elevated px-3.5 text-sm text-foreground shadow-soft transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit" loading={pending} className="w-full sm:w-auto">
              Create invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

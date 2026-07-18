"use client";

import { useActionState } from "react";
import type { WorkspaceMemberWithProfile } from "@repo/types";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Label } from "@repo/ui/label";
import {
  transferOwnershipAction,
  type ActionResult,
} from "../../app/(protected)/actions/workspace";

const initialState: ActionResult | null = null;

export function TransferOwnershipForm({
  workspaceId,
  members,
  currentUserId,
}: {
  workspaceId: string;
  members: WorkspaceMemberWithProfile[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState(
    transferOwnershipAction,
    initialState,
  );

  const candidates = members.filter(
    (member) => member.userId !== currentUserId && member.role !== "owner",
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {state && !state.ok ? <Alert variant="error">{state.error}</Alert> : null}
      <FormField
        label="New owner"
        htmlFor="new-owner"
        description="You will become an admin. The new owner must not already own another workspace."
      >
        <select
          id="new-owner"
          name="newOwnerUserId"
          required
          disabled={candidates.length === 0}
          className="flex h-10 w-full rounded-xl border border-border bg-elevated px-3.5 text-sm text-foreground shadow-soft transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
          defaultValue=""
        >
          <option value="" disabled>
            {candidates.length === 0 ? "No eligible members" : "Select a member"}
          </option>
          {candidates.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName || member.email || member.userId} ({member.role})
            </option>
          ))}
        </select>
      </FormField>
      <Button
        type="submit"
        variant="secondary"
        loading={pending}
        disabled={candidates.length === 0}
        className="w-fit"
      >
        Transfer ownership
      </Button>
      <Label className="text-xs text-muted">
        This cannot be undone without another transfer.
      </Label>
    </form>
  );
}

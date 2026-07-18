"use client";

import { useActionState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import {
  deleteWorkspaceAction,
  type ActionResult,
} from "../../app/(protected)/actions/workspace";

const initialState: ActionResult | null = null;

export function DeleteWorkspaceForm({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string;
  workspaceName: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteWorkspaceAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="expectedName" value={workspaceName} />
      {state && !state.ok ? <Alert variant="error">{state.error}</Alert> : null}
      <FormField
        label="Confirm deletion"
        htmlFor="confirm-name"
        description={`Type “${workspaceName}” to permanently delete this workspace.`}
      >
        <Input
          id="confirm-name"
          name="confirmName"
          placeholder={workspaceName}
          required
          autoComplete="off"
        />
      </FormField>
      <Button type="submit" variant="danger" loading={pending} className="w-fit">
        Delete workspace
      </Button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import {
  createWorkspaceAction,
  type ActionResult,
} from "../../app/(protected)/actions/workspace";

const initialState: ActionResult | null = null;

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(
    createWorkspaceAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      {state && !state.ok ? <Alert variant="error">{state.error}</Alert> : null}
      <FormField
        label="Workspace name"
        htmlFor="workspace-name"
        description="You can create one workspace. You’ll be the owner."
      >
        <Input
          id="workspace-name"
          name="name"
          placeholder="Acme Inc"
          required
          minLength={2}
          maxLength={60}
          autoFocus
        />
      </FormField>
      <Button type="submit" loading={pending} className="w-full">
        Create workspace
      </Button>
    </form>
  );
}

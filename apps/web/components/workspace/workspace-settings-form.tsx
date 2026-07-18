"use client";

import { useActionState } from "react";
import { Alert } from "@repo/ui/alert";
import { Button } from "@repo/ui/button";
import { FormField } from "@repo/ui/form-field";
import { Input } from "@repo/ui/input";
import {
  updateWorkspaceAction,
  type ActionResult,
} from "../../app/(protected)/actions/workspace";

const initialState: ActionResult | null = null;

export function WorkspaceSettingsForm({
  workspaceId,
  name,
  slug,
  logoUrl,
  canEdit,
}: {
  workspaceId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  canEdit: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateWorkspaceAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      {state && !state.ok ? <Alert variant="error">{state.error}</Alert> : null}
      {state?.ok && state.message ? (
        <Alert variant="success">{state.message}</Alert>
      ) : null}
      <FormField label="Name" htmlFor="workspace-name">
        <Input
          id="workspace-name"
          name="name"
          defaultValue={name}
          required
          disabled={!canEdit}
          minLength={2}
          maxLength={60}
        />
      </FormField>
      <FormField
        label="Slug"
        htmlFor="workspace-slug"
        description="Used in URLs. Lowercase letters, numbers, and hyphens only."
      >
        <Input
          id="workspace-slug"
          name="slug"
          defaultValue={slug}
          required
          disabled={!canEdit}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        />
      </FormField>
      <FormField
        label="Logo URL"
        htmlFor="workspace-logo"
        description="Optional image URL. File uploads come later."
      >
        <Input
          id="workspace-logo"
          name="logoUrl"
          type="url"
          placeholder="https://"
          defaultValue={logoUrl ?? ""}
          disabled={!canEdit}
        />
      </FormField>
      {canEdit ? (
        <Button type="submit" loading={pending} className="w-fit">
          Save changes
        </Button>
      ) : (
        <p className="text-xs text-muted">Only the owner can edit these settings.</p>
      )}
    </form>
  );
}

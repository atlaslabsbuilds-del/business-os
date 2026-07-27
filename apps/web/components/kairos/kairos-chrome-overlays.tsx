"use client";

import { useAppChrome } from "../app/app-chrome-provider";
import { KairosActionStatus } from "./kairos-action-status";
import { KairosConfirmDialog } from "./kairos-confirm-dialog";
import { KairosQuickCreateModal } from "./kairos-quick-create-modal";
import { KairosWorkflowRunner } from "./kairos-workflow-runner";
import { KairosWorkspaceObserver } from "./kairos-workspace-observer";

/** Renders Kairos overlays that depend on AppChrome context. */
export function KairosChromeOverlays() {
  const { actionStatus } = useAppChrome();
  return (
    <>
      <KairosActionStatus message={actionStatus} open={Boolean(actionStatus)} />
      <KairosWorkspaceObserver />
      <KairosConfirmDialog />
      <KairosWorkflowRunner />
      <KairosQuickCreateModal />
    </>
  );
}

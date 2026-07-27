"use client";

import { useAppChrome } from "../app/app-chrome-provider";
import { KairosActionStatus } from "./kairos-action-status";
import { KairosQuickCreateModal } from "./kairos-quick-create-modal";

/** Renders Kairos overlays that depend on AppChrome context. */
export function KairosChromeOverlays() {
  const { actionStatus } = useAppChrome();
  return (
    <>
      <KairosActionStatus message={actionStatus} open={Boolean(actionStatus)} />
      <KairosQuickCreateModal />
    </>
  );
}

"use server";

export type { IntegrationActionResult } from "../../../lib/integrations-hub/integrations-action-types";

export async function listIntegrationsHubAction(input?: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.listIntegrationsHub(input);
}

export async function getIntegrationDetailAction(input: { provider: string }) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.getIntegrationDetail(input);
}

export async function startIntegrationOAuthAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.startIntegrationOAuth(input);
}

export async function disconnectIntegrationAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.disconnectIntegration(input);
}

export async function deleteIntegrationConnectionAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.deleteIntegrationConnection(input);
}

export async function updateIntegrationSettingsAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.updateIntegrationSettings(input);
}

export async function manualSyncIntegrationAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.manualSyncIntegration(input);
}

export async function refreshIntegrationTokenAction(input: unknown) {
  const mod = await import("../../../lib/integrations-hub/integrations-actions.server");
  return mod.refreshIntegrationToken(input);
}

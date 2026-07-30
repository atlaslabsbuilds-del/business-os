import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import type {
  IntegrationConnectionStatus,
  IntegrationHubCategory,
} from "@repo/types";
import {
  integrationConnectionStatusSchema,
  integrationHubCategorySchema,
} from "@repo/types";
import { IntegrationsHubClient } from "../../../components/integrations/integrations-hub-client";
import { IntegrationsHubSkeleton } from "../../../components/integrations/integration-skeletons";
import { IntegrationsShell } from "../../../components/integrations/integrations-shell";
import { ensureIntegrationProvidersRegistered } from "../../../lib/integrations-hub/providers";
import { buildIntegrationHubCards } from "../../../lib/integrations-hub/service";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Integrations" };

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");

  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const categoryRaw =
    typeof params.category === "string" ? params.category : "featured";
  const statusRaw = typeof params.status === "string" ? params.status : undefined;
  const errorMessage =
    typeof params.error === "string" ? params.error : null;

  const categoryParsed = integrationHubCategorySchema.safeParse(categoryRaw);
  const statusParsed = statusRaw
    ? integrationConnectionStatusSchema.safeParse(statusRaw)
    : null;

  const category = (categoryParsed.success
    ? categoryParsed.data
    : "featured") as IntegrationHubCategory;
  const status = (statusParsed?.success
    ? statusParsed.data
    : undefined) as IntegrationConnectionStatus | undefined;

  ensureIntegrationProvidersRegistered();
  const { cards, connectedCount } = await buildIntegrationHubCards({
    workspaceId: context.active.workspace.id,
    query,
    category,
    status,
  });

  return (
    <IntegrationsShell>
      <Suspense fallback={<IntegrationsHubSkeleton />}>
        <IntegrationsHubClient
          cards={cards}
          connectedCount={connectedCount}
          initialQuery={query}
          initialCategory={category}
          initialStatus={status}
          errorMessage={errorMessage}
        />
      </Suspense>
    </IntegrationsShell>
  );
}

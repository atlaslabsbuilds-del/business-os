import { IntegrationsHubSkeleton } from "../../../components/integrations/integration-skeletons";
import { IntegrationsShell } from "../../../components/integrations/integrations-shell";

export default function IntegrationsLoading() {
  return (
    <IntegrationsShell>
      <IntegrationsHubSkeleton />
    </IntegrationsShell>
  );
}

import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";

export function IntegrationsShell({
  children,
  actions,
  title = "Integrations",
  description = "Connect your favorite tools and let Kairos automate your work.",
  badge = "Integrations",
}: {
  children: ReactNode;
  actions?: ReactNode;
  title?: string;
  description?: string;
  badge?: string;
}) {
  return (
    <ModulePageShell
      badge={badge}
      title={title}
      description={description}
      actions={actions}
      maxWidth="max-w-7xl"
    >
      {children}
    </ModulePageShell>
  );
}

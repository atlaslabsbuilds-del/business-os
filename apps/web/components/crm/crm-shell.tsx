import { CrmNav } from "./crm-nav";
import { ModulePageShell } from "../app/module-page-shell";

export function CrmShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <ModulePageShell
      badge="Actora CRM"
      title={title}
      description={description}
      actions={actions}
    >
      <CrmNav />
      {children}
    </ModulePageShell>
  );
}

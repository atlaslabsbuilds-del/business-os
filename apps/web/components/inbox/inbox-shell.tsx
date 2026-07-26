import { InboxNav } from "./inbox-nav";
import { ModulePageShell } from "../app/module-page-shell";

export function InboxShell({
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
      badge="Actora Inbox"
      title={title}
      description={description}
      actions={actions}
    >
      <InboxNav />
      {children}
    </ModulePageShell>
  );
}

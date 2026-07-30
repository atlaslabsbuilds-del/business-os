import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { DocumentsNav } from "./documents-nav";

export function DocumentsShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <ModulePageShell
      badge="Documents"
      title={title}
      description={description}
      actions={actions}
    >
      <DocumentsNav />
      {children}
    </ModulePageShell>
  );
}

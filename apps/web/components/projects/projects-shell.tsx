import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { ProjectsNav } from "./projects-nav";

export function ProjectsShell({
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
      badge="Projects"
      title={title}
      description={description}
      actions={actions}
    >
      <ProjectsNav />
      {children}
    </ModulePageShell>
  );
}

import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";

export function FeedbackShell({
  children,
  actions,
}: {
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <ModulePageShell
      badge="Feedback"
      title="Feedback Center"
      description="Submit feature requests, report bugs, and track the status of your ideas."
      actions={actions}
      navItems={[
        { href: "/feedback", label: "Submit", exact: true },
        { href: "/feedback/mine", label: "My Feedback" },
        { href: "/roadmap", label: "Roadmap" },
      ]}
    >
      {children}
    </ModulePageShell>
  );
}

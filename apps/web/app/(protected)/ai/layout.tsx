import { ModulePageShell } from "../../../components/app/module-page-shell";
import { AI_STUDIO_NAV } from "../../../lib/ai-studio-nav";

export default function AiStudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModulePageShell
      badge="Kairos AI Studio"
      title="AI-native command layer"
      description="Memory, specialized agents, workspace commands, activity, and versioned AI outputs — all in one studio."
      navItems={AI_STUDIO_NAV.map((item) => ({
        href: item.href,
        label: item.label,
        exact: item.href === "/ai",
      }))}
      maxWidth="max-w-7xl"
    >
      {children}
    </ModulePageShell>
  );
}

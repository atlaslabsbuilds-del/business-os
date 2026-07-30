import { MonitorSmartphone, Moon, Palette } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { SettingsNav } from "../../../../components/app/settings-nav";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function AppearanceSettingsPage() {
  const context = await resolveActiveWorkspace();
  if (!context) return null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="mb-4 space-y-2 lg:sticky lg:top-20">
          <Badge variant="accent">Settings</Badge>
          <p className="text-sm text-secondary">Workspace appearance</p>
        </div>
        <SettingsNav />
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="bos-gradient-border bos-glass-strong rounded-[24px] p-6">
          <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
          <p className="mt-2 text-sm text-secondary">
            VanderBase is optimized as a dark-mode-only premium workspace with
            black, orange, glass, and high-contrast accessibility support.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Dark mode only",
              body: "Consistent OLED-friendly surfaces across web, mobile, and PWA.",
              icon: Moon,
            },
            {
              title: "Brand system",
              body: "Premium black and orange gradients, glass panels, and focused states.",
              icon: Palette,
            },
            {
              title: "Responsive shell",
              body: "Adaptive sidebar, mobile bottom nav, touch targets, and safe-area spacing.",
              icon: MonitorSmartphone,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} elevated>
                <CardHeader>
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

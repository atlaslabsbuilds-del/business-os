import { requireAdmin } from "@repo/auth/server";
import { AppShell } from "@repo/ui/app-shell";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { IconShield, IconUsers } from "@repo/ui/icons";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const user = await requireAdmin();

  return (
    <AppShell
      brand="VanderBase"
      brandHref="/"
      title="Admin"
      userEmail={user.email}
      navItems={[
        {
          href: "/",
          label: "Overview",
          icon: <IconShield />,
        },
        {
          href: "/",
          label: "Users",
          icon: <IconUsers />,
        },
      ]}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-2">
          <Badge variant="accent">Admin</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Control plane</h1>
          <p className="text-sm text-secondary">
            Signed in as{" "}
            <span className="text-foreground">{user.email ?? user.id}</span>. Admin access verified.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Platform health</CardTitle>
              <CardDescription>
                Authentication and role gates are online for the admin surface.
              </CardDescription>
            </CardHeader>
            <p className="text-3xl font-semibold tracking-tight text-success">Operational</p>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Access</CardTitle>
              <CardDescription>
                Only users with admin or owner roles can reach this panel.
              </CardDescription>
            </CardHeader>
            <p className="text-3xl font-semibold tracking-tight text-foreground">Restricted</p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

import { requireAdmin } from "@repo/auth/server";
import { listAllFeedbackForAdmin } from "@repo/database/feedback";
import { Badge } from "@repo/ui/badge";
import { AppShell } from "@repo/ui/app-shell";
import { IconMessage, IconShield, IconUsers } from "@repo/ui/icons";
import Image from "next/image";
import { AdminFeedbackClient } from "../../components/admin-feedback-client";

export const dynamic = "force-dynamic";

function AdminBrandMark({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <Image
        src="/branding/vanderbase-logo.png"
        alt="VanderBase"
        width={32}
        height={32}
        className="object-contain"
        priority
      />
    );
  }
  return (
    <Image
      src="/branding/vanderbase-wordmark.png"
      alt="VanderBase"
      width={240}
      height={28}
      className="h-7 w-auto max-w-full object-contain"
      priority
    />
  );
}

export default async function AdminFeedbackPage() {
  const user = await requireAdmin();
  const items = await listAllFeedbackForAdmin({ limit: 200 });

  return (
    <AppShell
      brand="VanderBase"
      brandMark={<AdminBrandMark />}
      brandMarkCollapsed={<AdminBrandMark collapsed />}
      brandHref="/"
      title="Admin"
      userEmail={user.email}
      navItems={[
        { href: "/", label: "Overview", icon: <IconShield /> },
        { href: "/feedback", label: "Feedback", icon: <IconMessage /> },
        { href: "/", label: "Users", icon: <IconUsers /> },
      ]}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <Badge variant="accent">Feedback</Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Feedback dashboard
          </h1>
          <p className="text-sm text-secondary">
            Review submissions across workspaces, update status, assign owners, and prioritize by votes.
          </p>
        </div>
        <AdminFeedbackClient initialItems={items} />
      </div>
    </AppShell>
  );
}

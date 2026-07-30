"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/utils";

const SETTINGS_NAV = [
  { href: "/settings", label: "Workspace", exact: true },
  { href: "/settings/security", label: "Security" },
  { href: "/notifications/preferences", label: "Notifications" },
  { href: "/team", label: "Members" },
  { href: "/integrations", label: "Integrations" },
  { href: "/billing", label: "Billing" },
  { href: "/credits", label: "AI Credits" },
  { href: "/notifications/activity", label: "Activity" },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="bos-glass flex flex-col gap-1 rounded-2xl p-2" aria-label="Settings">
      {SETTINGS_NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-primary-muted font-medium text-foreground"
                : "text-secondary hover:bg-elevated/70 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

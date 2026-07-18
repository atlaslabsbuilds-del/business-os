"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/utils";

const items = [
  { href: "/crm", label: "Dashboard", exact: true },
  { href: "/crm/contacts", label: "Contacts" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/leads", label: "Leads" },
  { href: "/crm/deals", label: "Deals" },
  { href: "/crm/activities", label: "Activities" },
  { href: "/crm/notes", label: "Notes" },
  { href: "/crm/tags", label: "Tags" },
];

export function CrmNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border pb-3">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm transition duration-200",
              active
                ? "bg-accent-muted text-foreground"
                : "text-secondary hover:bg-elevated hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

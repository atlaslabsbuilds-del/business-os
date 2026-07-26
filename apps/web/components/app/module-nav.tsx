"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@repo/ui/utils";

export type ModuleNavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

export function ModuleNav({ items }: { items: ModuleNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="bos-glass flex flex-wrap gap-1 rounded-2xl p-1.5">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition duration-200",
              active
                ? "bg-primary text-white shadow-[0_8px_24px_rgba(249,115,22,0.25)]"
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

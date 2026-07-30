"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppShellNavItem } from "@repo/ui/app-shell";
import { cn } from "@repo/ui/utils";

const MOBILE_HREFS = [
  "/dashboard",
  "/crm",
  "/notifications",
  "/chat",
  "/settings",
] as const;

export function MobileBottomNav({
  items,
}: {
  items: AppShellNavItem[];
}) {
  const pathname = usePathname();
  const mobileItems = MOBILE_HREFS.map((href) => items.find((item) => item.href === href)).filter(
    Boolean,
  ) as AppShellNavItem[];

  return (
    <nav
      className="bos-glass-strong fixed inset-x-0 bottom-0 z-40 border-t border-border/70 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 lg:hidden"
      aria-label="Mobile primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {mobileItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex touch-manipulation flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] transition",
                  active ? "text-primary" : "text-secondary hover:text-foreground",
                )}
              >
                <span className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  ) : null}
                </span>
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

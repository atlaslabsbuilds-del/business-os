"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";
import { IconClose, IconMenu, IconSearch } from "./icons";
import { cn } from "./utils";

export type AppShellNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export type AppShellProps = {
  brand?: string;
  brandHref?: string;
  title?: string;
  userEmail?: string | null;
  navItems: AppShellNavItem[];
  signOutAction?: string;
  sidebarTop?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
};

export function AppShell({
  brand = "Business OS",
  brandHref = "/",
  title = "Workspace",
  userEmail,
  navItems,
  signOutAction = "/auth/signout",
  sidebarTop,
  toolbar,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/80 lg:flex lg:flex-col">
          <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-[11px] font-semibold text-white">
              B
            </span>
            <Link
              href={brandHref}
              className="text-sm font-semibold tracking-tight text-foreground transition duration-200 hover:text-secondary"
            >
              {brand}
            </Link>
          </div>
          {sidebarTop ? (
            <div className="border-b border-border p-3">{sidebarTop}</div>
          ) : null}
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition duration-200",
                    active
                      ? "bg-accent-muted text-foreground"
                      : "text-secondary hover:bg-elevated hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-3">
            <p className="truncate px-2 text-xs text-muted">{userEmail ?? "Signed in"}</p>
          </div>
        </aside>

        {open ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-border bg-surface shadow-elevated">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="text-sm font-semibold">{brand}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                >
                  <IconClose />
                </Button>
              </div>
              {sidebarTop ? (
                <div className="border-b border-border p-3">{sidebarTop}</div>
              ) : null}
              <nav className="flex flex-1 flex-col gap-1 p-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-secondary transition duration-200 hover:bg-elevated hover:text-foreground"
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              <IconMenu />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{title}</p>
            </div>
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-1.5 text-xs text-muted sm:flex">
              <IconSearch className="h-3.5 w-3.5" />
              <span>Search</span>
              <kbd className="ml-2 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-secondary">
                ⌘K
              </kbd>
            </div>
            {toolbar}
            <form action={signOutAction} method="post">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

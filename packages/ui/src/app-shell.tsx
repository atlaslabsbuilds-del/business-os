"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { IconClose, IconMenu } from "./icons";
import { cn } from "./utils";

export type AppShellNavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

export type AppShellProps = {
  brand?: string;
  brandMark?: React.ReactNode;
  brandHref?: string;
  title?: string;
  userEmail?: string | null;
  navItems: AppShellNavItem[];
  signOutAction?: string;
  sidebarTop?: React.ReactNode;
  toolbar?: React.ReactNode;
  searchSlot?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  helpSlot?: React.ReactNode;
  children: React.ReactNode;
};

const SIDEBAR_KEY = "bos-sidebar-collapsed";

export function AppShell({
  brand = "VanderBase",
  brandMark,
  brandHref = "/",
  title = "Workspace",
  userEmail,
  navItems,
  signOutAction = "/auth/signout",
  sidebarTop,
  toolbar,
  searchSlot,
  sidebarFooter,
  helpSlot,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "1") setCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  };

  function NavLinks({ compact = false }: { compact?: boolean }) {
    return (
      <>
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={compact ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-[background-color,color,box-shadow] duration-200 ease-out",
                active
                  ? "bg-primary-muted text-foreground shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_24%,transparent)]"
                  : "text-secondary hover:bg-elevated/80 hover:text-foreground",
                compact && "justify-center px-2.5",
              )}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
              <span className={cn("shrink-0", active && "text-primary")}>{item.icon}</span>
              {!compact ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <div className="bos-atmosphere min-h-screen text-foreground">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "bos-glass bos-noise relative hidden shrink-0 flex-col border-r border-border/80 lg:flex",
            collapsed ? "w-[72px]" : "w-60",
            "transition-[width] duration-300 ease-out",
          )}
        >
          <div
            className={cn(
              "flex h-14 items-center border-b border-border/60",
              collapsed ? "justify-center px-2" : "gap-2.5 px-4",
            )}
          >
            {brandMark ?? (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-[11px] font-bold text-white shadow-soft">
                VB
              </span>
            )}
            {!collapsed ? (
              <Link
                href={brandHref}
                className="min-w-0 truncate text-sm font-semibold tracking-tight transition duration-200 hover:text-secondary"
              >
                {brand}
              </Link>
            ) : null}
          </div>

          {sidebarTop && !collapsed ? (
            <div className="border-b border-border/60 p-3">{sidebarTop}</div>
          ) : null}

          <nav
            className={cn("flex flex-1 flex-col gap-1 overflow-y-auto p-3", collapsed && "px-2")}
            aria-label="Primary"
          >
            <NavLinks compact={collapsed} />
          </nav>

          <div className="border-t border-border/60 p-3">
            {!collapsed && sidebarFooter ? (
              <div className="mb-3">{sidebarFooter}</div>
            ) : null}
            {!collapsed ? (
              <p className="truncate px-2 text-xs text-muted">{userEmail ?? "Signed in"}</p>
            ) : null}
            <button
              type="button"
              onClick={toggleCollapsed}
              className={cn(
                "mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-elevated/50 px-2 py-2 text-xs text-secondary transition hover:text-foreground",
                collapsed && "px-0",
              )}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  <span>Collapse</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm pbos-animate-fade"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="bos-glass-strong absolute inset-y-0 left-0 flex w-72 flex-col pbos-animate-rise shadow-elevated">
              <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
                <span className="text-sm font-semibold">{brand}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <IconClose />
                </Button>
              </div>
              {sidebarTop ? (
                <div className="border-b border-border/60 p-3">{sidebarTop}</div>
              ) : null}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                <NavLinks />
              </nav>
              {sidebarFooter ? (
                <div className="border-t border-border/60 p-3">{sidebarFooter}</div>
              ) : null}
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="bos-glass sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/60 px-3 sm:gap-3 sm:px-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{title}</p>
            </div>
            {searchSlot}
            <div className="flex items-center gap-1.5 sm:gap-2">{toolbar}</div>
            <form action={signOutAction} method="post" className="hidden sm:block">
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </header>

          <main className="relative flex-1 p-4 sm:p-6 lg:p-8">
            <div className="pbos-animate-rise">{children}</div>
          </main>
        </div>
      </div>
      {helpSlot}
    </div>
  );
}

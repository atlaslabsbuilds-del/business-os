"use client";

import Link from "next/link";
import {
  CreditCard,
  HelpCircle,
  Keyboard,
  LogOut,
  Settings,
  User,
  Users,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";

export function AppProfileMenu({
  email,
  role,
  signOutAction = "/auth/signout",
}: {
  email: string | null;
  role: string;
  signOutAction?: string;
}) {
  const initial = (email?.[0] ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 px-2" aria-label="Profile menu">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-muted text-xs font-semibold text-primary">
            {initial}
          </span>
          <span className="hidden max-w-[120px] truncate text-xs sm:inline">{email ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bos-glass-strong bos-noise min-w-52 rounded-[16px]">
        <div className="border-b border-border/60 px-3 py-2.5">
          <p className="truncate text-sm font-medium">{email ?? "Signed in"}</p>
          <p className="text-xs capitalize text-muted">{role}</p>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <User className="h-4 w-4" aria-hidden />
            Profile & workspace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" aria-hidden />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/team" className="flex items-center gap-2">
            <Users className="h-4 w-4" aria-hidden />
            Team
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" aria-hidden />
            Billing
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="flex items-center gap-2 text-muted">
          <Keyboard className="h-4 w-4" aria-hidden />
          ⌘K Command palette
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/contact" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" aria-hidden />
            Help & docs
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} method="post" className="w-full">
            <button type="submit" className="flex w-full items-center gap-2 text-left">
              <LogOut className="h-4 w-4" aria-hidden />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

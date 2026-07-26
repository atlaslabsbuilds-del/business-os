"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { workspaceNotificationsAction } from "../../app/(protected)/actions/platform";
import { formatRelative } from "../dashboard/format";

export function AppNotificationsCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      title: string;
      body: string | null;
      module: string;
      actionUrl: string | null;
      readAt: string | null;
      createdAt: string;
    }>
  >([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const response = await workspaceNotificationsAction();
      if (response.ok) setNotifications(response.data.notifications);
    });
  }, [open]);

  const unread = notifications.filter((item) => !item.readAt).length;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative px-2.5" aria-label="Notifications">
          <Bell className="h-4 w-4" aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bos-glass-strong bos-noise w-[min(360px,calc(100vw-2rem))] rounded-[18px] p-0"
      >
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted">Workspace alerts across modules</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {pending && notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="space-y-1">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link
                    href={notification.actionUrl ?? "/dashboard"}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition hover:bg-elevated/70"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
                      <Bell className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{notification.title}</span>
                        <Badge variant={notification.readAt ? "default" : "accent"}>
                          {notification.module}
                        </Badge>
                      </span>
                      {notification.body ? (
                        <span className="mt-1 line-clamp-2 block text-xs text-secondary">
                          {notification.body}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[11px] text-muted">
                        {formatRelative(notification.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border/60 px-4 py-2">
          <Link href="/dashboard" className="text-xs text-primary hover:underline" onClick={() => setOpen(false)}>
            View on dashboard
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

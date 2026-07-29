"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import type { NotificationListItem } from "@repo/types";
import {
  listNotificationsAction,
  markAllNotificationsReadAction,
} from "../../app/(protected)/actions/notifications";
import { useNotificationsRealtime, useUnreadNotificationCount } from "../../lib/notifications-realtime";
import { NotificationRow } from "../notifications/notifications-client";

export function AppNotificationsCenter({
  workspaceId,
  userId,
  initialUnreadCount = 0,
}: {
  workspaceId: string;
  userId: string;
  initialUnreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [pending, startTransition] = useTransition();
  const { count, setCount, refresh: refreshCount } = useUnreadNotificationCount({
    workspaceId,
    initialCount: initialUnreadCount,
  });

  const load = useCallback(() => {
    startTransition(async () => {
      const response = await listNotificationsAction({ limit: 8 });
      if (response.ok) {
        setNotifications(response.data.notifications);
        setCount(response.data.unreadCount);
      }
    });
  }, [setCount]);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  useNotificationsRealtime({
    workspaceId,
    userId,
    enabled: true,
    onInsert: (notification) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        return [notification, ...current].slice(0, 8);
      });
    },
    onUnreadCountChange: setCount,
  });

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      load();
      refreshCount();
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative px-2.5" aria-label="Notifications">
          <Bell className="h-4 w-4" aria-hidden />
          {count > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bos-glass-strong bos-noise w-[min(420px,calc(100vw-2rem))] rounded-[18px] p-0"
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted">Live workspace alerts</p>
          </div>
          {count > 0 ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={pending} onClick={markAll}>
              Mark all read
            </Button>
          ) : null}
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {pending && notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">Loading…</p>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-sm font-medium">You&apos;re all caught up 🎉</p>
              <p className="mt-1 text-xs text-muted">No new notifications.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  compact
                  onChange={load}
                />
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border/60 px-4 py-2">
          <Link
            href="/notifications"
            className="text-xs text-primary hover:underline"
            onClick={() => setOpen(false)}
          >
            Open notification center
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

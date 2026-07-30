"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  Bell,
  CheckCheck,
  CreditCard,
  Lightbulb,
  MessageSquare,
  Receipt,
  Shield,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Workflow,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type {
  NotificationCategory,
  NotificationListItem,
  NotificationPriority,
  NotificationSection,
} from "@repo/types";
import { NOTIFICATION_CATEGORY_LABELS } from "@repo/types";
import {
  archiveNotificationAction,
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../../app/(protected)/actions/notifications";
import { formatRelative } from "../dashboard/format";
import { cn } from "@repo/ui/utils";
import { useNotificationsRealtime } from "../../lib/notifications-realtime";

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  workspace_update: Workflow,
  invoice_paid: Receipt,
  invoice_overdue: AlertTriangle,
  new_customer: Users,
  new_lead: UserPlus,
  task_assigned: CheckCheck,
  task_completed: CheckCheck,
  project_updated: Workflow,
  crm_activity: Users,
  meeting_reminder: Bell,
  calendar_invite: Bell,
  document_shared: MessageSquare,
  mention: MessageSquare,
  comment: MessageSquare,
  team_invite: UserPlus,
  kairos_suggestion: Sparkles,
  ai_recommendation: Sparkles,
  billing_alert: CreditCard,
  system_update: Bell,
  system_alert: AlertTriangle,
  security_alert: Shield,
  integration_alert: Workflow,
  feedback_update: MessageSquare,
};

const PRIORITY_OPTIONS: Array<{ value: "all" | NotificationPriority; label: string }> = [
  { value: "all", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

function resolveSection(value: string | null): NotificationSection {
  const allowed: NotificationSection[] = [
    "all",
    "unread",
    "mentions",
    "tasks",
    "projects",
    "finance",
    "crm",
    "calendar",
    "system",
    "settings",
  ];
  if (value && allowed.includes(value as NotificationSection)) {
    return value as NotificationSection;
  }
  return "all";
}

export function NotificationRow({
  notification,
  compact = false,
  onChange,
}: {
  notification: NotificationListItem;
  compact?: boolean;
  onChange?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const Icon = CATEGORY_ICONS[notification.category] ?? Lightbulb;

  const markRead = () => {
    if (notification.isRead) return;
    startTransition(async () => {
      await markNotificationReadAction({ notificationId: notification.id });
      onChange?.();
    });
  };

  const archive = () => {
    startTransition(async () => {
      await archiveNotificationAction({ notificationId: notification.id });
      onChange?.();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await deleteNotificationAction({ notificationId: notification.id });
      onChange?.();
    });
  };

  const open = () => {
    if (!notification.isRead) markRead();
    if (notification.actionUrl) router.push(notification.actionUrl);
  };

  return (
    <article
      className={cn(
        "group flex gap-3 rounded-2xl border border-border bg-surface p-3 transition hover:border-primary/30 sm:p-4",
        !notification.isRead && "border-primary/20 bg-primary-muted/20",
        compact && "rounded-xl p-3",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary",
          notification.priority === "urgent" && "bg-error/15 text-error",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-medium text-foreground">{notification.title}</h3>
              {!notification.isRead ? (
                <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
              ) : null}
            </div>
            {notification.body ? (
              <p className="text-xs leading-5 text-secondary">{notification.body}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <Badge variant="default">
              {NOTIFICATION_CATEGORY_LABELS[
                notification.category as NotificationCategory
              ] ?? notification.category}
            </Badge>
            <Badge
              variant={
                notification.priority === "urgent" || notification.priority === "high"
                  ? "accent"
                  : "default"
              }
            >
              {notification.priority}
            </Badge>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-muted">{formatRelative(notification.createdAt)}</p>
          <div className="flex flex-wrap gap-1">
            {notification.actionUrl ? (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={open}>
                Open
              </Button>
            ) : null}
            {!notification.isRead ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={pending}
                onClick={markRead}
              >
                Mark read
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={pending}
              onClick={archive}
              aria-label="Archive notification"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted hover:text-error"
              disabled={pending}
              onClick={remove}
              aria-label="Delete notification"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function NotificationsCenterClient({
  workspaceId,
  userId,
  initialNotifications,
  initialUnreadCount = 0,
}: {
  workspaceId: string;
  userId: string;
  initialNotifications: NotificationListItem[];
  initialUnreadCount?: number;
}) {
  const searchParams = useSearchParams();
  const section = resolveSection(searchParams.get("section"));
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState<"all" | NotificationPriority>("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialNotifications.length >= 50);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const refresh = useCallback(
    async (cursor?: string) => {
      const response = await import("../../app/(protected)/actions/notifications").then(
        (mod) =>
          mod.listNotificationsAction({
            query: debouncedQuery || undefined,
            priority: priority === "all" ? undefined : priority,
            section: section === "all" ? undefined : section,
            unreadOnly: section === "unread",
            cursor,
            limit: 50,
          }),
      );
      if (response.ok) return response.data;
      return null;
    },
    [debouncedQuery, priority, section],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const data = await refresh();
    setLoading(false);
    if (!data) return;
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
    setHasMore(data.notifications.length >= 50);
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || notifications.length === 0) return;
    setLoadingMore(true);
    const cursor = notifications[notifications.length - 1]?.createdAt;
    const data = await refresh(cursor);
    setLoadingMore(false);
    if (!data) return;
    setNotifications((prev) => {
      const ids = new Set(prev.map((item) => item.id));
      return [...prev, ...data.notifications.filter((item) => !ids.has(item.id))];
    });
    setHasMore(data.notifications.length >= 50);
  }, [hasMore, loadingMore, notifications, refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  useNotificationsRealtime({
    workspaceId,
    userId,
    enabled: true,
    onInsert: () => {
      void load();
    },
  });

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      await load();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Search notifications</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications…"
            className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as "all" | NotificationPriority)
            }
            className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            aria-label="Filter by priority"
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Badge variant="accent">{unreadCount} unread</Badge>
          <Button variant="secondary" size="sm" disabled={pending} onClick={markAll}>
            Mark all as read
          </Button>
        </div>
      </div>

      {loading && notifications.length === 0 ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading notifications">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-2xl border border-border bg-elevated/60"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-lg font-medium">You&apos;re all caught up</p>
          <p className="mt-2 text-sm text-secondary">No notifications in this view.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onChange={load}
            />
          ))}
          <div ref={sentinelRef} className="h-8" aria-hidden />
          {loadingMore ? (
            <p className="text-center text-xs text-muted">Loading more…</p>
          ) : null}
        </div>
      )}

      <p className="text-center text-xs text-muted">
        <Link href="/notifications/preferences" className="text-primary hover:underline">
          Notification preferences
        </Link>
      </p>
    </div>
  );
}

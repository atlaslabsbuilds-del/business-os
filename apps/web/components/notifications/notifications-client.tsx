"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
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
import { useCallback, useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import type { NotificationCategory, NotificationListItem } from "@repo/types";
import { NOTIFICATION_CATEGORY_LABELS } from "@repo/types";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../../app/(protected)/actions/notifications";
import { formatRelative } from "../dashboard/format";
import { cn } from "@repo/ui/utils";

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  workspace_update: Workflow,
  invoice_paid: Receipt,
  invoice_overdue: AlertTriangle,
  new_customer: Users,
  new_lead: UserPlus,
  task_assigned: CheckCheck,
  team_invite: UserPlus,
  kairos_suggestion: Sparkles,
  billing_alert: CreditCard,
  system_update: Bell,
  security_alert: Shield,
  feedback_update: MessageSquare,
};

const FILTER_OPTIONS: Array<{ value: "all" | NotificationCategory; label: string }> = [
  { value: "all", label: "All" },
  { value: "workspace_update", label: "Workspace" },
  { value: "invoice_paid", label: "Paid" },
  { value: "invoice_overdue", label: "Overdue" },
  { value: "new_customer", label: "Customers" },
  { value: "new_lead", label: "Leads" },
  { value: "task_assigned", label: "Tasks" },
  { value: "team_invite", label: "Team" },
  { value: "kairos_suggestion", label: "Kairos" },
  { value: "billing_alert", label: "Billing" },
  { value: "system_update", label: "System" },
  { value: "security_alert", label: "Security" },
  { value: "feedback_update", label: "Feedback" },
];

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

export function NotificationsListPanel({
  notifications,
  loading,
  onRefresh,
}: {
  notifications: NotificationListItem[];
  loading?: boolean;
  onRefresh: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const markAll = () => {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      onRefresh();
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-10 text-center text-sm text-muted">
        Loading notifications…
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-lg font-medium">You&apos;re all caught up 🎉</p>
        <p className="mt-2 text-sm text-secondary">No new notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="sm" disabled={pending} onClick={markAll}>
          Mark all as read
        </Button>
      </div>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            onChange={onRefresh}
          />
        ))}
      </div>
    </div>
  );
}

export function NotificationsFilters({
  query,
  category,
  unreadOnly,
  onQueryChange,
  onCategoryChange,
  onUnreadOnlyChange,
}: {
  query: string;
  category: "all" | NotificationCategory;
  unreadOnly: boolean;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: "all" | NotificationCategory) => void;
  onUnreadOnlyChange: (value: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="block min-w-0 flex-1">
        <span className="sr-only">Search notifications</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search notifications…"
          className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value as "all" | NotificationCategory)
          }
          className="h-10 rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          aria-label="Filter by type"
        >
          {FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => onUnreadOnlyChange(event.target.checked)}
            className="accent-[var(--primary)]"
          />
          Unread only
        </label>
      </div>
    </div>
  );
}

export function NotificationsCenterClient({
  workspaceId,
  userId,
  initialNotifications,
}: {
  workspaceId: string;
  userId: string;
  initialNotifications: NotificationListItem[];
  initialUnreadCount?: number;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const refresh = useCallback(async () => {
    const response = await import("../../app/(protected)/actions/notifications").then(
      (mod) =>
        mod.listNotificationsAction({
          query: debouncedQuery || undefined,
          category: category === "all" ? undefined : category,
          unreadOnly,
        }),
    );
    if (response.ok) {
      return response.data;
    }
    return null;
  }, [category, debouncedQuery, unreadOnly]);

  const [notifications, setNotifications] = useState(initialNotifications);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await refresh();
    setLoading(false);
    if (data) setNotifications(data.notifications);
  }, [refresh]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const supabase = import("@repo/database/browser").then(({ createBrowserClient }) => {
      const client = createBrowserClient();
      const channel = client
        .channel(`notifications-page:${workspaceId}:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "workspace_notifications",
            filter: `workspace_id=eq.${workspaceId}`,
          },
          () => {
            void load();
          },
        )
        .subscribe();
      return () => {
        void client.removeChannel(channel);
      };
    });
    return () => {
      void supabase.then((cleanup) => cleanup?.());
    };
  }, [load, userId, workspaceId]);

  return (
    <div className="space-y-4">
      <NotificationsFilters
        query={query}
        category={category}
        unreadOnly={unreadOnly}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        onUnreadOnlyChange={setUnreadOnly}
      />
      <NotificationsListPanel
        notifications={notifications}
        loading={loading}
        onRefresh={load}
      />
      <p className="text-center text-xs text-muted">
        <Link href="/notifications/preferences" className="text-primary hover:underline">
          Notification preferences
        </Link>
      </p>
    </div>
  );
}

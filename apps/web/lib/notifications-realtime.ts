"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createBrowserClient } from "@repo/database/browser";
import type { NotificationListItem } from "@repo/types";
import {
  getUnreadNotificationCountAction,
  listNotificationsAction,
} from "../app/(protected)/actions/notifications";

function mapRow(row: Record<string, unknown>): NotificationListItem {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    module: String(row.module),
    type: String(row.type),
    category: String(row.category ?? "system_update"),
    priority: String(row.priority ?? "normal"),
    title: String(row.title),
    body: row.body ? String(row.body) : null,
    actionUrl: row.action_url ? String(row.action_url) : null,
    recipientUserId: row.recipient_user_id ? String(row.recipient_user_id) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    readAt: null,
    isRead: false,
  };
}

type NotificationCallbacks = {
  onInsert?: (notification: NotificationListItem) => void;
  onUnreadCountChange?: (count: number) => void;
};

type SharedChannel = {
  supabase: ReturnType<typeof createBrowserClient>;
  channel: RealtimeChannel;
  workspaceId: string;
  userId: string;
  refCount: number;
};

const sharedChannels = new Map<string, SharedChannel>();
const sharedListeners = new Map<string, Set<RefObject<NotificationCallbacks>>>();

function channelKey(workspaceId: string, userId: string) {
  return `${workspaceId}:${userId}`;
}

function dispatchInsert(key: string, notification: NotificationListItem) {
  for (const callbacks of sharedListeners.get(key) ?? []) {
    callbacks.current.onInsert?.(notification);
  }
}

function dispatchUnreadCount(key: string, count: number) {
  for (const callbacks of sharedListeners.get(key) ?? []) {
    callbacks.current.onUnreadCountChange?.(count);
  }
}

function acquireNotificationsChannel(workspaceId: string, userId: string) {
  const key = channelKey(workspaceId, userId);
  const existing = sharedChannels.get(key);
  if (existing) {
    existing.refCount += 1;
    return key;
  }

  const supabase = createBrowserClient();
  const channel = supabase
    .channel(`notifications:${key}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "workspace_notifications",
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        const row = payload.new as Record<string, unknown>;
        const recipient = row.recipient_user_id
          ? String(row.recipient_user_id)
          : null;
        if (recipient && recipient !== userId) return;

        const notification = mapRow(row);
        dispatchInsert(key, notification);

        void getUnreadNotificationCountAction().then((response) => {
          if (response.ok) {
            dispatchUnreadCount(key, response.data.unreadCount);
          }
        });
      },
    )
    .subscribe();

  sharedChannels.set(key, {
    supabase,
    channel,
    workspaceId,
    userId,
    refCount: 1,
  });
  sharedListeners.set(key, new Set());

  return key;
}

function releaseNotificationsChannel(key: string) {
  const entry = sharedChannels.get(key);
  if (!entry) return;

  entry.refCount -= 1;
  if (entry.refCount > 0) return;

  void entry.supabase.removeChannel(entry.channel);
  sharedChannels.delete(key);
  sharedListeners.delete(key);
}

export function useNotificationsRealtime(input: {
  workspaceId: string;
  userId: string;
  enabled?: boolean;
  onInsert?: (notification: NotificationListItem) => void;
  onUnreadCountChange?: (count: number) => void;
}) {
  const callbacks = useRef<NotificationCallbacks>({
    onInsert: input.onInsert,
    onUnreadCountChange: input.onUnreadCountChange,
  });
  callbacks.current = {
    onInsert: input.onInsert,
    onUnreadCountChange: input.onUnreadCountChange,
  };

  useEffect(() => {
    if (!input.enabled) return;

    const key = acquireNotificationsChannel(input.workspaceId, input.userId);
    const listeners = sharedListeners.get(key)!;
    listeners.add(callbacks);

    return () => {
      listeners.delete(callbacks);
      releaseNotificationsChannel(key);
    };
  }, [input.enabled, input.userId, input.workspaceId]);
}

export function useUnreadNotificationCount(input: {
  workspaceId: string;
  initialCount?: number;
}) {
  const [count, setCount] = useState(input.initialCount ?? 0);

  const refresh = useCallback(async () => {
    const response = await getUnreadNotificationCountAction();
    if (response.ok) setCount(response.data.unreadCount);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, input.workspaceId]);

  return { count, setCount, refresh };
}

export function useNotificationsList(input: {
  workspaceId: string;
  userId: string;
  initialNotifications?: NotificationListItem[];
  initialUnreadCount?: number;
}) {
  const [notifications, setNotifications] = useState(input.initialNotifications ?? []);
  const [unreadCount, setUnreadCount] = useState(input.initialUnreadCount ?? 0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async (filters?: {
    query?: string;
    category?: string;
    unreadOnly?: boolean;
  }) => {
    setLoading(true);
    const response = await listNotificationsAction(filters);
    setLoading(false);
    if (response.ok) {
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    }
  }, []);

  useNotificationsRealtime({
    workspaceId: input.workspaceId,
    userId: input.userId,
    enabled: true,
    onInsert: (notification) => {
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        return [notification, ...current];
      });
    },
    onUnreadCountChange: setUnreadCount,
  });

  return {
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    loading,
    refresh,
  };
}

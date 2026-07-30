"use client";

import { useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type { NotificationPriority, UserNotificationPreferences } from "@repo/types";
import { updateNotificationPreferencesAction } from "../../app/(protected)/actions/notifications";

type PreferenceKey = keyof Pick<
  UserNotificationPreferences,
  | "emailNotifications"
  | "inAppNotifications"
  | "pushNotifications"
  | "browserNotifications"
  | "webhookEvents"
  | "smsNotifications"
  | "marketingEmails"
  | "productUpdates"
  | "securityAlerts"
  | "billingAlerts"
  | "quietHoursEnabled"
  | "doNotDisturb"
>;

const CHANNEL_ITEMS: Array<{ key: PreferenceKey; title: string; description: string }> = [
  {
    key: "inAppNotifications",
    title: "In-app",
    description: "Notification center and header bell.",
  },
  {
    key: "emailNotifications",
    title: "Email",
    description: "Deliver important alerts by email.",
  },
  {
    key: "pushNotifications",
    title: "Push",
    description: "Mobile and desktop push when enabled.",
  },
  {
    key: "browserNotifications",
    title: "Browser",
    description: "Native browser permission prompts.",
  },
  {
    key: "webhookEvents",
    title: "Webhooks",
    description: "Forward events to connected endpoints.",
  },
  {
    key: "smsNotifications",
    title: "SMS (ready)",
    description: "Future-ready channel — architecture reserved.",
  },
];

const RULE_ITEMS: Array<{ key: PreferenceKey; title: string; description: string }> = [
  {
    key: "productUpdates",
    title: "Product updates",
    description: "Release notes and system announcements.",
  },
  {
    key: "securityAlerts",
    title: "Security alerts",
    description: "Sign-in, permissions, and security events.",
  },
  {
    key: "billingAlerts",
    title: "Billing alerts",
    description: "Invoices, credits, and payment issues.",
  },
  {
    key: "marketingEmails",
    title: "Marketing emails",
    description: "Optional product news and tips.",
  },
  {
    key: "quietHoursEnabled",
    title: "Quiet hours",
    description: "Suppress non-urgent alerts during quiet hours.",
  },
  {
    key: "doNotDisturb",
    title: "Do not disturb",
    description: "Pause in-app delivery until you turn this off.",
  },
];

export function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: UserNotificationPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [pending, startTransition] = useTransition();

  function patch(next: Partial<UserNotificationPreferences>) {
    const merged = { ...preferences, ...next };
    setPreferences(merged);
    startTransition(async () => {
      const response = await updateNotificationPreferencesAction(next);
      if (response.ok) setPreferences(response.data.preferences);
    });
  }

  function toggle(key: PreferenceKey) {
    patch({ [key]: !preferences[key] });
  }

  return (
    <div className="space-y-6">
      <Card elevated>
        <CardHeader>
          <CardTitle>Delivery channels</CardTitle>
          <CardDescription>
            In-app, email, push, browser, webhooks — SMS reserved for future delivery.
          </CardDescription>
        </CardHeader>
        <PreferenceList items={CHANNEL_ITEMS} preferences={preferences} pending={pending} onToggle={toggle} />
      </Card>

      <Card elevated>
        <CardHeader>
          <CardTitle>Priority & quiet hours</CardTitle>
          <CardDescription>
            Control minimum priority and do-not-disturb behavior.
          </CardDescription>
        </CardHeader>
        <div className="space-y-4 px-5 pb-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Minimum priority</span>
            <select
              value={preferences.priorityMin}
              disabled={pending}
              onChange={(event) =>
                patch({ priorityMin: event.target.value as NotificationPriority })
              }
              className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary sm:max-w-xs"
            >
              <option value="low">Low and above</option>
              <option value="normal">Normal and above</option>
              <option value="high">High and above</option>
              <option value="urgent">Urgent only</option>
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Quiet hours start</span>
              <input
                type="time"
                value={preferences.quietHoursStart?.slice(0, 5) ?? ""}
                disabled={pending || !preferences.quietHoursEnabled}
                onChange={(event) =>
                  patch({ quietHoursStart: event.target.value || null })
                }
                className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Quiet hours end</span>
              <input
                type="time"
                value={preferences.quietHoursEnd?.slice(0, 5) ?? ""}
                disabled={pending || !preferences.quietHoursEnabled}
                onChange={(event) =>
                  patch({ quietHoursEnd: event.target.value || null })
                }
                className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
        </div>
      </Card>

      <Card elevated>
        <CardHeader>
          <CardTitle>Alert rules</CardTitle>
          <CardDescription>Product, security, billing, and interrupt controls.</CardDescription>
        </CardHeader>
        <PreferenceList items={RULE_ITEMS} preferences={preferences} pending={pending} onToggle={toggle} />
      </Card>
    </div>
  );
}

function PreferenceList({
  items,
  preferences,
  pending,
  onToggle,
}: {
  items: Array<{ key: PreferenceKey; title: string; description: string }>;
  preferences: UserNotificationPreferences;
  pending: boolean;
  onToggle: (key: PreferenceKey) => void;
}) {
  return (
    <ul className="divide-y divide-border px-5 pb-5">
      {items.map((item) => (
        <li
          key={item.key}
          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-xs text-secondary">{item.description}</p>
          </div>
          <Button
            type="button"
            variant={preferences[item.key] ? "primary" : "secondary"}
            size="sm"
            disabled={pending}
            onClick={() => onToggle(item.key)}
            aria-pressed={Boolean(preferences[item.key])}
          >
            {preferences[item.key] ? "Enabled" : "Disabled"}
          </Button>
        </li>
      ))}
    </ul>
  );
}

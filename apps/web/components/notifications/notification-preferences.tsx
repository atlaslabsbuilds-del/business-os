"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type { UserNotificationPreferences } from "@repo/types";
import {
  getNotificationPreferencesAction,
  updateNotificationPreferencesAction,
} from "../../app/(protected)/actions/notifications";

type PreferenceKey = keyof Pick<
  UserNotificationPreferences,
  | "emailNotifications"
  | "inAppNotifications"
  | "marketingEmails"
  | "productUpdates"
  | "securityAlerts"
  | "billingAlerts"
>;

const PREFERENCE_ITEMS: Array<{
  key: PreferenceKey;
  title: string;
  description: string;
}> = [
  {
    key: "emailNotifications",
    title: "Email notifications",
    description: "Receive important workspace alerts by email when delivery is enabled.",
  },
  {
    key: "inAppNotifications",
    title: "In-app notifications",
    description: "Show alerts in the notification center and header bell.",
  },
  {
    key: "marketingEmails",
    title: "Marketing emails",
    description: "Product news, campaigns, and growth tips from VanderBase.",
  },
  {
    key: "productUpdates",
    title: "Product updates",
    description: "Release notes, new modules, and system announcements.",
  },
  {
    key: "securityAlerts",
    title: "Security alerts",
    description: "Sign-in activity, permission changes, and security events.",
  },
  {
    key: "billingAlerts",
    title: "Billing alerts",
    description: "Invoices, payment issues, credit purchases, and one-time billing updates.",
  },
];

export function NotificationPreferencesForm({
  initialPreferences,
}: {
  initialPreferences: UserNotificationPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [pending, startTransition] = useTransition();

  async function toggle(key: PreferenceKey) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    startTransition(async () => {
      const response = await updateNotificationPreferencesAction({ [key]: next[key] });
      if (response.ok) setPreferences(response.data.preferences);
    });
  }

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>Notification preferences</CardTitle>
        <CardDescription>
          Control how VanderBase reaches you. In-app settings apply immediately.
        </CardDescription>
      </CardHeader>
      <ul className="divide-y divide-border px-5 pb-5">
        {PREFERENCE_ITEMS.map((item) => (
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
              onClick={() => toggle(item.key)}
              aria-pressed={preferences[item.key]}
            >
              {preferences[item.key] ? "Enabled" : "Disabled"}
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function NotificationPreferencesLoader() {
  const [preferences, setPreferences] = useState<UserNotificationPreferences | null>(null);

  useEffect(() => {
    void getNotificationPreferencesAction().then((response) => {
      if (response.ok) setPreferences(response.data.preferences);
    });
  }, []);

  if (!preferences) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
        Loading preferences…
      </div>
    );
  }

  return <NotificationPreferencesForm initialPreferences={preferences} />;
}

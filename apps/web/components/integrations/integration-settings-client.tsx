"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { IntegrationAccount, IntegrationCatalogItem } from "@repo/types";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  deleteIntegrationConnectionAction,
  updateIntegrationSettingsAction,
} from "../../app/(protected)/actions/integrations";

export function IntegrationSettingsClient({
  catalog,
  account,
}: {
  catalog: IntegrationCatalogItem;
  account: IntegrationAccount;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState(account.autoSync);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    account.notificationsEnabled,
  );
  const [kairosAccess, setKairosAccess] = useState(account.kairosAccess);
  const [syncFrequency, setSyncFrequency] = useState(account.syncFrequency);

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateIntegrationSettingsAction({
        accountId: account.id,
        autoSync,
        notificationsEnabled,
        kairosAccess,
        syncFrequency: syncFrequency as "manual" | "hourly" | "daily" | "weekly",
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage("Settings saved");
      router.refresh();
    });
  }

  function removeConnection() {
    if (
      !window.confirm(
        `Delete the ${catalog.name} connection? Tokens will be wiped permanently.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteIntegrationConnectionAction({
        accountId: account.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/integrations");
      router.refresh();
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card elevated>
        <CardHeader>
          <CardTitle>{catalog.name} settings</CardTitle>
          <CardDescription>
            Control sync, notifications, and Kairos access for this connection.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4">
          <ToggleRow
            label="Auto Sync"
            description="Keep data fresh on the selected schedule."
            checked={autoSync}
            onChange={setAutoSync}
          />
          <ToggleRow
            label="Notifications"
            description="Alert when sync fails or permissions change."
            checked={notificationsEnabled}
            onChange={setNotificationsEnabled}
          />
          <ToggleRow
            label="Default AI Access"
            description="Allow Kairos to use this integration in chat."
            checked={kairosAccess}
            onChange={setKairosAccess}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium">Sync frequency</span>
            <select
              className="bos-glass h-10 w-full rounded-xl bg-transparent px-3 text-sm outline-none"
              value={syncFrequency}
              onChange={(event) => setSyncFrequency(event.target.value)}
            >
              <option value="manual">Manual</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Permission management</p>
            <div className="flex flex-wrap gap-2">
              {account.permissions.map((permission) => (
                <span
                  key={permission}
                  className="rounded-lg border border-border bg-elevated px-2 py-1 text-xs text-secondary"
                >
                  {permission}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">
              Reconnect to request updated OAuth scopes from the provider.
            </p>
          </div>

          {message ? <p className="text-sm text-success">{message}</p> : null}
          {error ? (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button loading={pending} onClick={save}>
              Save settings
            </Button>
            <Link
              href={`/integrations/${catalog.id}`}
              className="inline-flex h-10 items-center rounded-xl px-4 text-sm text-secondary hover:text-foreground"
            >
              Back
            </Link>
          </div>
        </div>
      </Card>

      <Card elevated className="border-error/20">
        <CardHeader>
          <CardTitle>Delete connection</CardTitle>
          <CardDescription>
            Permanently remove this account and encrypted tokens from VanderBase.
          </CardDescription>
        </CardHeader>
        <Button variant="danger" loading={pending} onClick={removeConnection}>
          Delete Connection
        </Button>
      </Card>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="bos-glass flex cursor-pointer items-start justify-between gap-4 rounded-xl p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block text-xs text-secondary">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-orange-500"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

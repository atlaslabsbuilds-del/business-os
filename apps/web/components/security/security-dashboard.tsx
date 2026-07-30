"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import type {
  SecurityAuditLogItem,
  UserDeviceSession,
  UserLoginHistoryItem,
  WorkspaceApiKey,
  WorkspaceSecuritySettings,
} from "@repo/types";
import {
  createApiKeyAction,
  getSecurityDashboardAction,
  revokeApiKeyAction,
  revokeSessionAction,
  updateSecuritySettingsAction,
} from "../../app/(protected)/actions/security";
import { formatRelative } from "../dashboard/format";

type Snapshot = {
  settings: WorkspaceSecuritySettings;
  auditLogs: SecurityAuditLogItem[];
  loginHistory: UserLoginHistoryItem[];
  sessions: UserDeviceSession[];
  apiKeys: WorkspaceApiKey[];
  mfaReady: boolean;
  score: number;
  isAdmin: boolean;
};

export function SecurityDashboardClient() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    startTransition(async () => {
      const result = await getSecurityDashboardAction();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSnapshot(result.data as Snapshot);
      setError(null);
    });
  };

  useEffect(() => {
    load();
  }, []);

  if (!snapshot) {
    return (
      <div className="space-y-3" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-border bg-elevated/60"
          />
        ))}
        {error ? <p className="text-sm text-error">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bos-glass-strong bos-gradient-border rounded-[24px] p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-primary">Security</p>
            <h2 className="mt-1 text-2xl font-semibold">Workspace posture</h2>
            <p className="mt-1 text-sm text-secondary">
              Sessions, API keys, audit logs, and 2FA-ready controls.
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold text-primary">{snapshot.score}</p>
            <p className="text-xs text-muted">security score</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card elevated>
          <CardHeader>
            <CardTitle>Security settings</CardTitle>
            <CardDescription>MFA-ready architecture, session timeout, rate limits.</CardDescription>
          </CardHeader>
          <div className="space-y-3 px-5 pb-5">
            <ToggleRow
              label="Require MFA"
              enabled={snapshot.settings.mfaRequired}
              disabled={!snapshot.isAdmin || pending}
              onToggle={() =>
                startTransition(async () => {
                  await updateSecuritySettingsAction({
                    mfaRequired: !snapshot.settings.mfaRequired,
                  });
                  load();
                })
              }
            />
            <ToggleRow
              label="Allow API keys"
              enabled={snapshot.settings.allowApiKeys}
              disabled={!snapshot.isAdmin || pending}
              onToggle={() =>
                startTransition(async () => {
                  await updateSecuritySettingsAction({
                    allowApiKeys: !snapshot.settings.allowApiKeys,
                  });
                  load();
                })
              }
            />
            <p className="text-xs text-secondary">
              Session timeout: {snapshot.settings.sessionTimeoutMinutes} minutes · Rate limit:{" "}
              {snapshot.settings.rateLimitPerMinute}/min · MFA ready:{" "}
              {snapshot.mfaReady ? "yes" : "no"}
            </p>
          </div>
        </Card>

        <Card elevated>
          <CardHeader>
            <CardTitle>Active sessions</CardTitle>
            <CardDescription>Devices currently signed in to your account.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-5 pb-5">
            {snapshot.sessions.length === 0 ? (
              <li className="text-sm text-muted">No tracked device sessions yet.</li>
            ) : (
              snapshot.sessions.map((session) => (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {session.deviceLabel ?? session.deviceType}
                    </p>
                    <p className="text-[11px] text-muted">
                      {session.browser ?? "Browser"} · {formatRelative(session.lastActiveAt)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await revokeSessionAction({ sessionId: session.id });
                        load();
                      })
                    }
                  >
                    Revoke
                  </Button>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>

      <Card elevated>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription>Workspace keys for integrations. Secrets shown once.</CardDescription>
        </CardHeader>
        <div className="space-y-4 px-5 pb-5">
          {snapshot.isAdmin ? (
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                if (!keyName.trim()) return;
                startTransition(async () => {
                  const result = await createApiKeyAction({ name: keyName.trim() });
                  if (result.ok) {
                    setSecret(result.data.secret);
                    setKeyName("");
                    load();
                  } else {
                    setError(result.error);
                  }
                });
              }}
            >
              <input
                value={keyName}
                onChange={(event) => setKeyName(event.target.value)}
                placeholder="Key name"
                className="h-10 flex-1 rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" disabled={pending || !snapshot.settings.allowApiKeys}>
                Create key
              </Button>
            </form>
          ) : null}
          {secret ? (
            <div className="rounded-xl border border-primary/30 bg-primary-muted/20 p-3 text-xs">
              Copy now — this secret will not be shown again:
              <code className="mt-2 block break-all font-mono text-foreground">{secret}</code>
            </div>
          ) : null}
          <ul className="space-y-2">
            {snapshot.apiKeys.map((key) => (
              <li
                key={key.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{key.name}</p>
                  <p className="text-[11px] text-muted">
                    {key.keyPrefix}… · {key.scopes.join(", ")}
                  </p>
                </div>
                {snapshot.isAdmin ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await revokeApiKeyAction({ apiKeyId: key.id });
                        load();
                      })
                    }
                  >
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Login history</CardTitle>
            <CardDescription>Recent authentication events for your account.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-5 pb-5">
            {snapshot.loginHistory.length === 0 ? (
              <li className="text-sm text-muted">No login history recorded yet.</li>
            ) : (
              snapshot.loginHistory.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/60 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{item.eventType.replaceAll("_", " ")}</span>
                    <Badge variant={item.success ? "default" : "accent"}>
                      {item.success ? "ok" : "failed"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {item.deviceLabel ?? "Device"} · {formatRelative(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit logs</CardTitle>
            <CardDescription>Admin-visible workspace security events.</CardDescription>
          </CardHeader>
          <ul className="space-y-2 px-5 pb-5">
            {snapshot.auditLogs.length === 0 ? (
              <li className="text-sm text-muted">No audit events yet.</li>
            ) : (
              snapshot.auditLogs.map((item) => (
                <li key={item.id} className="rounded-xl border border-border/60 px-3 py-2 text-sm">
                  <p className="font-medium">{item.eventType}</p>
                  <p className="mt-1 text-[11px] text-muted">
                    {item.resourceType ?? "resource"} · {formatRelative(item.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  disabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-2">
      <p className="text-sm font-medium">{label}</p>
      <Button
        size="sm"
        variant={enabled ? "primary" : "secondary"}
        disabled={disabled}
        onClick={onToggle}
        aria-pressed={enabled}
      >
        {enabled ? "On" : "Off"}
      </Button>
    </div>
  );
}

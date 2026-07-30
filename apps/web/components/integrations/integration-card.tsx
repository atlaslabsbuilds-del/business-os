"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { IntegrationHubCard } from "@repo/types";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import {
  disconnectIntegrationAction,
  startIntegrationOAuthAction,
} from "../../app/(protected)/actions/integrations";
import {
  formatIntegrationCategory,
  formatRelativeTime,
  IntegrationStatusBadge,
} from "./integration-status";
import { IntegrationProviderLogo } from "./integration-logo";

export function IntegrationCard({ card }: { card: IntegrationHubCard }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const connected = card.status === "connected" || card.status === "syncing";

  function connect() {
    setError(null);
    startTransition(async () => {
      const result = await startIntegrationOAuthAction({ provider: card.id });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      window.location.href = result.data.authUrl;
    });
  }

  function disconnect() {
    if (!card.account) return;
    setError(null);
    startTransition(async () => {
      const result = await disconnectIntegrationAction({
        accountId: card.account!.id,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card
      elevated
      className="bos-float group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-elevated"
    >
      <CardHeader className="mb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IntegrationProviderLogo provider={card.id} name={card.name} />
            <div className="min-w-0">
              <CardTitle className="truncate">{card.name}</CardTitle>
              <CardDescription className="mt-0.5">
                {formatIntegrationCategory(card.category)}
              </CardDescription>
            </div>
          </div>
          <IntegrationStatusBadge status={card.status} />
        </div>
      </CardHeader>

      <p className="mb-4 flex-1 text-sm leading-6 text-secondary">
        {card.description}
      </p>

      {error ? (
        <p className="mb-3 text-xs text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {!connected ? (
          <Button size="sm" loading={pending} onClick={connect}>
            Connect
          </Button>
        ) : (
          <>
            <Link
              href={`/integrations/${card.id}`}
              className="inline-flex h-8 items-center rounded-xl border border-border bg-elevated px-3 text-xs text-foreground transition hover:bg-surface"
            >
              Open
            </Link>
            <Link
              href={`/integrations/${card.id}/settings`}
              className="inline-flex h-8 items-center rounded-xl px-3 text-xs text-secondary transition hover:bg-elevated hover:text-foreground"
            >
              Configure
            </Link>
            <Button
              size="sm"
              variant="danger"
              loading={pending}
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted">
        <span>Last sync · {formatRelativeTime(card.lastSyncAt)}</span>
        <span className="truncate pl-2">
          {(card.account?.permissions ?? card.kairosActions)
            .slice(0, 2)
            .join(" · ") || "OAuth"}
        </span>
      </div>
    </Card>
  );
}

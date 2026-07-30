"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import type {
  IntegrationConnectionStatus,
  IntegrationHubCard,
  IntegrationHubCategory,
} from "@repo/types";
import { Button } from "@repo/ui/button";
import { IconSearch } from "@repo/ui/icons";
import { INTEGRATION_HUB_CATEGORIES } from "../../lib/integrations-hub/categories";
import { IntegrationCard } from "./integration-card";
import { IntegrationCardSkeleton } from "./integration-skeletons";

const STATUS_OPTIONS: { value: "" | IntegrationConnectionStatus; label: string }[] =
  [
    { value: "", label: "All statuses" },
    { value: "connected", label: "Connected" },
    { value: "not_connected", label: "Not Connected" },
    { value: "error", label: "Error" },
    { value: "syncing", label: "Syncing" },
  ];

export function IntegrationsHubClient({
  cards,
  connectedCount,
  initialQuery,
  initialCategory,
  initialStatus,
  errorMessage,
}: {
  cards: IntegrationHubCard[];
  connectedCount: number;
  initialQuery?: string;
  initialCategory?: IntegrationHubCategory;
  initialStatus?: IntegrationConnectionStatus;
  errorMessage?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery ?? "");
  const deferredQuery = useDeferredValue(query);
  const [refreshing, startRefresh] = useTransition();
  const category = (initialCategory ?? "featured") as IntegrationHubCategory;
  const status = initialStatus;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (deferredQuery.trim()) params.set("q", deferredQuery.trim());
      else params.delete("q");
      const next = params.toString();
      const current = searchParams.toString();
      if (next !== current) {
        router.replace(next ? `${pathname}?${next}` : pathname);
      }
    }, 220);
    return () => window.clearTimeout(handle);
  }, [deferredQuery, pathname, router, searchParams]);

  function setCategory(next: IntegrationHubCategory) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "featured") params.delete("category");
    else params.set("category", next);
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  function setStatusFilter(next: "" | IntegrationConnectionStatus) {
    const params = new URLSearchParams(searchParams.toString());
    if (!next) params.delete("status");
    else params.set("status", next);
    router.push(params.toString() ? `${pathname}?${params}` : pathname);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="bos-glass flex w-full max-w-xl items-center gap-2 rounded-2xl px-3 py-2">
          <IconSearch className="text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search integrations by name, category, or status"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            aria-label="Search integrations"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bos-glass rounded-xl px-3 py-2 text-xs text-secondary">
            <span className="font-semibold text-accent">{connectedCount}</span>{" "}
            connected
          </span>
          <select
            className="bos-glass h-9 rounded-xl bg-transparent px-3 text-xs text-secondary outline-none"
            value={status ?? ""}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "" | IntegrationConnectionStatus,
              )
            }
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="secondary"
            loading={refreshing}
            onClick={() => startRefresh(() => router.refresh())}
          >
            Refresh
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div
          className="bos-glass rounded-2xl border border-error/30 px-4 py-3 text-sm text-error"
          role="alert"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="bos-glass h-fit space-y-1 rounded-2xl p-2 lg:sticky lg:top-4">
          <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            Categories
          </p>
          {INTEGRATION_HUB_CATEGORIES.map((item) => {
            const active = category === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCategory(item.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                  active
                    ? "bg-primary/15 text-accent"
                    : "text-secondary hover:bg-elevated hover:text-foreground"
                }`}
              >
                {item.emoji ? <span aria-hidden>{item.emoji}</span> : null}
                {item.label}
              </button>
            );
          })}
        </aside>

        <div>
          {refreshing ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <IntegrationCardSkeleton key={index} />
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="bos-glass-strong flex min-h-[320px] flex-col items-center justify-center rounded-[24px] px-6 py-12 text-center">
              <p className="text-lg font-semibold">No integrations match</p>
              <p className="mt-2 max-w-md text-sm text-secondary">
                Try another category, clear your search, or connect a Featured
                tool so Kairos can automate your workflows.
              </p>
              <Link
                href="/integrations"
                className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm text-white"
              >
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((card) => (
                <IntegrationCard key={card.id} card={card} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

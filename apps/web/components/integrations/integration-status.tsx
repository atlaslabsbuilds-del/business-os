import type { IntegrationConnectionStatus } from "@repo/types";
import { Badge } from "@repo/ui/badge";

const STATUS_LABEL: Record<IntegrationConnectionStatus, string> = {
  connected: "Connected",
  not_connected: "Not Connected",
  error: "Error",
  syncing: "Syncing",
  disconnected: "Not Connected",
};

const STATUS_VARIANT: Record<
  IntegrationConnectionStatus,
  "success" | "default" | "error" | "warning" | "info"
> = {
  connected: "success",
  not_connected: "default",
  disconnected: "default",
  error: "error",
  syncing: "info",
};

export function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationConnectionStatus;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
  );
}

export function formatIntegrationCategory(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Never";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return date.toLocaleDateString();
}

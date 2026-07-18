"use client";

import { useTransition } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { WorkspaceMembership } from "@repo/types";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { cn } from "@repo/ui/utils";
import { switchWorkspaceAction } from "../../app/(protected)/actions/workspace";

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceMembership[];
  activeWorkspaceId: string;
}) {
  const [pending, startTransition] = useTransition();
  const active =
    workspaces.find((item) => item.workspace.id === activeWorkspaceId) ??
    workspaces[0];

  if (!active) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-between px-2.5"
          loading={pending}
        >
          <span className="truncate text-left">
            <span className="block truncate text-xs text-muted">Workspace</span>
            <span className="block truncate text-sm font-medium text-foreground">
              {active.workspace.name}
            </span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((item) => {
          const selected = item.workspace.id === active.workspace.id;
          return (
            <DropdownMenuItem
              key={item.workspace.id}
              onSelect={() => {
                if (selected) return;
                startTransition(async () => {
                  await switchWorkspaceAction(item.workspace.id);
                });
              }}
              className={cn(selected && "text-foreground")}
            >
              <span className="min-w-0 flex-1 truncate">{item.workspace.name}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted">
                {item.role}
              </span>
              {selected ? <Check className="h-3.5 w-3.5 text-accent-hover" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

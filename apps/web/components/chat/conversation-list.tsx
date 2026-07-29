"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { Input } from "@repo/ui/input";
import { cn } from "@repo/ui/utils";
import type { ChatConversation } from "@repo/types";

type ConversationListProps = {
  conversations: ChatConversation[];
  activeId?: string;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<void>;
  onDelete: (conversationId: string) => Promise<void>;
  onPin: (conversationId: string, pinned: boolean) => Promise<void>;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
  onRename,
  onDelete,
  onPin,
}: ConversationListProps) {
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  function openRename(conversation: ChatConversation) {
    setRenameId(conversation.id);
    setRenameValue(conversation.title);
  }

  async function submitRename() {
    if (!renameId || !renameValue.trim()) return;
    setBusyId(renameId);
    try {
      await onRename(renameId, renameValue.trim());
      setRenameId(null);
    } finally {
      setBusyId(null);
    }
  }

  if (conversations.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-xs text-muted">
        No conversations yet. Start a new chat.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1 p-2">
        {(["Pinned", "Recent"] as const).map((section) => {
          const sectionConversations = conversations.filter((conversation) =>
            section === "Pinned" ? conversation.pinned : !conversation.pinned,
          );
          if (sectionConversations.length === 0) return null;

          return (
            <React.Fragment key={section}>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted first:pt-1">
                {section}
              </p>
              {sectionConversations.map((conversation) => {
          const active = conversation.id === activeId;
          return (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-xl pr-1 transition",
                active ? "bg-accent-muted" : "hover:bg-elevated",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
              >
                {conversation.pinned ? (
                  <span className="text-[10px] text-primary">PIN</span>
                ) : null}
                <span className="truncate text-foreground/90">{conversation.title}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0 opacity-0 group-hover:opacity-100"
                  >
                    ···
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openRename(conversation)}>
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      setBusyId(conversation.id);
                      try {
                        await onPin(conversation.id, !conversation.pinned);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    {conversation.pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-error"
                    onClick={async () => {
                      setBusyId(conversation.id);
                      try {
                        await onDelete(conversation.id);
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {busyId === conversation.id ? (
                <span className="pr-2 text-[10px] text-muted">…</span>
              ) : null}
            </div>
          );
              })}
            </React.Fragment>
          );
        })}
      </div>

      <Dialog open={renameId !== null} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Conversation title"
            autoFocus
          />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setRenameId(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitRename} loading={busyId === renameId}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

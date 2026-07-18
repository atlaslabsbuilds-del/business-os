"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { IconSearch, IconSparkles } from "@repo/ui/icons";
import { Badge } from "@repo/ui/badge";
import type { ChatConversation } from "@repo/types";
import { ConversationList } from "./conversation-list";

type ChatSidebarProps = {
  conversations: ChatConversation[];
  activeId?: string;
  creditBalance: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewChat: () => void;
  onSelect: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<void>;
  onDelete: (conversationId: string) => Promise<void>;
  onPin: (conversationId: string, pinned: boolean) => Promise<void>;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export function ChatSidebar({
  conversations,
  activeId,
  creditBalance,
  searchQuery,
  onSearchChange,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onPin,
  mobileOpen,
  onMobileClose,
}: ChatSidebarProps) {
  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}
      <aside
        className={[
          "z-50 flex w-72 shrink-0 flex-col border-r border-border bg-surface/90 backdrop-blur",
          "fixed inset-y-0 left-0 transition duration-200 lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <IconSparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold">AI Chat</span>
          </div>
          <Badge variant="accent">{creditBalance.toLocaleString()} credits</Badge>
        </div>

        <div className="space-y-3 border-b border-border p-3">
          <Button type="button" className="w-full" onClick={onNewChat}>
            New chat
          </Button>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search conversations"
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            onSelect={(id) => {
              onSelect(id);
              onMobileClose?.();
            }}
            onRename={onRename}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>
      </aside>
    </>
  );
}

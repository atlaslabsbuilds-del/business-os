"use client";

import * as React from "react";
import { Button } from "@repo/ui/button";
import { IconMenu } from "@repo/ui/icons";
import type { ChatConversation, ChatMessage } from "@repo/types";
import type { ChatModelOption } from "@repo/ai";
import type { AiProviderId } from "@repo/ai";
import {
  deleteChatConversationAction,
  loadChatConversationAction,
  listChatConversationsAction,
  pinChatConversationAction,
  renameChatConversationAction,
} from "../../app/(protected)/actions/chat";
import { streamChatRequest } from "../../lib/chat-stream";
import { ChatSidebar } from "./chat-sidebar";
import { Composer } from "./composer";
import { EmptyState } from "./empty-state";
import { MessageList } from "./message-list";

type ChatLayoutProps = {
  initialConversations: ChatConversation[];
  initialConversationId?: string;
  initialMessages: ChatMessage[];
  models: ChatModelOption[];
  initialModel: string;
  initialProvider: AiProviderId;
  initialCreditBalance: number;
};

function createLocalMessage(input: {
  role: ChatMessage["role"];
  content: string;
  conversationId: string;
}): ChatMessage {
  return {
    id: `local-${crypto.randomUUID()}`,
    conversationId: input.conversationId,
    role: input.role,
    content: input.content,
    model: null,
    inputTokens: 0,
    outputTokens: 0,
    createdAt: new Date().toISOString(),
  };
}

export function ChatLayout({
  initialConversations,
  initialConversationId,
  initialMessages,
  models,
  initialModel,
  initialProvider,
  initialCreditBalance,
}: ChatLayoutProps) {
  const [conversations, setConversations] = React.useState(initialConversations);
  const [activeId, setActiveId] = React.useState<string | undefined>(
    initialConversationId,
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = React.useState("");
  const [model, setModel] = React.useState(initialModel);
  const [provider, setProvider] = React.useState<AiProviderId>(initialProvider);
  const [creditBalance, setCreditBalance] = React.useState(initialCreditBalance);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState("");
  const [usageLabel, setUsageLabel] = React.useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const searchTimer = React.useRef<number | null>(null);

  const refreshConversations = React.useCallback(async (query?: string) => {
    const result = await listChatConversationsAction({ query });
    if (result.ok) {
      setConversations(result.data.conversations);
    }
  }, []);

  React.useEffect(() => {
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    searchTimer.current = window.setTimeout(() => {
      void refreshConversations(searchQuery || undefined);
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [searchQuery, refreshConversations]);

  async function selectConversation(conversationId: string) {
    setError(null);
    setActiveId(conversationId);
    const result = await loadChatConversationAction({ conversationId });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessages(result.data.messages.filter((m) => m.role !== "system"));
    setModel(result.data.conversation.model);
    setProvider(result.data.conversation.provider);
    setUsageLabel(null);
  }

  function handleNewChat() {
    setActiveId(undefined);
    setMessages([]);
    setDraft("");
    setUsageLabel(null);
    setError(null);
  }

  async function runStream(input: {
    message: string;
    conversationId?: string;
    regenerate?: boolean;
  }) {
    setError(null);
    setIsStreaming(true);
    setStreamingContent("");
    setUsageLabel(null);

    const controller = new AbortController();
    abortRef.current = controller;

    let conversationId = input.conversationId;
    let assistantContent = "";

    if (!input.regenerate) {
      const tempUser = createLocalMessage({
        role: "user",
        content: input.message,
        conversationId: conversationId ?? "pending",
      });
      setMessages((prev) => [...prev, tempUser]);
      setDraft("");
    }

    try {
      await streamChatRequest(
        {
          conversationId,
          message: input.message,
          model,
          provider,
          regenerate: input.regenerate,
          signal: controller.signal,
        },
        {
          onEvent(event) {
            if (event.type === "conversation") {
              conversationId = event.conversationId;
              setActiveId(event.conversationId);
            }
            if (event.type === "text_delta") {
              assistantContent += event.text;
              setStreamingContent(assistantContent);
            }
            if (event.type === "usage") {
              setCreditBalance(event.balance);
              setUsageLabel(
                `${event.usage.totalTokens} tokens · ${event.credits} credits`,
              );
            }
            if (event.type === "message") {
              setMessages((prev) => {
                const users = prev.filter(
                  (m) => m.role === "user" && m.id.startsWith("local-"),
                );
                const assistant = createLocalMessage({
                  role: "assistant",
                  content: event.content,
                  conversationId: conversationId ?? "unknown",
                });
                assistant.id = event.messageId;
                const persisted = prev.filter((m) => !m.id.startsWith("local-"));
                return [...persisted, ...users, assistant];
              });
              setStreamingContent("");
            }
            if (event.type === "done" && conversationId) {
              void loadChatConversationAction({ conversationId }).then((result) => {
                if (result.ok) {
                  setMessages(result.data.messages.filter((m) => m.role !== "system"));
                }
              });
            }
            if (event.type === "error") {
              setError(event.message);
            }
          },
        },
      );
      await refreshConversations(searchQuery || undefined);
    } catch (streamError) {
      if (streamError instanceof Error && streamError.name === "AbortError") {
        if (assistantContent) {
          setMessages((prev) => [
            ...prev.filter((m) => !m.id.startsWith("local-")),
            createLocalMessage({
              role: "assistant",
              content: assistantContent,
              conversationId: conversationId ?? "unknown",
            }),
          ]);
        }
      } else {
        setError(
          streamError instanceof Error ? streamError.message : "Stream failed",
        );
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  }

  async function handleSubmit() {
    const text = draft.trim();
    if (!text || isStreaming) return;
    await runStream({ message: text, conversationId: activeId });
  }

  async function handleRegenerate() {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser || !activeId || isStreaming) return;
    setMessages((prev) => {
      const copy = [...prev];
      if (copy[copy.length - 1]?.role === "assistant") {
        copy.pop();
      }
      return copy;
    });
    await runStream({
      message: lastUser.content,
      conversationId: activeId,
      regenerate: true,
    });
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleRename(conversationId: string, title: string) {
    const result = await renameChatConversationAction({ conversationId, title });
    if (result.ok) {
      setConversations((prev) =>
        prev.map((item) =>
          item.id === conversationId ? result.data.conversation : item,
        ),
      );
    }
  }

  async function handleDelete(conversationId: string) {
    const result = await deleteChatConversationAction({ conversationId });
    if (result.ok) {
      setConversations((prev) => prev.filter((item) => item.id !== conversationId));
      if (activeId === conversationId) {
        handleNewChat();
      }
    }
  }

  async function handlePin(conversationId: string, pinned: boolean) {
    const result = await pinChatConversationAction({ conversationId, pinned });
    if (result.ok) {
      await refreshConversations(searchQuery || undefined);
    }
  }

  return (
    <div className="-mx-4 -my-4 flex h-[calc(100vh-3.5rem)] overflow-hidden sm:-mx-6 lg:-mx-8 lg:h-[calc(100vh-4rem)]">
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        creditBalance={creditBalance}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewChat={handleNewChat}
        onSelect={selectConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        onPin={handlePin}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <IconMenu />
            </Button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {activeId
                  ? conversations.find((c) => c.id === activeId)?.title ?? "Chat"
                  : "New conversation"}
              </h1>
              {usageLabel ? (
                <p className="text-xs text-muted">{usageLabel}</p>
              ) : null}
            </div>
          </div>
        </header>

        {error ? (
          <div className="border-b border-error/30 bg-error/10 px-4 py-2 text-sm text-error sm:px-6">
            {error}
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isStreaming ? (
            <EmptyState
              onSuggestion={(text) => {
                setDraft(text);
              }}
            />
          ) : (
            <MessageList
              messages={
                isStreaming && streamingContent
                  ? [
                      ...messages,
                      createLocalMessage({
                        role: "assistant",
                        content: streamingContent,
                        conversationId: activeId ?? "pending",
                      }),
                    ]
                  : messages
              }
              streamingContent={streamingContent}
              isStreaming={isStreaming}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>

        <Composer
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onStop={handleStop}
          isStreaming={isStreaming}
          models={models}
          model={model}
          provider={provider}
          onModelChange={(nextModel, nextProvider) => {
            setModel(nextModel);
            setProvider(nextProvider);
          }}
        />
      </div>
    </div>
  );
}

import type { ChatStreamEvent } from "@repo/ai";
import type { KairosCustomerContext, KairosSelectedRecord } from "@repo/types";

export type StreamChatInput = {
  conversationId?: string;
  message: string;
  model?: string;
  provider?: string;
  regenerate?: boolean;
  signal?: AbortSignal;
  endpoint?: string;
  kairosContext?: {
    currentPage?: string;
    selectedCustomer?: KairosCustomerContext;
    selectedRecords?: KairosSelectedRecord[];
  };
};

export type StreamChatCallbacks = {
  onEvent: (event: ChatStreamEvent) => void;
};

export async function streamChatRequest(
  input: StreamChatInput,
  callbacks: StreamChatCallbacks,
): Promise<void> {
  const endpoint = input.endpoint ?? "/api/chat/stream";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: input.conversationId,
      message: input.message,
      model: input.model,
      provider: input.provider,
      regenerate: input.regenerate,
      kairosContext: input.kairosContext,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    let message = "Chat request failed";
    try {
      const payload = (await response.json()) as { error?: string };
      message = payload.error ?? message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      try {
        const event = JSON.parse(json) as ChatStreamEvent;
        callbacks.onEvent(event);
      } catch {
        // ignore malformed chunks
      }
    }
  }
}

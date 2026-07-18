import type { AiMessage } from "../types/ai";

export type StoredChatMessage = {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export function toAiMessages(messages: StoredChatMessage[]): AiMessage[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function ensureSystemMessage(
  messages: AiMessage[],
  systemPrompt: string,
): AiMessage[] {
  if (messages.some((message) => message.role === "system")) {
    return messages;
  }
  return [{ role: "system", content: systemPrompt }, ...messages];
}

export function visibleChatMessages<T extends { role: string }>(messages: T[]): T[] {
  return messages.filter((message) => message.role !== "system");
}

export function truncateForTitle(text: string, max = 48): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) {
    return trimmed || "New chat";
  }
  return `${trimmed.slice(0, max - 1)}…`;
}

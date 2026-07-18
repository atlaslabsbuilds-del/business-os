import type { AiGateway } from "../gateway";
import type { AiMessage, MemoryStore } from "../types/ai";
import { createMemoryStore } from "./memory";

export type ConversationSession = {
  sessionId: string;
  send: (content: string) => Promise<{
    reply: string;
    messages: AiMessage[];
  }>;
  history: (limit?: number) => Promise<AiMessage[]>;
  clear: () => Promise<void>;
};

export async function createConversationSession(input: {
  gateway: AiGateway;
  memory?: MemoryStore;
  sessionId?: string;
  userId?: string;
  workspaceId?: string;
  systemPrompt?: string;
  model?: string;
}): Promise<ConversationSession> {
  const memory = input.memory ?? createMemoryStore();
  const session =
    input.sessionId && (await memory.getSession(input.sessionId))
      ? { id: input.sessionId }
      : await memory.createSession({
          userId: input.userId,
          workspaceId: input.workspaceId,
        });

  if (input.systemPrompt) {
    const existing = await memory.getMessages(session.id, 1);
    if (existing.length === 0) {
      await memory.appendMessages(session.id, [
        { role: "system", content: input.systemPrompt },
      ]);
    }
  }

  return {
    sessionId: session.id,

    async history(limit) {
      return memory.getMessages(session.id, limit);
    },

    async clear() {
      await memory.clearSession(session.id);
    },

    async send(content) {
      await memory.appendMessages(session.id, [{ role: "user", content }]);
      const history = await memory.getMessages(session.id);
      const response = await input.gateway.complete({
        messages: history,
        model: input.model,
      });

      const reply =
        typeof response.message.content === "string"
          ? response.message.content
          : response.message.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("\n");

      await memory.appendMessages(session.id, [
        { role: "assistant", content: reply },
      ]);

      return {
        reply,
        messages: await memory.getMessages(session.id),
      };
    },
  };
}

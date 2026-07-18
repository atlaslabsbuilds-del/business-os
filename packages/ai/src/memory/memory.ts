import type { AiMessage, MemoryMessage, MemorySession, MemoryStore } from "../types/ai";
import { createId } from "../utils";

/**
 * In-memory conversation store for local/dev and unit usage.
 * Swap for Redis/Postgres-backed implementations in production modules.
 */
export class InMemoryMemoryStore implements MemoryStore {
  private sessions = new Map<string, MemorySession>();
  private messages = new Map<string, MemoryMessage[]>();

  async getSession(sessionId: string): Promise<MemorySession | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async createSession(input?: {
    userId?: string;
    workspaceId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<MemorySession> {
    const now = new Date().toISOString();
    const session: MemorySession = {
      id: createId("session"),
      userId: input?.userId,
      workspaceId: input?.workspaceId,
      metadata: input?.metadata,
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(session.id, session);
    this.messages.set(session.id, []);
    return session;
  }

  async appendMessages(
    sessionId: string,
    messages: AiMessage[],
  ): Promise<MemoryMessage[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Unknown memory session: ${sessionId}`);
    }

    const existing = this.messages.get(sessionId) ?? [];
    const appended = messages.map((message) => ({
      ...message,
      id: createId("msg"),
      createdAt: new Date().toISOString(),
    }));
    const next = [...existing, ...appended];
    this.messages.set(sessionId, next);
    this.sessions.set(sessionId, {
      ...session,
      updatedAt: new Date().toISOString(),
    });
    return appended;
  }

  async getMessages(sessionId: string, limit?: number): Promise<MemoryMessage[]> {
    const all = this.messages.get(sessionId) ?? [];
    if (!limit || limit <= 0) {
      return [...all];
    }
    return all.slice(-limit);
  }

  async clearSession(sessionId: string): Promise<void> {
    this.messages.set(sessionId, []);
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.set(sessionId, {
        ...session,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

export function createMemoryStore(): MemoryStore {
  return new InMemoryMemoryStore();
}

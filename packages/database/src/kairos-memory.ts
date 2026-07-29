import type { KairosMemoryContext, KairosCustomerContext } from "@repo/types";
import { listConversations } from "./chat";
import {
  createWorkspaceAiMemory,
  getWorkspaceAiSettings,
  listWorkspaceAiMemory,
  updateWorkspaceAiMemory,
} from "./workspace-memory";

export type KairosSessionContextInput = {
  workspaceId: string;
  userId: string;
  workspaceName: string;
  currentPage?: string;
  selectedCustomer?: KairosCustomerContext;
};

export async function getKairosMemoryContext(input: {
  workspaceId: string;
  userId: string;
  workspaceName: string;
  currentPage?: string;
  selectedCustomer?: KairosCustomerContext;
}): Promise<KairosMemoryContext> {
  const [settings, memories, previousChats] = await Promise.all([
    getWorkspaceAiSettings({ workspaceId: input.workspaceId }),
    listWorkspaceAiMemory({
      workspaceId: input.workspaceId,
      userId: input.userId,
      limit: 50,
    }),
    listConversations({
      workspaceId: input.workspaceId,
      userId: input.userId,
    }),
  ]);

  const preferences: Record<string, unknown> = {};
  if (settings.memoryEnabled) {
    for (const memory of memories.filter((item) => item.scope === "preferences")) {
      const key = typeof memory.metadata.key === "string"
        ? memory.metadata.key
        : memory.fact;
      preferences[key] = memory.metadata.value ?? memory.fact;
    }
  }

  return {
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName,
    currentPage: input.currentPage,
    selectedCustomer: input.selectedCustomer,
    preferences,
    previousChats: previousChats.slice(0, 20).map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      pinned: conversation.pinned,
      updatedAt: conversation.updatedAt,
    })),
  };
}

export async function rememberKairosSessionContext(
  input: KairosSessionContextInput,
): Promise<void> {
  const settings = await getWorkspaceAiSettings({ workspaceId: input.workspaceId });
  if (!settings.memoryEnabled) return;

  const existing = await listWorkspaceAiMemory({
    workspaceId: input.workspaceId,
    sourceModule: "kairos",
    userId: input.userId,
    limit: 10,
  });
  const fact = JSON.stringify({
    workspaceName: input.workspaceName,
    currentPage: input.currentPage,
    selectedCustomer: input.selectedCustomer,
  });

  const current = existing.find((memory) => memory.scope === "session");
  if (current) {
    await updateWorkspaceAiMemory({
      workspaceId: input.workspaceId,
      memoryId: current.id,
      fact,
      summary: "Current Kairos session context",
      scope: "session",
      metadata: { kind: "session_context", userId: input.userId },
    });
    return;
  }

  await createWorkspaceAiMemory({
    workspaceId: input.workspaceId,
    userId: input.userId,
    sourceModule: "kairos",
    scope: "session",
    fact,
    summary: "Current Kairos session context",
    importance: 3,
    metadata: { kind: "session_context", userId: input.userId },
  });
}

export async function rememberKairosPreference(input: {
  workspaceId: string;
  userId: string;
  key: string;
  value: unknown;
}): Promise<void> {
  const settings = await getWorkspaceAiSettings({ workspaceId: input.workspaceId });
  if (!settings.memoryEnabled) return;

  const existing = await listWorkspaceAiMemory({
    workspaceId: input.workspaceId,
    sourceModule: "kairos",
    userId: input.userId,
    limit: 50,
  });
  const current = existing.find(
    (memory) =>
      memory.scope === "preferences" &&
      memory.metadata.key === input.key,
  );
  const metadata = {
    kind: "preference",
    key: input.key,
    value: input.value,
    userId: input.userId,
  };

  if (current) {
    await updateWorkspaceAiMemory({
      workspaceId: input.workspaceId,
      memoryId: current.id,
      fact: `${input.key}: ${String(input.value)}`,
      scope: "preferences",
      metadata,
    });
    return;
  }

  await createWorkspaceAiMemory({
    workspaceId: input.workspaceId,
    userId: input.userId,
    sourceModule: "kairos",
    scope: "preferences",
    fact: `${input.key}: ${String(input.value)}`,
    importance: 3,
    metadata,
  });
}

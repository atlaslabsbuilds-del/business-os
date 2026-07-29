export type KairosCustomerContext = {
  id: string;
  name?: string;
  email?: string;
};

export type KairosSelectedRecord = {
  type: "customer" | "deal" | "company" | "task" | "event" | "thread" | string;
  id: string;
  label?: string;
};

export type KairosMemoryContext = {
  workspaceId: string;
  workspaceName: string;
  currentPage?: string;
  selectedCustomer?: KairosCustomerContext;
  preferences: Record<string, unknown>;
  previousChats: Array<{
    id: string;
    title: string;
    pinned: boolean;
    updatedAt: string;
  }>;
};

export type KairosMemoryRecord = {
  id: string;
  workspaceId: string;
  userId?: string;
  scope: "workspace" | "session" | "preferences" | "customer" | string;
  content: string;
  category?: string;
  importance: number;
  metadata?: Record<string, unknown>;
  embedding?: number[];
  embeddingModel?: string;
  createdAt: string;
  updatedAt: string;
};

/** Provider-neutral contract for future vector/semantic search adapters. */
export type KairosSemanticSearchAdapter = {
  upsert: (records: KairosMemoryRecord[]) => Promise<void>;
  search: (input: {
    workspaceId: string;
    query: string;
    topK?: number;
    filters?: Record<string, unknown>;
  }) => Promise<Array<KairosMemoryRecord & { score: number }>>;
  delete: (ids: string[], workspaceId: string) => Promise<void>;
};

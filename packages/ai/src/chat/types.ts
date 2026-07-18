import type { AiProviderId, AiUsage, AiCost } from "../types/ai";

export type ChatStreamEvent =
  | { type: "conversation"; conversationId: string }
  | { type: "text_delta"; text: string }
  | { type: "usage"; usage: AiUsage; cost: AiCost; credits: number; balance: number }
  | { type: "message"; messageId: string; role: "assistant"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type ChatContext = {
  workspaceId: string;
  userId: string;
  conversationId: string;
  model: string;
  provider: AiProviderId;
};

export type ChatTurnInput = {
  workspaceId: string;
  userId: string;
  conversationId?: string;
  message: string;
  model?: string;
  provider?: AiProviderId;
  regenerate?: boolean;
};

export type ChatTurnResult = {
  conversationId: string;
  assistantMessageId: string;
  content: string;
  usage: AiUsage;
  cost: AiCost;
  creditsDeducted: number;
  creditBalance: number;
};

export type ChatModelOption = {
  id: string;
  provider: AiProviderId;
  model: string;
  label: string;
};

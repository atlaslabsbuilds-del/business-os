import { getUser } from "@repo/auth/server";
import {
  createChatService,
  createChatGateway,
  createSseResponse,
  type ChatRepository,
  type CreditRepository,
} from "@repo/ai";
import {
  createConversation,
  deleteLastAssistantMessage,
  getConversation,
  insertMessage,
  listMessages,
  updateConversation,
} from "@repo/database/chat";
import { deductWorkspaceCredits } from "@repo/database/credits";
import { getMembershipRole } from "@repo/database/workspace";
import { chatStreamRequestSchema } from "@repo/types";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gateway = createChatGateway();

const chatRepo: ChatRepository = {
  async getConversation(conversationId) {
    const conversation = await getConversation({ conversationId });
    if (!conversation) return null;
    return {
      id: conversation.id,
      workspaceId: conversation.workspaceId,
      userId: conversation.userId,
      title: conversation.title,
      model: conversation.model,
      provider: conversation.provider,
    };
  },
  async createConversation(input) {
    const conversation = await createConversation(input);
    return { id: conversation.id };
  },
  async updateConversation(input) {
    await updateConversation(input);
  },
  async listMessages(conversationId) {
    const messages = await listMessages({ conversationId });
    return messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
    }));
  },
  async insertMessage(input) {
    const message = await insertMessage(input);
    return { id: message.id };
  },
  async deleteLastAssistantMessage(conversationId) {
    await deleteLastAssistantMessage({ conversationId });
  },
};

const creditRepo: CreditRepository = {
  async deduct(input) {
    return deductWorkspaceCredits(input);
  },
};

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const context = await resolveActiveWorkspace();
  if (!context) {
    return Response.json({ error: "No active workspace" }, { status: 403 });
  }

  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatStreamRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const chat = createChatService({
    gateway,
    chatRepo,
    creditRepo,
    workspaceName: context.active.workspace.name,
  });

  try {
    const stream = await chat.streamTurn({
      workspaceId: context.active.workspace.id,
      userId: user.id,
      conversationId: parsed.data.conversationId,
      message: parsed.data.message,
      model: parsed.data.model,
      provider: parsed.data.provider,
      regenerate: parsed.data.regenerate,
    });

    return createSseResponse(stream);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 },
    );
  }
}

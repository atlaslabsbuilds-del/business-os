import { redirect } from "next/navigation";
import { listChatModels } from "@repo/ai";
import { listConversations, listMessages } from "@repo/database/chat";
import { getWorkspaceCredits } from "@repo/database/credits";
import { ChatLayout } from "../../../components/chat/chat-layout";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

type ChatPageProps = {
  searchParams: Promise<{ c?: string; prompt?: string }>;
};

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const context = await resolveActiveWorkspace();
  if (!context) {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const conversationId = params.c;
  const initialPrompt = params.prompt?.trim() || undefined;

  const [conversations, credits] = await Promise.all([
    listConversations({
      workspaceId: context.active.workspace.id,
      userId: context.userId,
    }),
    getWorkspaceCredits({ workspaceId: context.active.workspace.id }),
  ]);

  const models = listChatModels();
  const defaultModel = models[0]?.model ?? "gpt-4o-mini";
  const defaultProvider = models[0]?.provider ?? "openai";

  let initialMessages: Awaited<ReturnType<typeof listMessages>> = [];
  let activeConversationId = conversationId;
  let activeModel = defaultModel;
  let activeProvider = defaultProvider;

  if (conversationId) {
    const conversation = conversations.find((item) => item.id === conversationId);
    if (conversation) {
      initialMessages = await listMessages({ conversationId });
      activeModel = conversation.model;
      activeProvider = conversation.provider;
    } else {
      activeConversationId = undefined;
    }
  }

  return (
    <ChatLayout
      initialConversations={conversations}
      initialConversationId={activeConversationId}
      initialMessages={initialMessages.filter((m) => m.role !== "system")}
      models={models}
      initialModel={activeModel}
      initialProvider={activeProvider}
      initialCreditBalance={credits.balance}
      initialPrompt={initialPrompt}
    />
  );
}

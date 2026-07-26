"use server";

import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { getMembershipRole } from "@repo/database/workspace";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import {
  AGENT_SYSTEM_PROMPT,
  completionInputSchema,
  createAgentRuntime,
  createGateway,
  createMemoryStore,
  createToolRegistry,
  createConversationSession,
  echoTool,
  agentObjectiveSchema,
  renderPromptTemplate,
  getPromptTemplate,
} from "@repo/ai";

const gateway = createGateway({
  routingStrategy: "balanced",
  maxRetries: 2,
});

const memory = createMemoryStore();
const tools = createToolRegistry([echoTool]);
const agents = createAgentRuntime({ gateway, tools });

export type AiActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAiContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("Forbidden");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: context.active.workspace.id };
}

/**
 * Infrastructure server action: non-streaming completion.
 * Product modules should wrap this with their own authorization + prompts.
 */
export async function aiCompleteAction(
  input: unknown,
): Promise<
  AiActionResult<{
    text: string;
    model: string;
    provider: string;
    usage: { totalTokens: number };
    cost: { totalCost: number };
  }>
> {
  try {
    await requireAiContext();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const parsed = completionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const response = await gateway.complete({
      messages: parsed.data.messages,
      model: parsed.data.model,
      provider: parsed.data.provider,
      temperature: parsed.data.temperature,
      maxTokens: parsed.data.maxTokens,
      responseFormat: parsed.data.responseFormat,
      route: parsed.data.route,
    });

    const text =
      typeof response.message.content === "string"
        ? response.message.content
        : response.message.content
            .filter((part) => part.type === "text")
            .map((part) => part.text)
            .join("\n");

    return {
      ok: true,
      data: {
        text,
        model: response.model,
        provider: response.provider,
        usage: { totalTokens: response.usage.totalTokens },
        cost: { totalCost: response.cost.totalCost },
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI completion failed",
    };
  }
}

const sessionSchema = z.object({
  message: z.string().trim().min(1),
  sessionId: z.string().optional(),
  model: z.string().optional(),
});

/**
 * Infrastructure server action: conversational turn with memory.
 */
export async function aiChatTurnAction(
  input: unknown,
): Promise<AiActionResult<{ sessionId: string; reply: string }>> {
  try {
    await requireAiContext();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const session = await createConversationSession({
      gateway,
      memory,
      sessionId: parsed.data.sessionId,
      systemPrompt: AGENT_SYSTEM_PROMPT,
      model: parsed.data.model,
    });
    const result = await session.send(parsed.data.message);
    return {
      ok: true,
      data: { sessionId: session.sessionId, reply: result.reply },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "AI chat failed",
    };
  }
}

/**
 * Infrastructure server action: run the generic agent runtime.
 */
export async function aiAgentRunAction(
  input: unknown,
): Promise<
  AiActionResult<{
    finalAnswer: string;
    steps: Array<{ goal: string; status: string; toolName?: string }>;
  }>
> {
  try {
    await requireAiContext();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const parsed = agentObjectiveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    const result = await agents.run(parsed.data);
    return {
      ok: true,
      data: {
        finalAnswer: result.finalAnswer,
        steps: result.plan.steps.map((step) => ({
          goal: step.goal,
          status: step.status,
          toolName: step.toolName,
        })),
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Agent run failed",
    };
  }
}

/**
 * Infrastructure helper action: render a prompt template.
 */
export async function aiRenderPromptAction(input: unknown): Promise<
  AiActionResult<{ prompt: string }>
> {
  try {
    await requireAiContext();
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unauthorized",
    };
  }
  const schema = z.object({
    templateId: z.enum(["summarize", "extractJson", "classify", "rewrite"]),
    values: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])),
  });
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const template = getPromptTemplate(parsed.data.templateId);
  return {
    ok: true,
    data: { prompt: renderPromptTemplate(template, parsed.data.values) },
  };
}

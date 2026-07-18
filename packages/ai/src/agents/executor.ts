import { z } from "zod";
import type { AiGateway } from "../gateway";
import { formatToolResult } from "../tools/executor";
import type { ToolExecutionContext } from "../tools/permissions";
import type { ToolRegistry } from "../tools/registry";
import type {
  AgentPlan,
  AgentPlanStep,
  AiMessage,
  AiCost,
  AiUsage,
} from "../types/ai";
import {
  addCost,
  addUsage,
  emptyCost,
  emptyUsage,
  messageContentToText,
} from "../utils";

const toolArgsSchema = z.record(z.string(), z.unknown());

export async function executeAgentPlan(input: {
  gateway: AiGateway;
  tools: ToolRegistry;
  plan: AgentPlan;
  model?: string;
  sessionId?: string;
  toolContext?: ToolExecutionContext;
  messages?: AiMessage[];
}): Promise<{
  plan: AgentPlan;
  messages: AiMessage[];
  usage: AiUsage;
  cost: AiCost;
}> {
  const messages: AiMessage[] = [...(input.messages ?? [])];
  let usage = emptyUsage();
  let cost = emptyCost();
  const steps: AgentPlanStep[] = [];

  for (const step of input.plan.steps) {
    const running: AgentPlanStep = { ...step, status: "running" };
    try {
      if (step.toolName) {
        const argsResponse = await input.gateway.completeJson({
          model: input.model,
          schema: toolArgsSchema,
          messages: [
            ...messages,
            {
              role: "user",
              content: `Prepare JSON arguments for tool "${step.toolName}" to achieve: ${step.goal}`,
            },
          ],
        });
        usage = addUsage(usage, argsResponse.response.usage);
        cost = addCost(cost, argsResponse.response.cost);

        const result = await input.tools.execute(step.toolName, argsResponse.data, {
          sessionId: input.sessionId,
          ...input.toolContext,
        });

        messages.push({
          role: "assistant",
          content: `Used tool ${step.toolName} for: ${step.goal}`,
        });
        messages.push({
          role: "tool",
          name: step.toolName,
          toolCallId: step.id,
          content: formatToolResult(result),
        });

        steps.push({
          ...running,
          status: "completed",
          result,
        });
      } else {
        const response = await input.gateway.complete({
          model: input.model,
          messages: [
            ...messages,
            { role: "user", content: `Complete this step: ${step.goal}` },
          ],
        });
        usage = addUsage(usage, response.usage);
        cost = addCost(cost, response.cost);
        const text = messageContentToText(response.message.content);
        messages.push({ role: "assistant", content: text });
        steps.push({
          ...running,
          status: "completed",
          result: text,
        });
      }
    } catch (error) {
      steps.push({
        ...running,
        status: "failed",
        error: error instanceof Error ? error.message : "Step failed",
      });
    }
  }

  return {
    plan: { ...input.plan, steps },
    messages,
    usage,
    cost,
  };
}

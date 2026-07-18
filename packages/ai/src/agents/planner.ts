import { z } from "zod";
import type { AiGateway } from "../gateway";
import { AGENT_SYSTEM_PROMPT } from "../prompts/system";
import type { ToolRegistry } from "../tools/registry";
import type { AgentPlan, AgentPlanStep, AiMessage } from "../types/ai";
import { createId } from "../utils";

const planSchema = z.object({
  steps: z.array(
    z.object({
      goal: z.string(),
      toolName: z.string().optional(),
    }),
  ),
});

export async function planAgentSteps(input: {
  gateway: AiGateway;
  objective: string;
  tools: ToolRegistry;
  model?: string;
  context?: AiMessage[];
}): Promise<AgentPlan> {
  const toolNames = input.tools.list().map((tool) => tool.name);
  const { data } = await input.gateway.completeJson({
    model: input.model,
    schema: planSchema,
    messages: [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      ...(input.context ?? []),
      {
        role: "user",
        content: `Create a short JSON plan for this objective.
Available tools: ${toolNames.join(", ") || "none"}
Objective: ${input.objective}
Return JSON: {"steps":[{"goal":"...","toolName":"optional"}]}`,
      },
    ],
  });

  const steps: AgentPlanStep[] = data.steps.map((step) => ({
    id: createId("step"),
    goal: step.goal,
    toolName: step.toolName,
    status: "pending",
  }));

  return {
    id: createId("plan"),
    objective: input.objective,
    steps,
  };
}

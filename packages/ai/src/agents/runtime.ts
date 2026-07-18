import { z } from "zod";
import type { AiGateway } from "../gateway";
import { AGENT_SYSTEM_PROMPT } from "../prompts/system";
import type { ToolRegistry } from "../tools/registry";
import type {
  AgentRunRequest,
  AgentRunResult,
  AiMessage,
} from "../types/ai";
import { addCost, addUsage, emptyCost, emptyUsage, messageContentToText } from "../utils";
import { executeAgentPlan } from "./executor";
import { planAgentSteps } from "./planner";

export type AgentRuntime = {
  run: (request: AgentRunRequest) => Promise<AgentRunResult>;
};

export function createAgentRuntime(input: {
  gateway: AiGateway;
  tools: ToolRegistry;
  defaultModel?: string;
}): AgentRuntime {
  return {
    async run(request) {
      const model = request.model ?? input.defaultModel;
      const maxSteps = request.maxSteps ?? 5;
      const selectedTools = request.tools?.length
        ? request.tools
        : input.tools.list().map((tool) => tool.name);

      // Narrow registry view by temporarily filtering definitions via a proxy list.
      const scoped = {
        list: () =>
          input.tools.list(request.toolContext).filter((tool) => selectedTools.includes(tool.name)),
        definitions: () =>
          input.tools.definitions({
            names: selectedTools,
            context: request.toolContext,
          }),
        execute: (name: string, args: unknown, ctx = {}) =>
          input.tools.execute(name, args, { ...request.toolContext, ...ctx }),
        executeDetailed: (name: string, args: unknown, ctx = {}, callId?: string) =>
          input.tools.executeDetailed(name, args, { ...request.toolContext, ...ctx }, callId),
        get: input.tools.get.bind(input.tools),
        register: input.tools.register.bind(input.tools),
        unregister: input.tools.unregister.bind(input.tools),
      } as ToolRegistry;

      const plan = await planAgentSteps({
        gateway: input.gateway,
        objective: request.objective,
        tools: scoped,
        model,
        context: request.context,
      });

      plan.steps = plan.steps.slice(0, maxSteps);

      const seedMessages: AiMessage[] = [
        { role: "system", content: AGENT_SYSTEM_PROMPT },
        ...(request.context ?? []),
        { role: "user", content: request.objective },
      ];

      const executed = await executeAgentPlan({
        gateway: input.gateway,
        tools: scoped,
        plan,
        model,
        sessionId: request.sessionId,
        toolContext: request.toolContext,
        messages: seedMessages,
      });

      const final = await input.gateway.complete({
        model,
        messages: [
          ...executed.messages,
          {
            role: "user",
            content:
              "Provide the final answer for the original objective based on the steps above.",
          },
        ],
      });

      const usage = addUsage(executed.usage, final.usage);
      const cost = addCost(executed.cost, final.cost);
      const finalAnswer = messageContentToText(final.message.content);

      return {
        plan: executed.plan,
        messages: [...executed.messages, { role: "assistant", content: finalAnswer }],
        finalAnswer,
        usage: usage.totalTokens ? usage : emptyUsage(),
        cost: cost.totalCost ? cost : emptyCost(),
      };
    },
  };
}

export const agentObjectiveSchema = z.object({
  objective: z.string().trim().min(1),
  sessionId: z.string().optional(),
  model: z.string().optional(),
  maxSteps: z.number().int().positive().max(12).optional(),
  tools: z.array(z.string()).optional(),
});

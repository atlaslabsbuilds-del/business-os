import { z } from "zod";
import type { AiToolDefinition } from "../types/ai";
import type { ToolExecutionContext, ToolPermission } from "./permissions";
import { zodToJsonSchema } from "./schemas";

export type ToolHandler<TArgs> = (
  args: TArgs,
  context: ToolExecutionContext,
) => Promise<unknown> | unknown;

export type RegisteredTool<TSchema extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  permissions: ToolPermission[];
  schema: TSchema;
  execute: ToolHandler<z.infer<TSchema>>;
  metadata?: Record<string, unknown>;
};

export function defineTool<TSchema extends z.ZodType>(input: {
  name: string;
  description: string;
  parameters: TSchema;
  permissions?: ToolPermission[];
  metadata?: Record<string, unknown>;
  execute: ToolHandler<z.infer<TSchema>>;
}): RegisteredTool<TSchema> {
  return {
    name: input.name,
    description: input.description,
    parameters: zodToJsonSchema(input.parameters),
    permissions: input.permissions ?? [],
    schema: input.parameters,
    execute: input.execute,
    metadata: input.metadata,
  };
}

export function toToolDefinition(tool: RegisteredTool): AiToolDefinition {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}

/** Bridge legacy AiTool handlers into the registered tool shape. */
export function fromLegacyTool(tool: {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ) => Promise<unknown> | unknown;
  permissions?: ToolPermission[];
}): RegisteredTool {
  return defineTool({
    name: tool.name,
    description: tool.description,
    parameters: z.record(z.string(), z.unknown()),
    permissions: tool.permissions,
    execute: (args, context) =>
      tool.execute(args as Record<string, unknown>, context),
  });
}

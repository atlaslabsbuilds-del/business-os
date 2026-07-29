import type { z } from "zod";
import type {
  KairosActionExecutionContext,
  KairosAgentRole,
  KairosToolDefinition,
} from "./types";

const ROLE_RANK: Record<KairosAgentRole, number> = {
  Viewer: 1,
  Sales: 2,
  Manager: 3,
  Admin: 4,
};

export function mapWorkspaceRoleToKairosRole(role: string): KairosAgentRole {
  if (role === "owner" || role === "admin") return "Admin";
  if (role === "manager") return "Manager";
  if (role === "member") return "Sales";
  return "Viewer";
}

export class KairosToolRegistry {
  private readonly tools = new Map<string, KairosToolDefinition>();

  register<TInput, TResult>(tool: KairosToolDefinition<TInput, TResult>): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Kairos tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool as KairosToolDefinition);
    return this;
  }

  registerMany(tools: KairosToolDefinition[]): this {
    for (const tool of tools) this.register(tool);
    return this;
  }

  get(name: string): KairosToolDefinition | undefined {
    return this.tools.get(name);
  }

  list(): KairosToolDefinition[] {
    return [...this.tools.values()];
  }

  canExecute(
    tool: KairosToolDefinition,
    context: KairosActionExecutionContext,
  ): boolean {
    return ROLE_RANK[context.agentRole] >= ROLE_RANK[tool.requiredRole];
  }

  validateInput<TInput>(
    tool: KairosToolDefinition<TInput>,
    input: unknown,
  ): TInput {
    const parsed = (tool.schema as z.ZodType<TInput>).safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Invalid tool input");
    }
    return parsed.data;
  }

  async execute(
    tool: KairosToolDefinition,
    context: KairosActionExecutionContext,
    input: unknown,
  ) {
    if (!this.canExecute(tool, context)) {
      throw new Error(
        `Unauthorized: ${context.agentRole} cannot execute ${tool.name}.`,
      );
    }
    const validated = this.validateInput(tool, input);
    return tool.execute(context, validated);
  }
}

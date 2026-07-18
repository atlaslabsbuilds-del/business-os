import type { AiLogger, AiToolDefinition } from "../types/ai";
import { createConsoleLogger } from "../utils";
import { echoTool } from "./builtin";
import {
  createToolExecutor,
  InMemoryToolAuditStore,
  type ToolAuditStore,
  type ToolExecutor,
  type ToolRunOutcome,
  type ToolStreamEvent,
} from "./executor";
import {
  filterToolsByPermissions,
  type ToolExecutionContext,
  type ToolPermission,
} from "./permissions";
import type { RegisteredTool } from "./tool";
import { toToolDefinition } from "./tool";

export class ToolRegistry {
  private tools = new Map<string, RegisteredTool>();
  private readonly executor: ToolExecutor;
  private readonly auditStore: ToolAuditStore;

  constructor(options?: {
    logger?: AiLogger;
    maxRetries?: number;
    auditStore?: ToolAuditStore;
    tools?: RegisteredTool[];
  }) {
    const logger = options?.logger ?? createConsoleLogger("@repo/ai/tools");
    this.auditStore = options?.auditStore ?? new InMemoryToolAuditStore();
    this.executor = createToolExecutor({
      logger,
      maxRetries: options?.maxRetries,
      auditStore: this.auditStore,
    });

    for (const tool of options?.tools ?? []) {
      this.register(tool);
    }
  }

  register(tool: RegisteredTool): this {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  registerMany(tools: RegisteredTool[]): this {
    for (const tool of tools) {
      this.register(tool);
    }
    return this;
  }

  unregister(name: string): this {
    this.tools.delete(name);
    return this;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  list(context?: ToolExecutionContext): RegisteredTool[] {
    const tools = [...this.tools.values()];
    if (!context) {
      return tools;
    }
    return filterToolsByPermissions(tools, context);
  }

  definitions(input?: {
    names?: string[];
    context?: ToolExecutionContext;
  }): AiToolDefinition[] {
    const tools = this.resolveTools(input?.names, input?.context);
    return tools.map(toToolDefinition);
  }

  async execute(
    name: string,
    args: unknown,
    context: ToolExecutionContext = {},
  ): Promise<unknown> {
    const outcome = await this.executeDetailed(name, args, context);
    if (!outcome.ok) {
      throw new Error(outcome.error);
    }
    return outcome.result;
  }

  async executeDetailed(
    name: string,
    args: unknown,
    context: ToolExecutionContext = {},
    callId?: string,
  ): Promise<ToolRunOutcome> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        callId: callId ?? name,
        toolName: name,
        ok: false,
        error: `Unknown tool: ${name}`,
        durationMs: 0,
      };
    }

    if (context && tool.permissions.length > 0) {
      const allowed = filterToolsByPermissions([tool], context);
      if (allowed.length === 0) {
        return {
          callId: callId ?? name,
          toolName: name,
          ok: false,
          error: `Permission denied for tool: ${name}`,
          durationMs: 0,
        };
      }
    }

    return this.executor.run({ tool, args, context, callId });
  }

  async *executeStream(
    name: string,
    args: unknown,
    context: ToolExecutionContext = {},
    callId?: string,
  ): AsyncGenerator<ToolStreamEvent> {
    const tool = this.tools.get(name);
    if (!tool) {
      yield {
        callId: callId ?? name,
        toolName: name,
        ok: false,
        error: `Unknown tool: ${name}`,
        durationMs: 0,
      };
      return;
    }

    yield* this.executor.runStream({ tool, args, context, callId });
  }

  auditTrail(filter?: {
    workspaceId?: string;
    userId?: string;
    toolName?: string;
    limit?: number;
  }) {
    return this.auditStore.list(filter);
  }

  permissionsFor(name: string): ToolPermission[] {
    return this.tools.get(name)?.permissions ?? [];
  }

  private resolveTools(names?: string[], context?: ToolExecutionContext): RegisteredTool[] {
    const selected = names?.length
      ? names
          .map((name) => this.tools.get(name))
          .filter((tool): tool is RegisteredTool => Boolean(tool))
      : [...this.tools.values()];

    if (!context) {
      return selected;
    }

    return filterToolsByPermissions(selected, context);
  }
}

export function createToolRegistry(
  tools: RegisteredTool[] = [],
  options?: {
    logger?: AiLogger;
    maxRetries?: number;
    auditStore?: ToolAuditStore;
  },
): ToolRegistry {
  return new ToolRegistry({ ...options, tools });
}

export { echoTool };

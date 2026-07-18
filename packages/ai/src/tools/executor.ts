import type { AiLogger } from "../types/ai";
import { createId, withRetry } from "../utils";
import { assertToolPermissions, type ToolExecutionContext } from "./permissions";
import { parseToolArguments, validateToolArgs } from "./schemas";
import type { RegisteredTool } from "./tool";

export type ToolExecutionResult = {
  callId: string;
  toolName: string;
  ok: true;
  result: unknown;
  formatted: string;
  durationMs: number;
};

export type ToolExecutionFailure = {
  callId: string;
  toolName: string;
  ok: false;
  error: string;
  durationMs: number;
};

export type ToolRunOutcome = ToolExecutionResult | ToolExecutionFailure;

export type ToolStreamEvent =
  | {
      type: "tool_start";
      callId: string;
      name: string;
      arguments: Record<string, unknown>;
    }
  | {
      type: "tool_retry";
      callId: string;
      name: string;
      attempt: number;
      error: string;
    }
  | ToolExecutionResult
  | ToolExecutionFailure;

export type ToolAuditEntry = {
  id: string;
  callId: string;
  toolName: string;
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  durationMs: number;
  createdAt: string;
};

export type ToolAuditStore = {
  append: (entry: ToolAuditEntry) => Promise<void> | void;
  list: (filter?: {
    workspaceId?: string;
    userId?: string;
    toolName?: string;
    limit?: number;
  }) => Promise<ToolAuditEntry[]> | ToolAuditEntry[];
};

export class InMemoryToolAuditStore implements ToolAuditStore {
  private entries: ToolAuditEntry[] = [];

  append(entry: ToolAuditEntry): void {
    this.entries.unshift(entry);
    if (this.entries.length > 500) {
      this.entries.length = 500;
    }
  }

  list(filter?: {
    workspaceId?: string;
    userId?: string;
    toolName?: string;
    limit?: number;
  }): ToolAuditEntry[] {
    let rows = this.entries;
    if (filter?.workspaceId) {
      rows = rows.filter((row) => row.workspaceId === filter.workspaceId);
    }
    if (filter?.userId) {
      rows = rows.filter((row) => row.userId === filter.userId);
    }
    if (filter?.toolName) {
      rows = rows.filter((row) => row.toolName === filter.toolName);
    }
    return rows.slice(0, filter?.limit ?? 50);
  }
}

export function formatToolResult(result: unknown): string {
  if (typeof result === "string") {
    return result;
  }
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

export class ToolExecutor {
  private readonly logger: AiLogger;
  private readonly maxRetries: number;
  private readonly auditStore?: ToolAuditStore;

  constructor(options: {
    logger: AiLogger;
    maxRetries?: number;
    auditStore?: ToolAuditStore;
  }) {
    this.logger = options.logger;
    this.maxRetries = options.maxRetries ?? 2;
    this.auditStore = options.auditStore;
  }

  async run(input: {
    tool: RegisteredTool;
    args: unknown;
    context?: ToolExecutionContext;
    callId?: string;
  }): Promise<ToolRunOutcome> {
    const events: ToolRunOutcome[] = [];
    for await (const event of this.runStream(input)) {
      if ("ok" in event) {
        events.push(event);
      }
    }
    return events[events.length - 1] ?? {
      callId: input.callId ?? createId("tool"),
      toolName: input.tool.name,
      ok: false,
      error: "Tool produced no result",
      durationMs: 0,
    };
  }

  async *runStream(input: {
    tool: RegisteredTool;
    args: unknown;
    context?: ToolExecutionContext;
    callId?: string;
  }): AsyncGenerator<ToolStreamEvent> {
    const callId = input.callId ?? createId("tool");
    const context = input.context ?? {};
    const started = Date.now();

    let parsedArgs: Record<string, unknown>;
    try {
      parsedArgs = parseToolArguments(input.args);
    } catch (error) {
      const failure = this.failure({
        callId,
        toolName: input.tool.name,
        context,
        args: {},
        error: error instanceof Error ? error.message : "Invalid arguments",
        started,
      });
      yield failure;
      return;
    }

    yield {
      type: "tool_start",
      callId,
      name: input.tool.name,
      arguments: parsedArgs,
    };

    try {
      assertToolPermissions({
        required: input.tool.permissions,
        context,
      });
      const validated = validateToolArgs(input.tool.schema, parsedArgs);

      const result = await withRetry(
        async () => input.tool.execute(validated, context),
        {
          maxRetries: this.maxRetries,
          logger: this.logger,
          label: `tool:${input.tool.name}`,
        },
      );

      const success: ToolExecutionResult = {
        callId,
        toolName: input.tool.name,
        ok: true,
        result,
        formatted: formatToolResult(result),
        durationMs: Date.now() - started,
      };

      this.logger.info("tool.execute.success", {
        tool: input.tool.name,
        callId,
        durationMs: success.durationMs,
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      await this.recordAudit({
        callId,
        toolName: input.tool.name,
        context,
        arguments: parsedArgs,
        result,
        durationMs: success.durationMs,
      });

      yield success;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Tool execution failed";
      this.logger.error("tool.execute.failed", {
        tool: input.tool.name,
        callId,
        error: message,
        workspaceId: context.workspaceId,
        userId: context.userId,
      });

      const failure = this.failure({
        callId,
        toolName: input.tool.name,
        context,
        args: parsedArgs,
        error: message,
        started,
      });
      yield failure;
    }
  }

  private failure(input: {
    callId: string;
    toolName: string;
    context: ToolExecutionContext;
    args: Record<string, unknown>;
    error: string;
    started: number;
  }): ToolExecutionFailure {
    const failure: ToolExecutionFailure = {
      callId: input.callId,
      toolName: input.toolName,
      ok: false,
      error: input.error,
      durationMs: Date.now() - input.started,
    };

    void this.recordAudit({
      callId: input.callId,
      toolName: input.toolName,
      context: input.context,
      arguments: input.args,
      error: input.error,
      durationMs: failure.durationMs,
    });

    return failure;
  }

  private async recordAudit(input: {
    callId: string;
    toolName: string;
    context: ToolExecutionContext;
    arguments: Record<string, unknown>;
    result?: unknown;
    error?: string;
    durationMs: number;
  }): Promise<void> {
    if (!this.auditStore) {
      return;
    }

    await this.auditStore.append({
      id: createId("audit"),
      callId: input.callId,
      toolName: input.toolName,
      userId: input.context.userId,
      workspaceId: input.context.workspaceId,
      sessionId: input.context.sessionId,
      arguments: input.arguments,
      result: input.result,
      error: input.error,
      durationMs: input.durationMs,
      createdAt: new Date().toISOString(),
    });
  }
}

export function createToolExecutor(options: {
  logger: AiLogger;
  maxRetries?: number;
  auditStore?: ToolAuditStore;
}): ToolExecutor {
  return new ToolExecutor(options);
}

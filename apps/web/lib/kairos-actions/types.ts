import type { z } from "zod";

export type KairosAgentRole = "Admin" | "Manager" | "Sales" | "Viewer";

export type KairosActionSelectedRecord = {
  type: string;
  id: string;
  label?: string;
};

export type KairosActionExecutionContext = {
  userId: string;
  userEmail: string | null;
  workspaceId: string;
  workspaceName: string;
  workspaceRole: string;
  agentRole: KairosAgentRole;
  selectedRecords: KairosActionSelectedRecord[];
  currentRoute?: string;
};

export type KairosTimelineItem = {
  id: string;
  timestamp: string;
  userId: string;
  tool: string;
  status: "completed" | "failed";
  result: string;
};

export type KairosToolDefinition<TInput = unknown, TResult = unknown> = {
  name: string;
  description: string;
  schema: z.ZodType<TInput>;
  requiredRole: KairosAgentRole;
  destructive?: boolean;
  confirmation?: {
    title: string;
    body: string;
  };
  integrations?: string[];
  execute: (
    context: KairosActionExecutionContext,
    input: TInput,
  ) => Promise<TResult>;
};

export type KairosParsedCommand = {
  tool: string;
  input: Record<string, unknown>;
  label: string;
};

export type KairosActionRequest = {
  command: string;
  confirm?: boolean;
  currentRoute?: string;
  selectedRecords?: KairosActionSelectedRecord[];
};

export type KairosActionResponse =
  | {
      ok: true;
      status: "completed";
      phase: "completed";
      action: { tool: string; label: string; destructive: boolean };
      result: unknown;
      timeline: KairosTimelineItem[];
    }
  | {
      ok: false;
      status:
        | "no_match"
        | "unauthorized"
        | "confirmation_required"
        | "validation_failed"
        | "failed";
      phase: "failed";
      action?: { tool: string; label: string; destructive: boolean };
      message: string;
      confirmation?: {
        title: string;
        body: string;
      };
      timeline: KairosTimelineItem[];
    };

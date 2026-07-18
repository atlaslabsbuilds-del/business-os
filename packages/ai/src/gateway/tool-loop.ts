import type { AiCompletionRequest, AiCompletionResponse, AiStreamChunk } from "../types/ai";
import type { ToolRegistry } from "../tools/registry";
import type { ToolExecutionContext } from "../tools/permissions";
import { formatToolResult } from "../tools/executor";
import { addCost, addUsage, emptyCost, emptyUsage } from "../utils";

export type ToolLoopRequest = Omit<AiCompletionRequest, "tools" | "toolChoice"> & {
  registry?: ToolRegistry;
  toolContext?: ToolExecutionContext;
  toolNames?: string[];
  maxToolRounds?: number;
};

export type ToolLoopResult = AiCompletionResponse & {
  messages: AiCompletionRequest["messages"];
  toolRounds: number;
};

type ProviderLike = {
  complete(request: AiCompletionRequest): Promise<AiCompletionResponse>;
  stream(request: AiCompletionRequest): AsyncIterable<AiStreamChunk>;
};

export async function completeWithTools(input: {
  provider: ProviderLike;
  request: ToolLoopRequest;
  maxToolRounds?: number;
}): Promise<ToolLoopResult> {
  const maxRounds = input.request.maxToolRounds ?? input.maxToolRounds ?? 8;
  const messages = [...input.request.messages];
  let usage = emptyUsage();
  let cost = emptyCost();
  let rounds = 0;
  let lastResponse: AiCompletionResponse | null = null;

  while (rounds <= maxRounds) {
    const toolDefinitions = input.request.registry?.definitions({
      names: input.request.toolNames,
      context: input.request.toolContext,
    });

    const response = await input.provider.complete({
      ...input.request,
      messages,
      tools: toolDefinitions?.length ? toolDefinitions : undefined,
      toolChoice: toolDefinitions?.length ? "auto" : undefined,
    });

    usage = addUsage(usage, response.usage);
    cost = addCost(cost, response.cost);
    lastResponse = response;
    messages.push(response.message);

    const shouldExecuteTools =
      response.finishReason === "tool_calls" &&
      response.toolCalls.length > 0 &&
      input.request.registry;

    if (!shouldExecuteTools) {
      break;
    }

    for (const call of response.toolCalls) {
      const outcome = await input.request.registry!.executeDetailed(
        call.name,
        call.arguments,
        input.request.toolContext ?? {},
        call.id,
      );

      messages.push({
        role: "tool",
        name: call.name,
        toolCallId: call.id,
        content: outcome.ok
          ? formatToolResult(outcome.result)
          : JSON.stringify({ error: outcome.error }),
      });
    }

    rounds += 1;
    if (rounds > maxRounds) {
      throw new Error(`Exceeded maximum tool rounds (${maxRounds})`);
    }
  }

  if (!lastResponse) {
    throw new Error("Tool loop produced no response");
  }

  return {
    ...lastResponse,
    usage,
    cost,
    messages,
    toolRounds: rounds,
  };
}

export async function* streamWithTools(input: {
  provider: ProviderLike;
  request: ToolLoopRequest;
  maxToolRounds?: number;
}): AsyncGenerator<AiStreamChunk> {
  const maxRounds = input.request.maxToolRounds ?? input.maxToolRounds ?? 8;
  const messages = [...input.request.messages];
  let rounds = 0;

  while (rounds <= maxRounds) {
    const toolDefinitions = input.request.registry?.definitions({
      names: input.request.toolNames,
      context: input.request.toolContext,
    });

    let pendingToolCalls: AiCompletionResponse["toolCalls"] = [];
    let finishReason: AiCompletionResponse["finishReason"] = "unknown";
    let responseForDone: AiCompletionResponse | null = null;

    for await (const chunk of input.provider.stream({
      ...input.request,
      messages,
      tools: toolDefinitions?.length ? toolDefinitions : undefined,
      toolChoice: toolDefinitions?.length ? "auto" : undefined,
    })) {
      if (chunk.type === "text_delta") {
        yield chunk;
      }
      if (chunk.type === "tool_call_delta") {
        yield chunk;
      }
      if (chunk.type === "usage") {
        yield chunk;
      }
      if (chunk.type === "done") {
        finishReason = chunk.finishReason;
        pendingToolCalls = chunk.response.toolCalls;
        responseForDone = chunk.response;
        yield chunk;
      }
      if (chunk.type === "error") {
        yield chunk;
        return;
      }
    }

    const shouldExecuteTools =
      finishReason === "tool_calls" &&
      pendingToolCalls.length > 0 &&
      input.request.registry &&
      responseForDone;

    if (!shouldExecuteTools || !responseForDone) {
      return;
    }

    messages.push(responseForDone.message);

    for (const call of pendingToolCalls) {
      yield {
        type: "tool_start",
        callId: call.id,
        name: call.name,
        arguments: call.arguments,
      };

      const stream = input.request.registry!.executeStream(
        call.name,
        call.arguments,
        input.request.toolContext ?? {},
        call.id,
      );

      let outcome = null as Awaited<
        ReturnType<ToolRegistry["executeDetailed"]>
      > | null;

      for await (const event of stream) {
        if ("ok" in event) {
          outcome = event;
        }
      }

      if (!outcome) {
        yield {
          type: "tool_failed",
          callId: call.id,
          name: call.name,
          error: "Tool produced no outcome",
        };
        continue;
      }

      if (outcome.ok) {
        yield {
          type: "tool_end",
          callId: call.id,
          name: call.name,
          result: outcome.result,
          durationMs: outcome.durationMs,
        };
        messages.push({
          role: "tool",
          name: call.name,
          toolCallId: call.id,
          content: formatToolResult(outcome.result),
        });
      } else {
        yield {
          type: "tool_failed",
          callId: call.id,
          name: call.name,
          error: outcome.error,
        };
        messages.push({
          role: "tool",
          name: call.name,
          toolCallId: call.id,
          content: JSON.stringify({ error: outcome.error }),
        });
      }
    }

    rounds += 1;
    if (rounds > maxRounds) {
      yield { type: "error", error: `Exceeded maximum tool rounds (${maxRounds})` };
      return;
    }
  }
}

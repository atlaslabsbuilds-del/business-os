import type { AiStreamChunk } from "../types/ai";
import type { ChatStreamEvent } from "./types";

export function encodeSseEvent(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function* streamGatewayToChatEvents(input: {
  stream: AsyncIterable<AiStreamChunk>;
  onComplete?: (chunk: AiStreamChunk) => void;
}): AsyncGenerator<ChatStreamEvent> {
  let lastChunk: AiStreamChunk | undefined;

  try {
    for await (const chunk of input.stream) {
      lastChunk = chunk;
      if (chunk.type === "text_delta" && chunk.text) {
        yield { type: "text_delta", text: chunk.text };
      }
      if (chunk.type === "done") {
        input.onComplete?.(chunk);
      }
    }
  } catch (error) {
    yield {
      type: "error",
      message: error instanceof Error ? error.message : "Stream failed",
    };
    return;
  }

  if (lastChunk?.type === "done") {
    yield { type: "done" };
  }
}

export function createSseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export function chatEventsToReadableStream(
  events: AsyncIterable<ChatStreamEvent>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(encoder.encode(encodeSseEvent(event)));
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Stream interrupted";
        controller.enqueue(
          encoder.encode(encodeSseEvent({ type: "error", message })),
        );
      } finally {
        controller.close();
      }
    },
  });
}

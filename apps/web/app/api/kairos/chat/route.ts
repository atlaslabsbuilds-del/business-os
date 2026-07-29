import { handleChatStreamRequest } from "../../../../lib/chat-api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Kairos chat stream endpoint.
 * Placeholder-ready: wire OPENAI_API_KEY / ANTHROPIC_API_KEY (or gateway URLs)
 * in the host app environment to enable live model responses.
 */
export async function POST(request: Request) {
  return handleChatStreamRequest(request);
}

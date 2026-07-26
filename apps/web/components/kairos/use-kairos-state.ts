import type { KairosState } from "../../lib/kairos";

export function deriveKairosChatState(input: {
  isStreaming: boolean;
  streamingContent: string;
  draft: string;
  error: string | null;
  phase?: "success" | "completed" | null;
}): KairosState {
  if (input.error) return "error";
  if (input.isStreaming && !input.streamingContent.trim()) return "thinking";
  if (input.isStreaming) return "speaking";
  if (input.phase === "success") return "success";
  if (input.phase === "completed") return "completed";
  if (input.draft.trim()) return "listening";
  return "idle";
}

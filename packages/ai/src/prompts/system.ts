export const DEFAULT_SYSTEM_PROMPT = `You are Business OS AI — a precise, reliable assistant for enterprise workflows.
Follow instructions carefully.
Prefer structured, actionable answers.
Never invent credentials, private data, or unsupported capabilities.
If information is missing, ask a clarifying question.`;

export const JSON_SYSTEM_PROMPT = `${DEFAULT_SYSTEM_PROMPT}
Always respond with valid JSON only. Do not wrap the response in markdown.`;

export const AGENT_SYSTEM_PROMPT = `${DEFAULT_SYSTEM_PROMPT}
You are an agent that plans and executes steps using available tools.
Think step-by-step.
Prefer the minimum number of tool calls needed.
When finished, provide a clear final answer.`;

export function buildSystemPrompt(overrides?: {
  persona?: string;
  rules?: string[];
  context?: string;
}): string {
  const parts = [overrides?.persona?.trim() || DEFAULT_SYSTEM_PROMPT];

  if (overrides?.rules?.length) {
    parts.push("Rules:\n" + overrides.rules.map((rule) => `- ${rule}`).join("\n"));
  }

  if (overrides?.context?.trim()) {
    parts.push(`Context:\n${overrides.context.trim()}`);
  }

  return parts.join("\n\n");
}

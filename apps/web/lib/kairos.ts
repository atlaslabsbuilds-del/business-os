export type KairosState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "success"
  | "error"
  | "completed";

export const KAIROS_THINKING_MESSAGES = [
  "Kairos is thinking…",
  "Analyzing your workspace…",
  "Finding the best solution…",
  "Understanding your request…",
] as const;

export const KAIROS_WELCOME = {
  greeting: "Hi! I'm Kairos.",
  subtitle: "Your AI Business Copilot.",
  body: "I can help with CRM, Email, Content, Analytics, Automations, Marketing and much more.",
} as const;

export const KAIROS_TAGLINE = "Your AI Business Copilot";

export function kairosStateLabel(state: KairosState): string | null {
  switch (state) {
    case "listening":
      return "Listening…";
    case "thinking":
      return null;
    case "speaking":
      return "Speaking…";
    case "success":
      return "Done";
    case "error":
      return "Something needs attention";
    case "completed":
      return "Ready when you are";
    default:
      return null;
  }
}

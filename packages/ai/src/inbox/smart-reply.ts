import type { AiGateway } from "../gateway";
import type { AiLogger } from "../types/ai";
import { createConsoleLogger, messageContentToText } from "../utils";
import { creditEngine } from "../credits/engine";

export type SmartReplyStyle =
  | "professional"
  | "friendly"
  | "concise"
  | "detailed";

export type SmartReplyResult = {
  reply: string;
  tone: SmartReplyStyle;
  credits: number;
  totalTokens: number;
};

export type InboxSmartReply = {
  generate: (input: {
    subject: string;
    messages: Array<{
      fromEmail: string;
      fromName?: string | null;
      bodyText: string;
      direction: string;
    }>;
    customerContext?: string;
    tone?: SmartReplyStyle;
    model?: string;
  }) => Promise<SmartReplyResult>;
};

const STYLE_GUIDANCE: Record<SmartReplyStyle, string> = {
  professional:
    "Use a polished, business-appropriate tone. Clear, respectful, and confident.",
  friendly:
    "Warm and approachable while remaining professional. Light personality is welcome.",
  concise:
    "Keep the reply short — ideally 3–6 sentences. Lead with the answer or next step.",
  detailed:
    "Be thorough: acknowledge context, address each ask, and include clear next steps. Aim for a complete reply.",
};

function normalizeStyle(value: unknown): SmartReplyStyle {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "friendly") return "friendly";
  if (raw === "concise") return "concise";
  if (raw === "detailed") return "detailed";
  return "professional";
}

export function createInboxSmartReply(input: {
  gateway: AiGateway;
  logger?: AiLogger;
}): InboxSmartReply {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/inbox");

  return {
    async generate({
      subject,
      messages,
      customerContext,
      tone = "professional",
      model,
    }) {
      const style = normalizeStyle(tone);
      const transcript = messages
        .slice(-12)
        .map((message) => {
          const who = message.fromName || message.fromEmail;
          const body =
            message.bodyText.length > 2000
              ? `${message.bodyText.slice(0, 2000)}…`
              : message.bodyText;
          return `${message.direction.toUpperCase()} ${who}: ${body}`;
        })
        .join("\n\n");

      logger.info("inbox.smart_reply.start", {
        subject,
        tone: style,
        messageCount: messages.length,
      });

      const maxTokens = style === "detailed" ? 900 : style === "concise" ? 280 : 500;

      const response = await input.gateway.complete({
        model,
        temperature: style === "friendly" ? 0.55 : 0.35,
        maxTokens,
        messages: [
          {
            role: "system",
            content: `You write email replies for the VanderBase inbox.
Style: ${style}.
${STYLE_GUIDANCE[style]}
Return only the reply body (no subject line, no markdown fences).
Be accurate — do not invent commitments, prices, or dates.
If CRM context is provided, use it carefully.`,
          },
          {
            role: "user",
            content: [
              `Subject: ${subject}`,
              customerContext ? `\nCustomer context:\n${customerContext}` : "",
              `\nThread:\n${transcript || "(empty)"}`,
              `\nWrite a ${style} reply:`,
            ].join(""),
          },
        ],
      });

      const reply = messageContentToText(response.message.content).trim();
      return {
        reply: reply || "Thanks for your message — I'll follow up shortly.",
        tone: style,
        credits: creditEngine.tokensToCredits(response.usage.totalTokens),
        totalTokens: response.usage.totalTokens,
      };
    },
  };
}

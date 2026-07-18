import type { AiGateway } from "../gateway";
import type { AiLogger } from "../types/ai";
import { createConsoleLogger, messageContentToText } from "../utils";
import { creditEngine } from "../credits/engine";

export type EmailSummaryPriority = "low" | "medium" | "high";

export type StructuredEmailSummary = {
  shortSummary: string;
  actionItems: string[];
  priority: EmailSummaryPriority;
  deadlines: Array<{ label: string; date?: string | null }>;
  peopleMentioned: Array<{ name?: string | null; email?: string | null }>;
  moneyMentions: Array<{ text: string; amount?: string | null }>;
};

export type InboxSummarizer = {
  summarizeThread: (input: {
    subject: string;
    messages: Array<{
      fromEmail: string;
      fromName?: string | null;
      bodyText: string;
      sentAt: string;
      direction: string;
    }>;
    model?: string;
  }) => Promise<{
    summary: string;
    credits: number;
    totalTokens: number;
  }>;
  summarizeThreadStructured: (input: {
    subject: string;
    messages: Array<{
      fromEmail: string;
      fromName?: string | null;
      bodyText: string;
      sentAt: string;
      direction: string;
    }>;
    model?: string;
  }) => Promise<{
    summary: StructuredEmailSummary;
    credits: number;
    totalTokens: number;
  }>;
};

const MAX_BODY_CHARS = 2500;
const MAX_TRANSCRIPT_CHARS = 72000;

function truncateBody(text: string, max = MAX_BODY_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n…[truncated ${trimmed.length - max} chars]`;
}

/**
 * Build a transcript covering the full conversation. Long threads keep early
 * context + the most recent messages so deadlines and asks aren't lost.
 */
export function buildThreadTranscript(input: {
  subject: string;
  messages: Array<{
    fromEmail: string;
    fromName?: string | null;
    bodyText: string;
    sentAt: string;
    direction: string;
  }>;
}): string {
  const formatMessage = (
    message: (typeof input.messages)[number],
    index: number,
  ) => {
    const who = message.fromName || message.fromEmail;
    return `--- Message ${index + 1}/${input.messages.length} ---\n[${message.sentAt}] ${message.direction.toUpperCase()} ${who}:\n${truncateBody(message.bodyText)}`;
  };

  if (input.messages.length === 0) {
    return `Subject: ${input.subject}\n\n(empty thread)`;
  }

  const blocks = input.messages.map(formatMessage);
  let transcript = `Subject: ${input.subject}\n\n${blocks.join("\n\n")}`;

  if (transcript.length <= MAX_TRANSCRIPT_CHARS) {
    return transcript;
  }

  // Keep first 2 + last 10 for long threads.
  const head = input.messages.slice(0, 2);
  const tail = input.messages.slice(-10);
  const omitted = Math.max(
    0,
    input.messages.length - head.length - tail.length,
  );
  const headBlocks = head.map((message, index) => formatMessage(message, index));
  const tailStart = input.messages.length - tail.length;
  const tailBlocks = tail.map((message, offset) =>
    formatMessage(message, tailStart + offset),
  );
  transcript = [
    `Subject: ${input.subject}`,
    `Full conversation: ${input.messages.length} messages (showing early + latest; ${omitted} middle messages condensed).`,
    ...headBlocks,
    omitted > 0
      ? `--- [${omitted} earlier messages omitted for length; retain their intent in summary] ---`
      : null,
    ...tailBlocks,
  ]
    .filter(Boolean)
    .join("\n\n");

  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return `${transcript.slice(0, MAX_TRANSCRIPT_CHARS)}\n…[transcript truncated]`;
  }
  return transcript;
}

function emptyStructured(subject: string): StructuredEmailSummary {
  return {
    shortSummary: subject
      ? `Thread about “${subject}” with no extractable content.`
      : "No summary available.",
    actionItems: [],
    priority: "low",
    deadlines: [],
    peopleMentioned: [],
    moneyMentions: [],
  };
}

function normalizePriority(value: unknown): EmailSummaryPriority {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "high" || raw === "urgent" || raw === "critical") return "high";
  if (raw === "medium" || raw === "normal" || raw === "moderate") return "medium";
  return "low";
}

function parseStructuredSummary(text: string, subject: string): StructuredEmailSummary {
  const fallback = emptyStructured(subject);
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      ...fallback,
      shortSummary: text.trim().slice(0, 400) || fallback.shortSummary,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      shortSummary?: unknown;
      actionItems?: unknown;
      priority?: unknown;
      deadlines?: unknown;
      peopleMentioned?: unknown;
      moneyMentions?: unknown;
    };

    const actionItems = Array.isArray(parsed.actionItems)
      ? parsed.actionItems
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const deadlines = Array.isArray(parsed.deadlines)
      ? parsed.deadlines.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const record = item as { label?: unknown; date?: unknown };
          if (typeof record.label !== "string" || !record.label.trim()) {
            return [];
          }
          return [
            {
              label: record.label.trim(),
              date:
                typeof record.date === "string"
                  ? record.date
                  : record.date === null
                    ? null
                    : null,
            },
          ];
        })
      : [];

    const peopleMentioned = Array.isArray(parsed.peopleMentioned)
      ? parsed.peopleMentioned.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const record = item as { name?: unknown; email?: unknown };
          const name =
            typeof record.name === "string" ? record.name.trim() : null;
          const email =
            typeof record.email === "string" ? record.email.trim() : null;
          if (!name && !email) return [];
          return [{ name, email }];
        })
      : [];

    const moneyMentions = Array.isArray(parsed.moneyMentions)
      ? parsed.moneyMentions.flatMap((item) => {
          if (typeof item !== "object" || item === null) return [];
          const record = item as { text?: unknown; amount?: unknown };
          if (typeof record.text !== "string" || !record.text.trim()) {
            return [];
          }
          return [
            {
              text: record.text.trim(),
              amount:
                typeof record.amount === "string"
                  ? record.amount
                  : record.amount === null
                    ? null
                    : null,
            },
          ];
        })
      : [];

    const shortSummary =
      typeof parsed.shortSummary === "string" && parsed.shortSummary.trim()
        ? parsed.shortSummary.trim()
        : fallback.shortSummary;

    return {
      shortSummary,
      actionItems,
      priority: normalizePriority(parsed.priority),
      deadlines,
      peopleMentioned,
      moneyMentions,
    };
  } catch {
    return {
      ...fallback,
      shortSummary: text.trim().slice(0, 400) || fallback.shortSummary,
    };
  }
}

export function createInboxSummarizer(input: {
  gateway: AiGateway;
  logger?: AiLogger;
}): InboxSummarizer {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/inbox");

  async function summarizeThreadStructured(params: {
    subject: string;
    messages: Array<{
      fromEmail: string;
      fromName?: string | null;
      bodyText: string;
      sentAt: string;
      direction: string;
    }>;
    model?: string;
  }) {
    const transcript = buildThreadTranscript({
      subject: params.subject,
      messages: params.messages,
    });

    logger.info("inbox.summarize.structured.start", {
      subject: params.subject,
      messageCount: params.messages.length,
      transcriptChars: transcript.length,
    });

    const response = await input.gateway.complete({
      model: params.model,
      temperature: 0.15,
      maxTokens: 900,
      messages: [
        {
          role: "system",
          content: `You are an enterprise email analyst for a Business OS CRM inbox.
Summarize the ENTIRE email conversation (all messages, not only the latest).
Return ONLY valid JSON with this exact shape:
{
  "shortSummary": "2-4 sentence overview of the full thread",
  "actionItems": ["concrete next steps"],
  "priority": "low|medium|high",
  "deadlines": [{"label":"what is due","date":"ISO date or null if unknown"}],
  "peopleMentioned": [{"name":"optional","email":"optional"}],
  "moneyMentions": [{"text":"invoice/payment mention","amount":"$1,200 or null"}]
}
Rules:
- Do not invent facts, people, money, or deadlines.
- Prefer empty arrays when nothing is present.
- Priority: high = urgent/blocking/legal/money risk; medium = needs response soon; low = FYI/newsletter.
- Include every clear action item across the thread.`,
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const text = messageContentToText(response.message.content).trim();
    const summary = parseStructuredSummary(text, params.subject);
    const credits = creditEngine.tokensToCredits(response.usage.totalTokens);

    return {
      summary,
      credits,
      totalTokens: response.usage.totalTokens,
    };
  }

  return {
    async summarizeThread({ subject, messages, model }) {
      const structured = await summarizeThreadStructured({
        subject,
        messages,
        model,
      });
      return {
        summary: structured.summary.shortSummary,
        credits: structured.credits,
        totalTokens: structured.totalTokens,
      };
    },
    summarizeThreadStructured,
  };
}

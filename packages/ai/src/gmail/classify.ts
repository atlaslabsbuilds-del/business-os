import type { AiGateway } from "../gateway";
import type { AiLogger } from "../types/ai";
import { createConsoleLogger, messageContentToText } from "../utils";
import { creditEngine } from "../credits/engine";

export type GmailPriority = "urgent" | "high" | "normal" | "low";
export type GmailClassification =
  | "sales"
  | "support"
  | "billing"
  | "partnership"
  | "internal"
  | "newsletter"
  | "personal"
  | "other";

export type GmailSuggestedAction = {
  type:
    | "reply"
    | "archive"
    | "create_task"
    | "schedule_meeting"
    | "create_lead"
    | "follow_up";
  label: string;
  confidence: number;
};

export type GmailClassificationResult = {
  priority: GmailPriority;
  classification: GmailClassification;
  suggestedActions: GmailSuggestedAction[];
  credits: number;
  totalTokens: number;
};

const PRIORITIES: GmailPriority[] = ["urgent", "high", "normal", "low"];
const CLASSES: GmailClassification[] = [
  "sales",
  "support",
  "billing",
  "partnership",
  "internal",
  "newsletter",
  "personal",
  "other",
];

/**
 * Heuristic classifier used when the gateway is unavailable or for cheap first-pass.
 */
export function classifyEmailHeuristic(input: {
  subject: string;
  body: string;
  fromEmail: string;
}): Omit<GmailClassificationResult, "credits" | "totalTokens"> {
  const corpus = `${input.subject}\n${input.body}`.toLowerCase();
  let priority: GmailPriority = "normal";
  if (/\b(urgent|asap|immediately|critical|outage)\b/.test(corpus)) {
    priority = "urgent";
  } else if (/\b(important|priority|deadline|today)\b/.test(corpus)) {
    priority = "high";
  } else if (/\b(newsletter|unsubscribe|promotion)\b/.test(corpus)) {
    priority = "low";
  }

  let classification: GmailClassification = "other";
  if (/\b(invoice|payment|billing|receipt)\b/.test(corpus)) {
    classification = "billing";
  } else if (/\b(demo|pricing|quote|proposal|deal)\b/.test(corpus)) {
    classification = "sales";
  } else if (/\b(bug|issue|help|support|error)\b/.test(corpus)) {
    classification = "support";
  } else if (/\b(partner|collaboration|alliance)\b/.test(corpus)) {
    classification = "partnership";
  } else if (/\bunsubscribe\b/.test(corpus) || /noreply@/i.test(input.fromEmail)) {
    classification = "newsletter";
  } else if (/@(gmail|yahoo|icloud|hotmail)\./i.test(input.fromEmail)) {
    classification = "personal";
  }

  const suggestedActions: GmailSuggestedAction[] = [];
  if (priority === "urgent" || priority === "high") {
    suggestedActions.push({
      type: "reply",
      label: "Draft a priority reply",
      confidence: 0.8,
    });
  }
  if (classification === "sales") {
    suggestedActions.push({
      type: "create_lead",
      label: "Create CRM lead",
      confidence: 0.75,
    });
  }
  if (/\b(meet|call|schedule|availability)\b/.test(corpus)) {
    suggestedActions.push({
      type: "schedule_meeting",
      label: "Schedule meeting",
      confidence: 0.7,
    });
  }
  if (suggestedActions.length === 0) {
    suggestedActions.push({
      type: "follow_up",
      label: "Create follow-up task",
      confidence: 0.55,
    });
  }

  return { priority, classification, suggestedActions };
}

export function createGmailClassifier(input: {
  gateway: AiGateway;
  logger?: AiLogger;
}) {
  const logger = input.logger ?? createConsoleLogger("@repo/ai/gmail");

  return {
    async classify(params: {
      subject: string;
      body: string;
      fromEmail: string;
      model?: string;
    }): Promise<GmailClassificationResult> {
      const fallback = classifyEmailHeuristic(params);
      try {
        const response = await input.gateway.complete({
          model: params.model,
          temperature: 0.1,
          maxTokens: 300,
          messages: [
            {
              role: "system",
              content: `Classify an email for an AI business OS.
Return ONLY valid JSON:
{"priority":"urgent|high|normal|low","classification":"sales|support|billing|partnership|internal|newsletter|personal|other","suggestedActions":[{"type":"reply|archive|create_task|schedule_meeting|create_lead|follow_up","label":"...","confidence":0-1}]}`,
            },
            {
              role: "user",
              content: `From: ${params.fromEmail}\nSubject: ${params.subject}\n\n${params.body.slice(0, 4000)}`,
            },
          ],
        });

        const text = messageContentToText(response.message.content).trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          return {
            ...fallback,
            credits: creditEngine.tokensToCredits(response.usage.totalTokens),
            totalTokens: response.usage.totalTokens,
          };
        }
        const parsed = JSON.parse(jsonMatch[0]) as {
          priority?: string;
          classification?: string;
          suggestedActions?: GmailSuggestedAction[];
        };
        const priority = PRIORITIES.includes(parsed.priority as GmailPriority)
          ? (parsed.priority as GmailPriority)
          : fallback.priority;
        const classification = CLASSES.includes(
          parsed.classification as GmailClassification,
        )
          ? (parsed.classification as GmailClassification)
          : fallback.classification;
        const suggestedActions =
          Array.isArray(parsed.suggestedActions) &&
          parsed.suggestedActions.length > 0
            ? parsed.suggestedActions
            : fallback.suggestedActions;

        return {
          priority,
          classification,
          suggestedActions,
          credits: creditEngine.tokensToCredits(response.usage.totalTokens),
          totalTokens: response.usage.totalTokens,
        };
      } catch (error) {
        logger.warn("gmail.classify.fallback", {
          error: error instanceof Error ? error.message : String(error),
        });
        return { ...fallback, credits: 0, totalTokens: 0 };
      }
    },
  };
}

export type GmailClassifier = ReturnType<typeof createGmailClassifier>;

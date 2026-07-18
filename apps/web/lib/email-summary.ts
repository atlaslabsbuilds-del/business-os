import {
  createGateway,
  createInboxSummarizer,
  creditEngine,
  detectMeetingIntent,
} from "@repo/ai";
import {
  getInboxThreadDetail,
  updateThreadSummary,
} from "@repo/database/inbox";
import { deductWorkspaceCredits } from "@repo/database/credits";
import type { EmailThreadSummary } from "@repo/types";

function isCacheFresh(input: {
  cached: EmailThreadSummary | null;
  messageCount: number;
  lastMessageAt: string;
}): boolean {
  if (!input.cached) return false;
  return (
    input.cached.sourceMessageCount === input.messageCount &&
    input.cached.sourceLastMessageAt === input.lastMessageAt &&
    Boolean(input.cached.shortSummary)
  );
}

export async function getOrCreateEmailThreadSummary(input: {
  workspaceId: string;
  userId: string;
  threadId: string;
  force?: boolean;
}): Promise<{
  summary: EmailThreadSummary;
  cached: boolean;
  credits: number;
}> {
  const detail = await getInboxThreadDetail({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
  });
  if (!detail) {
    throw new Error("Thread not found");
  }

  const messageCount = detail.messages.length;
  const lastMessageAt = detail.thread.lastMessageAt;
  const cached = detail.thread.aiSummaryStructured;

  if (!input.force && isCacheFresh({ cached, messageCount, lastMessageAt })) {
    return {
      summary: cached!,
      cached: true,
      credits: 0,
    };
  }

  const gateway = createGateway();
  const summarizer = createInboxSummarizer({ gateway });
  const result = await summarizer.summarizeThreadStructured({
    subject: detail.thread.subject,
    messages: detail.messages.map((message) => ({
      fromEmail: message.fromEmail,
      fromName: message.fromName,
      bodyText: message.bodyText,
      sentAt: message.sentAt,
      direction: message.direction,
    })),
  });

  const meeting = detectMeetingIntent({
    subject: detail.thread.subject,
    bodies: detail.messages.map((message) => message.bodyText),
  });

  const summary: EmailThreadSummary = {
    ...result.summary,
    generatedAt: new Date().toISOString(),
    sourceMessageCount: messageCount,
    sourceLastMessageAt: lastMessageAt,
  };

  await updateThreadSummary({
    workspaceId: input.workspaceId,
    threadId: input.threadId,
    aiSummary: summary.shortSummary,
    aiSummaryStructured: summary,
    meetingDetected: meeting.detected,
    meetingConfidence: meeting.confidence,
  });

  if (result.credits > 0) {
    await deductWorkspaceCredits({
      workspaceId: input.workspaceId,
      amount: result.credits,
      reason: "inbox_email_summary",
      metadata: creditEngine.buildMetadata({
        totalTokens: result.totalTokens,
        model: "default",
        provider: "gateway",
        conversationId: input.threadId,
      }),
    });
  }

  return {
    summary,
    cached: false,
    credits: result.credits,
  };
}

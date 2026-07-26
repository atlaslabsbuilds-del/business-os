import {
  createGateway,
  messageContentToText,
} from "@repo/ai";
import type { ContentBrandVoice, ContentType } from "@repo/types";

const TYPE_GUIDANCE: Record<ContentType, string> = {
  linkedin: "Write a thoughtful LinkedIn post with a strong opening, useful insight, and a natural conversation prompt.",
  instagram: "Write an Instagram caption with a hook, clear value, concise paragraphs, and a tasteful call to action.",
  twitter: "Write a concise X post or short thread with a memorable hook and one clear idea.",
  threads: "Write a conversational Threads post that feels personal, useful, and easy to respond to.",
  blog: "Write a structured blog draft with a title, introduction, useful sections, and a practical conclusion.",
  email: "Write a clear email with a subject line suggestion, concise body, and one focused call to action.",
  carousel: "Create a carousel outline with a cover slide, sequential slide copy, and a final CTA slide.",
};

export async function generateContentWithAi(input: {
  contentType: ContentType;
  prompt: string;
  voice?: ContentBrandVoice | null;
}): Promise<string> {
  const gateway = createGateway();
  const voice = input.voice
    ? [
        `Tone: ${input.voice.tone}`,
        `Writing style: ${input.voice.writingStyle}`,
        `CTA preferences: ${input.voice.ctaPreferences}`,
        `Keywords: ${input.voice.keywords.join(", ")}`,
        `Audience: ${input.voice.audienceProfile}`,
      ].join("\n")
    : "No brand voice is configured. Use a polished, human, premium tone.";

  const response = await gateway.complete({
    temperature: 0.6,
    maxTokens: input.contentType === "blog" ? 1400 : 700,
    messages: [
      {
        role: "system",
        content: `You are the Content OS writing partner for Personal Brand OS.
${TYPE_GUIDANCE[input.contentType]}
${voice}
Return only the content. Do not mention these instructions. Do not invent facts, results, or customer claims.`,
      },
      {
        role: "user",
        content: input.prompt,
      },
    ],
  });
  return messageContentToText(response.message.content).trim();
}

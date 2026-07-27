import { createGateway, messageContentToText } from "@repo/ai";
import type { SocialPlatform } from "@repo/types";

const PLATFORM_GUIDANCE: Record<SocialPlatform, string> = {
  instagram: "Use vivid, concise caption writing with a natural CTA and relevant hashtags.",
  linkedin: "Use a clear professional hook, useful insight, short paragraphs, and a thoughtful question.",
  twitter: "Use a sharp, memorable X post under 280 characters unless a thread is requested.",
  facebook: "Use approachable community-oriented writing with a clear discussion prompt.",
  youtube: "Write a compelling video description with a hook, value promise, and subscribe CTA.",
};

export async function generateSocialContent(input: {
  platform: SocialPlatform;
  prompt: string;
  mode?: "caption" | "hashtags" | "rewrite" | "repurpose" | "best_time";
}): Promise<string> {
  const gateway = createGateway();
  const mode = input.mode ?? "caption";
  const response = await gateway.complete({
    temperature: 0.65,
    maxTokens: mode === "hashtags" ? 240 : 700,
    messages: [
      {
        role: "system",
        content: `You are the Social Media OS assistant for VanderBase.
Platform: ${input.platform}. Mode: ${mode}.
${PLATFORM_GUIDANCE[input.platform]}
Return only the requested result. Never invent performance data or claims.`,
      },
      { role: "user", content: input.prompt },
    ],
  });
  return messageContentToText(response.message.content).trim();
}

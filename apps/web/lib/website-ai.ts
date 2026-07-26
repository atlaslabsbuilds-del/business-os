import { createGateway, messageContentToText } from "@repo/ai";
import type { WebsiteProjectType } from "@repo/types";
import { z } from "zod";

export async function generateWebsiteBlueprint(input: {
  name: string;
  projectType: WebsiteProjectType;
  prompt: string;
  template: string;
}) {
  const gateway = createGateway();
  const response = await gateway.completeJson({
    maxTokens: 1200,
    schema: z.object({
      pages: z.array(
        z.object({
          title: z.string(),
          slug: z.string(),
          blocks: z.array(
            z.object({
              type: z.string(),
              props: z.record(z.string(), z.unknown()),
            }),
          ),
        }),
      ),
      headline: z.string(),
      description: z.string(),
    }),
    messages: [
      {
        role: "system",
        content:
          "You design premium personal websites. Return a concise multi-page blueprint with hero, features, testimonials, pricing, FAQ, and CTA blocks where appropriate. Use realistic placeholder copy only.",
      },
      {
        role: "user",
        content: `Name: ${input.name}\nType: ${input.projectType}\nTemplate: ${input.template}\nBrief: ${input.prompt}`,
      },
    ],
  });
  return response.data;
}

export async function generateWebsiteCopy(prompt: string) {
  const gateway = createGateway();
  const response = await gateway.complete({
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: "Write concise premium website copy. Return only the copy, no explanation.",
      },
      { role: "user", content: prompt },
    ],
  });
  return messageContentToText(response.message.content).trim();
}

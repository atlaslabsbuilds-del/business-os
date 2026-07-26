import { createGateway, messageContentToText } from "@repo/ai";

export async function summarizeMeeting(input: { transcript: string }) {
  const gateway = createGateway();
  const response = await gateway.complete({
    maxTokens: 900,
    messages: [
      { role: "system", content: "Summarize this meeting into a concise summary followed by action items. Return plain text only. Do not invent commitments." },
      { role: "user", content: input.transcript },
    ],
  });
  return messageContentToText(response.message.content).trim();
}

/** Build a simple RFC 2822 message and base64url-encode for Gmail API. */
export function buildRawEmail(input: {
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  inReplyTo?: string | null;
  references?: string | null;
  threadId?: string | null;
}): string {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
  ];
  if (input.cc?.length) lines.push(`Cc: ${input.cc.join(", ")}`);
  if (input.bcc?.length) lines.push(`Bcc: ${input.bcc.join(", ")}`);
  lines.push(`Subject: ${encodeSubject(input.subject)}`);
  lines.push("MIME-Version: 1.0");
  lines.push('Content-Type: text/plain; charset="UTF-8"');
  if (input.inReplyTo) lines.push(`In-Reply-To: ${input.inReplyTo}`);
  if (input.references) lines.push(`References: ${input.references}`);
  lines.push("");
  lines.push(input.body);
  const raw = lines.join("\r\n");
  return Buffer.from(raw, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeSubject(subject: string): string {
  if (/^[\x20-\x7E]*$/.test(subject)) return subject;
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

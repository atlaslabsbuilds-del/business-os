export type MeetingDetectionResult = {
  detected: boolean;
  confidence: number;
  suggestedTitle?: string;
  suggestedStartsAt?: string;
  suggestedEndsAt?: string;
  location?: string;
};

const MEETING_PATTERNS = [
  /\b(meet|meeting|call|zoom|google meet|teams|calendly|schedule|availability|sync)\b/i,
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(\d{1,2}:\d{2}\s*(am|pm)?)\b/i,
  /\b(next week|tomorrow|this afternoon|this morning)\b/i,
];

/**
 * Heuristic + keyword meeting detection for inbox threads.
 * Production modules can replace with a model-backed classifier.
 */
export function detectMeetingIntent(input: {
  subject: string;
  bodies: string[];
}): MeetingDetectionResult {
  const corpus = [input.subject, ...input.bodies].join("\n");
  let hits = 0;
  for (const pattern of MEETING_PATTERNS) {
    if (pattern.test(corpus)) hits += 1;
  }

  const confidence = Math.min(0.95, hits / MEETING_PATTERNS.length + (hits > 0 ? 0.15 : 0));
  const detected = confidence >= 0.35;

  if (!detected) {
    return { detected: false, confidence };
  }

  const titleMatch = corpus.match(
    /(?:meet(?:ing)?|call|sync)\s+(?:about|re|regarding)?\s*[:-]?\s*(.+)/i,
  );
  const suggestedTitle =
    titleMatch?.[1]?.trim().slice(0, 120) ||
    `Meeting: ${input.subject}`.slice(0, 120);

  const now = new Date();
  const starts = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  starts.setMinutes(0, 0, 0);
  starts.setHours(10);
  const ends = new Date(starts.getTime() + 30 * 60 * 1000);

  const locationMatch = corpus.match(/\b(zoom|google meet|teams|office|hq)\b/i);

  return {
    detected: true,
    confidence,
    suggestedTitle,
    suggestedStartsAt: starts.toISOString(),
    suggestedEndsAt: ends.toISOString(),
    location: locationMatch?.[1],
  };
}

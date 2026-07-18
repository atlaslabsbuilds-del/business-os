export {
  createInboxSummarizer,
  buildThreadTranscript,
  type InboxSummarizer,
  type StructuredEmailSummary,
  type EmailSummaryPriority,
} from "./summarize";
export {
  createInboxSmartReply,
  type InboxSmartReply,
  type SmartReplyResult,
  type SmartReplyStyle,
} from "./smart-reply";
export { detectMeetingIntent, type MeetingDetectionResult } from "./meeting";
export {
  createGmailAdapter,
  createOutlookAdapter,
  getMailProviderAdapter,
  type MailProviderAdapter,
  type MailProviderAccount,
  type RemoteMailThread,
} from "./providers";
export type { InboxProvider } from "./types";

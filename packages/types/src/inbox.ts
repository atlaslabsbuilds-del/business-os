import { z } from "zod";

export const inboxProviderSchema = z.enum(["gmail", "outlook"]);
export type InboxProvider = z.infer<typeof inboxProviderSchema>;

export const inboxAccountStatusSchema = z.enum([
  "connected",
  "syncing",
  "error",
  "disconnected",
]);
export type InboxAccountStatus = z.infer<typeof inboxAccountStatusSchema>;

export const inboxThreadStatusSchema = z.enum([
  "open",
  "archived",
  "trashed",
  "spam",
]);
export type InboxThreadStatus = z.infer<typeof inboxThreadStatusSchema>;

export const inboxMessageDirectionSchema = z.enum(["inbound", "outbound"]);
export type InboxMessageDirection = z.infer<typeof inboxMessageDirectionSchema>;

export const inboxTaskStatusSchema = z.enum(["open", "done", "cancelled"]);
export type InboxTaskStatus = z.infer<typeof inboxTaskStatusSchema>;

export type InboxParticipant = {
  email: string;
  name?: string | null;
};

export type InboxAccount = {
  id: string;
  workspaceId: string;
  provider: InboxProvider;
  email: string;
  displayName: string | null;
  status: InboxAccountStatus;
  scopes: string[];
  lastSyncedAt: string | null;
  historyId: string | null;
  syncError: string | null;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export const emailSummaryPrioritySchema = z.enum(["low", "medium", "high"]);
export type EmailSummaryPriority = z.infer<typeof emailSummaryPrioritySchema>;

export const emailThreadSummarySchema = z.object({
  shortSummary: z.string().min(1),
  actionItems: z.array(z.string()),
  priority: emailSummaryPrioritySchema,
  deadlines: z.array(
    z.object({
      label: z.string(),
      date: z.string().nullable().optional(),
    }),
  ),
  peopleMentioned: z.array(
    z.object({
      name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
    }),
  ),
  moneyMentions: z.array(
    z.object({
      text: z.string(),
      amount: z.string().nullable().optional(),
    }),
  ),
  generatedAt: z.string(),
  sourceMessageCount: z.number().int().nonnegative(),
  sourceLastMessageAt: z.string(),
});
export type EmailThreadSummary = z.infer<typeof emailThreadSummarySchema>;

export type InboxThread = {
  id: string;
  workspaceId: string;
  accountId: string;
  externalId: string | null;
  subject: string;
  snippet: string;
  participants: InboxParticipant[];
  status: InboxThreadStatus;
  isUnread: boolean;
  isStarred: boolean;
  messageCount: number;
  hasAttachments: boolean;
  lastMessageAt: string;
  contactId: string | null;
  companyId: string | null;
  aiSummary: string | null;
  aiSummaryStructured: EmailThreadSummary | null;
  aiPriority: string | null;
  aiClassification: string | null;
  aiSuggestedActions: Array<{
    type: string;
    label: string;
    confidence: number;
  }>;
  meetingDetected: boolean;
  meetingConfidence: number;
  createdAt: string;
  updatedAt: string;
};

export type InboxMessage = {
  id: string;
  workspaceId: string;
  threadId: string;
  accountId: string;
  externalId: string | null;
  direction: InboxMessageDirection;
  fromEmail: string;
  fromName: string | null;
  toEmails: InboxParticipant[];
  ccEmails: InboxParticipant[];
  subject: string;
  bodyText: string;
  bodyHtml: string | null;
  sentAt: string;
  isDraft: boolean;
  aiSummary: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InboxLabel = {
  id: string;
  workspaceId: string;
  accountId: string | null;
  name: string;
  color: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InboxAttachment = {
  id: string;
  workspaceId: string;
  messageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storageUrl: string | null;
  externalId: string | null;
  createdAt: string;
};

export type InboxTask = {
  id: string;
  workspaceId: string;
  threadId: string | null;
  messageId: string | null;
  title: string;
  description: string | null;
  dueAt: string | null;
  status: InboxTaskStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type InboxCalendarEvent = {
  id: string;
  workspaceId: string;
  threadId: string | null;
  title: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  attendees: InboxParticipant[];
  provider: InboxProvider | null;
  externalId: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type InboxThreadDetail = {
  thread: InboxThread;
  messages: InboxMessage[];
  attachments: InboxAttachment[];
  labels: InboxLabel[];
  tasks: InboxTask[];
  calendarEvents: InboxCalendarEvent[];
};

export type InboxDashboardStats = {
  accounts: number;
  openThreads: number;
  unread: number;
  archived: number;
  tasksOpen: number;
  upcomingMeetings: number;
};

export const connectInboxAccountSchema = z.object({
  provider: inboxProviderSchema,
  email: z.string().trim().email(),
  displayName: z.string().trim().max(160).optional().nullable(),
  accessToken: z.string().optional().nullable(),
  refreshToken: z.string().optional().nullable(),
});

export const inboxSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  status: inboxThreadStatusSchema.optional(),
  provider: inboxProviderSchema.optional(),
  accountId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
  unreadOnly: z.boolean().optional(),
  contactId: z.string().uuid().optional(),
});

export const archiveThreadSchema = z.object({
  threadId: z.string().uuid(),
});

export const replyThreadSchema = z.object({
  threadId: z.string().uuid(),
  body: z.string().trim().min(1).max(20000),
  useSmartReply: z.boolean().optional(),
});

export const summarizeThreadSchema = z.object({
  threadId: z.string().uuid(),
  force: z.boolean().optional(),
});

export const smartReplyStyleSchema = z.enum([
  "professional",
  "friendly",
  "concise",
  "detailed",
]);
export type SmartReplyStyle = z.infer<typeof smartReplyStyleSchema>;

export const smartReplyStatusSchema = z.enum(["draft", "sent", "discarded"]);
export type SmartReplyStatus = z.infer<typeof smartReplyStatusSchema>;

export type InboxAiReplyDraft = {
  id: string;
  workspaceId: string;
  threadId: string;
  accountId: string | null;
  createdBy: string;
  style: SmartReplyStyle;
  body: string;
  subject: string | null;
  gmailDraftId: string | null;
  gmailMessageId: string | null;
  status: SmartReplyStatus;
  creditsUsed: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
};

export const generateSmartReplySchema = z.object({
  threadId: z.string().uuid(),
  style: smartReplyStyleSchema.optional().default("professional"),
});

export const updateSmartReplyDraftSchema = z.object({
  draftId: z.string().uuid(),
  body: z.string().trim().min(1).max(200000),
});

export const sendSmartReplySchema = z.object({
  threadId: z.string().uuid(),
  draftId: z.string().uuid().optional().nullable(),
  body: z.string().trim().min(1).max(200000),
  replyAll: z.boolean().optional(),
});

export const listSmartReplyDraftsSchema = z.object({
  threadId: z.string().uuid(),
});

export const createInboxTaskSchema = z.object({
  threadId: z.string().uuid().optional().nullable(),
  messageId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  dueAt: z.string().optional().nullable(),
});

export const scheduleMeetingSchema = z.object({
  threadId: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  location: z.string().trim().max(240).optional().nullable(),
  attendees: z
    .array(
      z.object({
        email: z.string().email(),
        name: z.string().optional().nullable(),
      }),
    )
    .optional(),
  provider: inboxProviderSchema.optional(),
});

export const createInboxLabelSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.string().trim().max(20).optional(),
  accountId: z.string().uuid().optional().nullable(),
});

export const assignInboxLabelSchema = z.object({
  threadId: z.string().uuid(),
  labelId: z.string().uuid(),
});

export const seedDemoInboxSchema = z.object({
  provider: inboxProviderSchema.optional().default("gmail"),
});

export type Id = string;

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type {
  AppRole,
  AuthProvider,
  AuthUser,
  AuthSession,
  Profile,
  Organization,
  OrganizationMember,
  UserRoleRecord,
} from "./auth";

export type {
  WorkspaceRole,
  InvitationStatus,
  Workspace,
  WorkspaceMember,
  WorkspaceMemberWithProfile,
  Invitation,
  WorkspaceMembership,
  CreateWorkspaceInput,
  InviteMemberInput,
  UpdateWorkspaceInput,
  TransferOwnershipInput,
  DeleteWorkspaceInput,
} from "./workspace";

export {
  workspaceRoleSchema,
  invitationStatusSchema,
  createWorkspaceSchema,
  inviteMemberSchema,
  updateWorkspaceSchema,
  transferOwnershipSchema,
  deleteWorkspaceSchema,
  WORKSPACE_COOKIE,
  slugifyWorkspaceName,
} from "./workspace";

export type {
  PlatformModule,
  WorkspaceNotificationType,
  WorkspaceNotification,
  WorkspaceActivityEvent,
  WorkspaceAiMemory,
  DashboardInsight,
  DashboardSnapshot,
  CreateWorkspaceNotificationInput,
  CreateWorkspaceActivityEventInput,
  CreateWorkspaceAiMemoryInput,
} from "./platform";

export {
  platformModuleSchema,
  workspaceNotificationTypeSchema,
  createWorkspaceNotificationSchema,
  markWorkspaceNotificationReadSchema,
  createWorkspaceActivityEventSchema,
  createWorkspaceAiMemorySchema,
} from "./platform";

export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "./database";

export type {
  ChatProviderId,
  ChatMessageRole,
  ChatConversation,
  ChatMessage,
  WorkspaceCredits,
  CreditTransaction,
} from "./chat";

export {
  chatProviderSchema,
  createConversationSchema,
  renameConversationSchema,
  chatStreamRequestSchema,
  pinConversationSchema,
  deleteConversationSchema,
  searchConversationsSchema,
} from "./chat";

export type {
  CrmLifecycleStage,
  CrmDealStage,
  CrmActivityType,
  CrmEntityType,
  CrmCompany,
  CrmContact,
  CrmDeal,
  CrmActivity,
  CrmNote,
  CrmTag,
  CrmTagging,
  CrmTimelineItem,
  CrmDashboardStats,
} from "./crm";

export {
  crmLifecycleStageSchema,
  crmDealStageSchema,
  crmActivityTypeSchema,
  crmEntityTypeSchema,
  createCompanySchema,
  updateCompanySchema,
  createContactSchema,
  updateContactSchema,
  createLeadSchema,
  createDealSchema,
  updateDealSchema,
  createActivitySchema,
  updateActivitySchema,
  createNoteSchema,
  createTagSchema,
  assignTagSchema,
  crmSearchSchema,
  deleteCrmEntitySchema,
} from "./crm";

export type {
  InboxProvider,
  InboxAccountStatus,
  InboxThreadStatus,
  InboxMessageDirection,
  InboxTaskStatus,
  InboxParticipant,
  InboxAccount,
  InboxThread,
  InboxMessage,
  InboxLabel,
  InboxAttachment,
  InboxTask,
  InboxCalendarEvent,
  InboxThreadDetail,
  InboxDashboardStats,
  EmailSummaryPriority,
  EmailThreadSummary,
  SmartReplyStyle,
  SmartReplyStatus,
  InboxAiReplyDraft,
} from "./inbox";

export {
  inboxProviderSchema,
  inboxAccountStatusSchema,
  inboxThreadStatusSchema,
  inboxMessageDirectionSchema,
  inboxTaskStatusSchema,
  emailSummaryPrioritySchema,
  emailThreadSummarySchema,
  smartReplyStyleSchema,
  smartReplyStatusSchema,
  connectInboxAccountSchema,
  inboxSearchSchema,
  archiveThreadSchema,
  replyThreadSchema,
  summarizeThreadSchema,
  generateSmartReplySchema,
  updateSmartReplyDraftSchema,
  sendSmartReplySchema,
  listSmartReplyDraftsSchema,
  createInboxTaskSchema,
  scheduleMeetingSchema,
  createInboxLabelSchema,
  assignInboxLabelSchema,
  seedDemoInboxSchema,
} from "./inbox";

export type {
  GmailPriority,
  GmailClassification,
  GmailSuggestedAction,
  InboxAccountSecrets,
  GmailSyncPhase,
  GmailSyncProgress,
  GmailSyncProgressError,
  GmailSyncProgressStatus,
  GmailSyncResult,
} from "./gmail";

export {
  gmailPrioritySchema,
  gmailClassificationSchema,
  startGmailOAuthSchema,
  gmailSyncSchema,
  gmailSendSchema,
  gmailReplySchema,
  gmailForwardSchema,
  gmailThreadActionSchema,
  gmailStarSchema,
  gmailReadStateSchema,
  gmailMoveLabelsSchema,
  gmailCreateDraftSchema,
  gmailSearchSchema,
  gmailCreateLeadSchema,
} from "./gmail";

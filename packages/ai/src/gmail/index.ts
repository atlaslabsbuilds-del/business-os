export {
  GMAIL_SCOPES,
  buildGmailAuthUrl,
  exchangeGmailAuthCode,
  refreshGmailAccessToken,
  fetchGoogleUserInfo,
  getGmailOAuthRedirectUri,
  describeGmailOAuthConfig,
  encodeOAuthState,
  decodeOAuthState,
  type GoogleTokenSet,
  type GoogleUserInfo,
} from "./oauth";

export {
  getGmailProfile,
  listGmailLabels,
  listGmailThreads,
  getGmailThread,
  getGmailMessage,
  listGmailHistory,
  modifyGmailThread,
  trashGmailThread,
  sendGmailMessage,
  createGmailDraftMessage,
  sendGmailDraft,
  headerValue,
  extractPlainText,
  extractAttachments,
  parseAddressList,
  mapLabelIdsToStatus,
  GmailApiError,
  isGmailAuthError,
  type GmailLabel,
  type GmailMessage,
  type GmailThread,
  type GmailProfile,
} from "./api";

export { buildRawEmail } from "./mime";

export {
  normalizeGmailThread,
  normalizeGmailMessage,
  type NormalizedGmailThread,
  type NormalizedGmailMessage,
} from "./normalize";

export {
  classifyEmailHeuristic,
  createGmailClassifier,
  type GmailClassifier,
  type GmailClassificationResult,
} from "./classify";

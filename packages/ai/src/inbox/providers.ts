import type { InboxProvider } from "./types";
import {
  buildGmailAuthUrl,
  getGmailOAuthRedirectUri,
  listGmailThreads,
  getGmailThread,
  sendGmailMessage,
  normalizeGmailThread,
} from "../gmail";

export type MailProviderAccount = {
  provider: InboxProvider;
  email: string;
  displayName?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export type RemoteMailThread = {
  externalId: string;
  subject: string;
  snippet: string;
  participants: Array<{ email: string; name?: string | null }>;
  messages: Array<{
    externalId: string;
    fromEmail: string;
    fromName?: string | null;
    toEmails: Array<{ email: string; name?: string | null }>;
    subject: string;
    bodyText: string;
    sentAt: string;
    direction: "inbound" | "outbound";
    attachments?: Array<{
      filename: string;
      mimeType: string;
      sizeBytes: number;
      externalId?: string;
    }>;
  }>;
};

export type MailProviderAdapter = {
  readonly provider: InboxProvider;
  getAuthUrl: (input: {
    workspaceId: string;
    redirectUri: string;
    state: string;
  }) => string;
  fetchThreads: (account: MailProviderAccount) => Promise<RemoteMailThread[]>;
  sendReply: (input: {
    account: MailProviderAccount;
    threadExternalId?: string | null;
    to: string[];
    subject: string;
    body: string;
  }) => Promise<{ externalId: string }>;
};

function buildMicrosoftAuthUrl(input: {
  redirectUri: string;
  state: string;
  clientId?: string;
}): string {
  const clientId = input.clientId || process.env.MICROSOFT_CLIENT_ID || "";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: [
      "offline_access",
      "User.Read",
      "Mail.ReadWrite",
      "Mail.Send",
      "Calendars.ReadWrite",
    ].join(" "),
    state: input.state,
  });
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Gmail adapter — OAuth URL + live Gmail REST sync/send.
 */
export function createGmailAdapter(): MailProviderAdapter {
  return {
    provider: "gmail",
    getAuthUrl({ redirectUri, state }) {
      try {
        return buildGmailAuthUrl({
          redirectUri: redirectUri || getGmailOAuthRedirectUri(),
          state,
        });
      } catch {
        const clientId = process.env.GOOGLE_CLIENT_ID || "";
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: [
            "https://www.googleapis.com/auth/gmail.modify",
            "email",
            "profile",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
          state,
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      }
    },
    async fetchThreads(account) {
      if (!account.accessToken) return [];
      const listed = await listGmailThreads({
        accessToken: account.accessToken,
        maxResults: 25,
        query: "in:inbox OR in:sent OR in:drafts OR in:trash",
      });
      const threads: RemoteMailThread[] = [];
      for (const item of listed.threads ?? []) {
        const full = await getGmailThread({
          accessToken: account.accessToken,
          threadId: item.id,
        });
        const normalized = normalizeGmailThread({
          thread: full,
          accountEmail: account.email,
        });
        threads.push({
          externalId: normalized.externalId,
          subject: normalized.subject,
          snippet: normalized.snippet,
          participants: normalized.participants,
          messages: normalized.messages.map((message) => ({
            externalId: message.externalId,
            fromEmail: message.fromEmail,
            fromName: message.fromName,
            toEmails: message.toEmails,
            subject: message.subject,
            bodyText: message.bodyText,
            sentAt: message.sentAt,
            direction: message.direction,
            attachments: message.attachments,
          })),
        });
      }
      return threads;
    },
    async sendReply(input) {
      if (!input.account.accessToken) {
        throw new Error("Gmail account is not authorized");
      }
      const sent = await sendGmailMessage({
        accessToken: input.account.accessToken,
        from: input.account.email,
        to: input.to,
        subject: input.subject,
        body: input.body,
        threadId: input.threadExternalId,
      });
      return { externalId: sent.id };
    },
  };
}

export function createOutlookAdapter(): MailProviderAdapter {
  return {
    provider: "outlook",
    getAuthUrl({ redirectUri, state }) {
      return buildMicrosoftAuthUrl({ redirectUri, state });
    },
    async fetchThreads(account) {
      if (!account.accessToken) return [];
      void account;
      return [];
    },
    async sendReply(input) {
      if (!input.account.accessToken) {
        throw new Error("Outlook account is not authorized");
      }
      return {
        externalId: `outlook_out_${crypto.randomUUID().slice(0, 12)}`,
      };
    },
  };
}

export function getMailProviderAdapter(provider: InboxProvider): MailProviderAdapter {
  return provider === "gmail" ? createGmailAdapter() : createOutlookAdapter();
}

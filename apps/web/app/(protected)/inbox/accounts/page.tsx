import { redirect } from "next/navigation";
import { describeGmailOAuthConfig } from "@repo/ai";
import { listInboxAccounts } from "@repo/database/inbox";
import { Badge } from "@repo/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";
import { ensureInboxAiToolsRegistered } from "../../../../lib/inbox-ai";
import { ensureGmailAiToolsRegistered } from "../../../../lib/gmail-ai";
import { resolveActiveWorkspace } from "../../../../lib/workspace-context";
import { InboxShell } from "../../../../components/inbox/inbox-shell";
import {
  ConnectInboxAccountForm,
  DisconnectAccountButton,
  SeedDemoInboxButton,
} from "../../../../components/inbox/inbox-forms";
import { GmailSyncPanel } from "../../../../components/inbox/gmail-sync-panel";
import { parseGmailSyncProgress } from "@repo/database/gmail";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ oauth?: string; email?: string; message?: string }>;
};

export default async function InboxAccountsPage({ searchParams }: Props) {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  ensureInboxAiToolsRegistered();
  const { registered } = ensureGmailAiToolsRegistered();

  const params = await searchParams;
  const accounts = await listInboxAccounts({
    workspaceId: context.active.workspace.id,
  });
  const oauthConfig = describeGmailOAuthConfig();

  return (
    <InboxShell
      title="Accounts"
      description="Connect Gmail via Google OAuth. Tokens stay server-side with refresh and disconnect."
      actions={
        <div className="flex flex-wrap gap-2">
          <SeedDemoInboxButton provider="gmail" />
          <SeedDemoInboxButton provider="outlook" />
        </div>
      }
    >
      {params.oauth === "connected" ? (
        <p className="rounded-xl bg-accent-muted/40 px-3 py-2 text-sm text-foreground">
          Gmail connected{params.email ? `: ${params.email}` : ""}. Run Sync to
          pull inbox, sent, drafts, trash, spam, labels, attachments, and AI
          summaries.
        </p>
      ) : null}
      {params.oauth === "error" ? (
        <p className="rounded-xl bg-error/10 px-3 py-2 text-sm text-error">
          OAuth failed{params.message ? `: ${params.message}` : ""}
          {params.message?.includes("redirect_uri") ||
          params.message === "redirect_uri_mismatch" ? (
            <>
              {" "}
              Add this exact URI in Google Cloud → Authorized redirect URIs:{" "}
              <code className="text-foreground">{oauthConfig.redirectUri}</code>
            </>
          ) : null}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Google OAuth redirect URI</CardTitle>
          <CardDescription>
            Custom Next.js OAuth (not Supabase Auth). Google Cloud must allow
            this exact value — character-for-character, no trailing slash.
          </CardDescription>
        </CardHeader>
        <div className="space-y-2 text-sm">
          <p className="font-mono text-foreground break-all">
            {oauthConfig.redirectUri}
          </p>
          <p className="text-xs text-secondary">
            NEXT_PUBLIC_SITE_URL={oauthConfig.siteUrl} · GOOGLE_CLIENT_ID{" "}
            {oauthConfig.clientIdSet ? "set" : "missing"} · GOOGLE_CLIENT_SECRET{" "}
            {oauthConfig.clientSecretSet ? "set" : "missing"}
          </p>
          <p className="text-xs text-muted">
            Do not use{" "}
            <code>
              https://&lt;project&gt;.supabase.co/auth/v1/callback
            </code>{" "}
            for Gmail inbox connect — that is for Supabase Auth only.
          </p>
        </div>
      </Card>

      <ConnectInboxAccountForm />

      <Card>
        <CardHeader>
          <CardTitle>Connected mailboxes</CardTitle>
          <CardDescription>
            Multiple Gmail accounts per workspace. Background sync:
            POST /api/inbox/gmail/sync
          </CardDescription>
        </CardHeader>
        <ul className="space-y-2">
          {accounts.length === 0 ? (
            <li className="text-sm text-muted">No accounts connected</li>
          ) : (
            accounts.map((account) => {
              const syncProgress = parseGmailSyncProgress(account.metadata);
              return (
              <li
                key={account.id}
                className="space-y-3 rounded-xl bg-elevated/60 px-3 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {account.displayName || account.email}
                  </p>
                  <p className="text-xs text-secondary">{account.email}</p>
                  {account.syncError ? (
                    <p className="text-xs text-error">{account.syncError}</p>
                  ) : null}
                  {account.lastSyncedAt ? (
                    <p className="text-xs text-muted">
                      Synced {new Date(account.lastSyncedAt).toLocaleString()}
                      {account.historyId ? ` · history ${account.historyId}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default">{account.provider}</Badge>
                  <Badge
                    variant={
                      account.status === "connected" ? "accent" : "default"
                    }
                  >
                    {account.status}
                  </Badge>
                  <DisconnectAccountButton id={account.id} />
                </div>
                </div>
                  {account.provider === "gmail" &&
                  account.status !== "disconnected" ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <GmailSyncPanel
                        accountId={account.id}
                        initialProgress={
                          syncProgress
                            ? {
                                jobId: syncProgress.jobId,
                                status: syncProgress.status,
                                phase: syncProgress.phase,
                                mode: syncProgress.mode,
                                threadsProcessed: syncProgress.threadsProcessed,
                                threadsTotal: syncProgress.threadsTotal,
                                messagesUpserted: syncProgress.messagesUpserted,
                                labelsUpserted: syncProgress.labelsUpserted,
                                attachmentsUpserted:
                                  syncProgress.attachmentsUpserted,
                                summariesGenerated:
                                  syncProgress.summariesGenerated,
                                tasksCreated: syncProgress.tasksCreated,
                                meetingsScheduled: syncProgress.meetingsScheduled,
                                linkedContacts: syncProgress.linkedContacts,
                                errors: syncProgress.errors,
                                currentThreadSubject:
                                  syncProgress.currentThreadSubject,
                                historyId: syncProgress.historyId,
                                updatedAt: syncProgress.updatedAt,
                                completedAt: syncProgress.completedAt,
                              }
                            : null
                        }
                      />
                      <GmailSyncPanel
                        accountId={account.id}
                        full
                        initialProgress={null}
                      />
                    </div>
                  ) : null}
              </li>
            );
            })
          )}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gmail AI tools</CardTitle>
          <CardDescription>Registered on the Tool Registry</CardDescription>
        </CardHeader>
        <div className="flex flex-wrap gap-2">
          {registered
            .filter((name) => name.startsWith("gmail."))
            .map((name) => (
              <Badge key={name} variant="accent">
                {name}
              </Badge>
            ))}
        </div>
      </Card>
    </InboxShell>
  );
}

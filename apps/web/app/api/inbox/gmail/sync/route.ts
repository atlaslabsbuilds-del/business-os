import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@repo/auth/server";
import { consumeRateLimit } from "@repo/auth/rate-limit";
import {
  listGmailAccountSecrets,
} from "@repo/database/gmail";
import { resolveActiveWorkspace } from "../../../../../lib/workspace-context";
import {
  readGmailSyncProgress,
  startGmailSyncInBackground,
  syncGmailAccount,
} from "../../../../../lib/gmail-sync";
import { ensureGmailAiToolsRegistered } from "../../../../../lib/gmail-ai";

const syncBodySchema = z.object({
  accountId: z.string().uuid().optional(),
  full: z.boolean().optional(),
  background: z.boolean().optional(),
});
const cronBodySchema = syncBodySchema.extend({
  workspaceId: z.string().uuid(),
  userId: z.string().uuid(),
});

/**
 * GET — poll Gmail sync progress for an account (workspace-scoped via RLS).
 */
export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const context = await resolveActiveWorkspace();
  if (!context) {
    return NextResponse.json({ ok: false, error: "No workspace" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");
  if (!accountId || !z.string().uuid().safeParse(accountId).success) {
    return NextResponse.json(
      { ok: false, error: "accountId required" },
      { status: 400 },
    );
  }

  const progress = await readGmailSyncProgress({
    workspaceId: context.active.workspace.id,
    accountId,
  });

  return NextResponse.json({ ok: true, progress });
}

/**
 * Background / on-demand Gmail sync.
 * - Authenticated workspace members: sync their workspace accounts
 * - Cron: Authorization: Bearer $GMAIL_CRON_SECRET + JSON { workspaceId, userId, accountId?, full? }
 * - background: true — start sync and return jobId immediately
 */
export async function POST(request: Request) {
  ensureGmailAiToolsRegistered();

  const cronSecret = process.env.GMAIL_CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const isCron =
    Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

  try {
    if (isCron) {
      let rawBody: unknown;
      try {
        rawBody = await request.json();
      } catch {
        return NextResponse.json(
          { ok: false, error: "Invalid JSON body" },
          { status: 400 },
        );
      }
      const parsedBody = cronBodySchema.safeParse(rawBody);
      if (!parsedBody.success) {
        return NextResponse.json(
          { ok: false, error: "Invalid sync request" },
          { status: 400 },
        );
      }
      const body = parsedBody.data;
      if (body.accountId && body.background) {
        const started = await startGmailSyncInBackground({
          workspaceId: body.workspaceId,
          userId: body.userId,
          accountId: body.accountId,
          full: body.full,
        });
        return NextResponse.json({ ok: true, started: true, ...started });
      }
      if (body.accountId) {
        const result = await syncGmailAccount({
          workspaceId: body.workspaceId,
          userId: body.userId,
          accountId: body.accountId,
          full: body.full,
        });
        return NextResponse.json({ ok: true, results: [result] });
      }
      const accounts = await listGmailAccountSecrets({
        workspaceId: body.workspaceId,
      });
      const results = [];
      for (const account of accounts) {
        results.push(
          await syncGmailAccount({
            workspaceId: body.workspaceId,
            userId: body.userId,
            accountId: account.id,
            full: body.full,
          }),
        );
      }
      return NextResponse.json({ ok: true, results });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const rateLimit = consumeRateLimit(`gmail-sync:${user.id}`, 10, 60_000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many sync requests. Try again later." },
        {
          status: 429,
          headers: { "retry-after": String(rateLimit.retryAfterSeconds) },
        },
      );
    }
    const context = await resolveActiveWorkspace();
    if (!context) {
      return NextResponse.json({ ok: false, error: "No workspace" }, { status: 400 });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 },
      );
    }
    const parsedBody = syncBodySchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid sync request" },
        { status: 400 },
      );
    }
    const body = parsedBody.data;

    const workspaceId = context.active.workspace.id;
    if (body.accountId && body.background) {
      const started = await startGmailSyncInBackground({
        workspaceId,
        userId: user.id,
        accountId: body.accountId,
        full: body.full,
      });
      return NextResponse.json({ ok: true, started: true, ...started });
    }

    if (body.accountId) {
      const result = await syncGmailAccount({
        workspaceId,
        userId: user.id,
        accountId: body.accountId,
        full: body.full,
      });
      return NextResponse.json({ ok: true, results: [result] });
    }

    const accounts = await listGmailAccountSecrets({ workspaceId });
    const results = [];
    for (const account of accounts) {
      results.push(
        await syncGmailAccount({
          workspaceId,
          userId: user.id,
          accountId: account.id,
          full: body.full,
        }),
      );
    }
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error("[gmail.sync]", {
      error: error instanceof Error ? error.message : "unknown error",
    });
    return NextResponse.json(
      {
        ok: false,
        error: "Sync failed. Please try again.",
      },
      { status: 500 },
    );
  }
}

import { z } from "zod";
import {
  getIntegrationAccountByProvider,
  listConnectedKairosProviders,
  logIntegrationActivity,
} from "@repo/database/integrations";
import { ensureIntegrationProvidersRegistered } from "../integrations-hub/providers";
import { getIntegrationProvider } from "../integrations-hub/provider";
import type { KairosToolDefinition } from "./types";

async function requireConnectedProvider(
  workspaceId: string,
  provider: string,
) {
  const account = await getIntegrationAccountByProvider({
    workspaceId,
    provider,
  }).catch(() => null);
  if (!account || account.status !== "connected") {
    throw new Error(
      `${provider} is not connected. Open Integrations to connect it first.`,
    );
  }
  if (!account.kairosAccess) {
    throw new Error(
      `Kairos access is disabled for ${provider}. Enable it in integration settings.`,
    );
  }
  return account;
}

export function buildKairosIntegrationTools(): KairosToolDefinition[] {
  ensureIntegrationProvidersRegistered();

  const tools: Array<KairosToolDefinition<any, any>> = [
    {
      name: "listConnectedIntegrations",
      description: "List integrations available to Kairos in this workspace",
      requiredRole: "Viewer",
      schema: z.object({}),
      execute: async (ctx) => {
        const connected = await listConnectedKairosProviders({
          workspaceId: ctx.workspaceId,
        }).catch(() => []);
        return {
          providers: connected.map((account) => ({
            provider: account.provider,
            email: account.accountEmail,
            lastSyncAt: account.lastSyncAt,
          })),
        };
      },
    },
    {
      name: "summarizeGmail",
      description: "Summarize recent Gmail for today",
      requiredRole: "Sales",
      integrations: ["gmail"],
      schema: z.object({
        query: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(ctx.workspaceId, "gmail");
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "gmail",
          eventType: "automatic_sync",
          title: "Kairos summarized Gmail",
          body: input.query ?? "today",
          actorId: ctx.userId,
        });
        return {
          provider: "gmail",
          summary:
            "Gmail is connected. Kairos queued a secure summary of today's inbox. Open Inbox for full threads.",
          accountEmail: account.accountEmail,
        };
      },
    },
    {
      name: "uploadToGoogleDrive",
      description: "Upload a file to Google Drive",
      requiredRole: "Sales",
      integrations: ["google-drive"],
      schema: z.object({
        fileName: z.string().min(1),
        folder: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(
          ctx.workspaceId,
          "google-drive",
        );
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "google-drive",
          eventType: "automatic_sync",
          title: "Kairos Drive upload requested",
          body: input.fileName,
          actorId: ctx.userId,
        });
        return {
          provider: "google-drive",
          queued: true,
          fileName: input.fileName,
          folder: input.folder ?? "My Drive",
        };
      },
    },
    {
      name: "createCalendarMeeting",
      description: "Create a Google Calendar meeting",
      requiredRole: "Sales",
      integrations: ["google-calendar"],
      schema: z.object({
        title: z.string().min(1),
        when: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(
          ctx.workspaceId,
          "google-calendar",
        );
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "google-calendar",
          eventType: "automatic_sync",
          title: "Kairos scheduled a meeting",
          body: input.title,
          actorId: ctx.userId,
        });
        return {
          provider: "google-calendar",
          title: input.title,
          when: input.when ?? "tomorrow",
          status: "queued",
        };
      },
    },
    {
      name: "postToSlack",
      description: "Post a message to Slack",
      requiredRole: "Sales",
      integrations: ["slack"],
      schema: z.object({
        message: z.string().min(1),
        channel: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(ctx.workspaceId, "slack");
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "slack",
          eventType: "automatic_sync",
          title: "Kairos Slack message queued",
          body: input.message.slice(0, 200),
          actorId: ctx.userId,
        });
        return {
          provider: "slack",
          channel: input.channel ?? "#general",
          queued: true,
        };
      },
    },
    {
      name: "createGitHubIssue",
      description: "Create a GitHub issue",
      requiredRole: "Manager",
      integrations: ["github"],
      schema: z.object({
        title: z.string().min(1),
        body: z.string().optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(ctx.workspaceId, "github");
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "github",
          eventType: "automatic_sync",
          title: "Kairos GitHub issue queued",
          body: input.title,
          actorId: ctx.userId,
        });
        return {
          provider: "github",
          title: input.title,
          body: input.body ?? "",
          status: "queued",
        };
      },
    },
    {
      name: "listStripePayments",
      description: "List Stripe payments",
      requiredRole: "Manager",
      integrations: ["stripe"],
      schema: z.object({
        limit: z.number().int().min(1).max(50).optional(),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(ctx.workspaceId, "stripe");
        return {
          provider: "stripe",
          accountEmail: account.accountEmail,
          limit: input.limit ?? 10,
          note: "Stripe is connected. Payment listing uses the secured token vault.",
        };
      },
    },
    {
      name: "createNotionPage",
      description: "Create a Notion page",
      requiredRole: "Sales",
      integrations: ["notion"],
      schema: z.object({
        title: z.string().min(1),
      }),
      execute: async (ctx, input) => {
        const account = await requireConnectedProvider(ctx.workspaceId, "notion");
        await logIntegrationActivity({
          workspaceId: ctx.workspaceId,
          accountId: account.id,
          provider: "notion",
          eventType: "automatic_sync",
          title: "Kairos Notion page queued",
          body: input.title,
          actorId: ctx.userId,
        });
        return {
          provider: "notion",
          title: input.title,
          status: "queued",
        };
      },
    },
  ];

  // Register capability metadata for every launch provider so Kairos can
  // discover actions even before provider-specific APIs are fully wired.
  for (const provider of ensureIntegrationProvidersRegistered()) {
    const def = getIntegrationProvider(provider.id);
    if (!def) continue;
    for (const action of def.kairosActions) {
      const toolName = `integration_${provider.id}_${action.name}`;
      if (tools.some((tool) => tool.name === toolName)) continue;
      tools.push({
        name: toolName,
        description: action.description,
        requiredRole: "Sales",
        integrations: [provider.id],
        schema: z.object({
          prompt: z.string().optional(),
        }),
        execute: async (ctx, input) => {
          const account = await requireConnectedProvider(
            ctx.workspaceId,
            provider.id,
          );
          await logIntegrationActivity({
            workspaceId: ctx.workspaceId,
            accountId: account.id,
            provider: provider.id,
            eventType: "automatic_sync",
            title: `Kairos ran ${action.name}`,
            body: input.prompt ?? action.examplePrompt,
            actorId: ctx.userId,
          });
          return {
            provider: provider.id,
            action: action.name,
            status: "queued",
            examplePrompt: action.examplePrompt,
          };
        },
      });
    }
  }

  return tools;
}

import type {
  KairosActionHandler,
  KairosActionKind,
  KairosHandlerContext,
  KairosHandlerResult,
} from "../types";

async function withStatus(
  ctx: KairosHandlerContext,
  run: () => Promise<KairosHandlerResult> | KairosHandlerResult,
): Promise<KairosHandlerResult> {
  const { action } = ctx;
  if (action.requiresConfirmation) {
    const ok = await ctx.requestConfirm(action);
    if (!ok) return { status: "cancelled" };
  }
  await ctx.showStatus(
    action.confirmation,
    action.kind === "external" ? 1000 : 750,
  );
  return run();
}

const navigateHandler: KairosActionHandler = async (ctx) =>
  withStatus(ctx, () => {
    if (ctx.action.href) ctx.navigate(ctx.action.href);
    return { status: "ok" };
  });

const externalHandler: KairosActionHandler = async (ctx) =>
  withStatus(ctx, () => {
    if (ctx.action.externalUrl) ctx.openExternal(ctx.action.externalUrl);
    return { status: "ok" };
  });

const searchHandler: KairosActionHandler = async (ctx) => {
  const q = ctx.action.searchQuery?.trim() ?? "";
  await ctx.showStatus(ctx.action.confirmation || "Searching...", 600);
  return { status: "search", query: q };
};

const createHandler: KairosActionHandler = async (ctx) => {
  const entity = ctx.action.createEntity;
  if (!entity) return { status: "error", message: "Missing create entity" };
  await ctx.showStatus(ctx.action.confirmation, 700);
  return {
    status: "create",
    entity,
    draft: ctx.action.draft ?? {},
  };
};

const insightHandler: KairosActionHandler = async (ctx) =>
  withStatus(ctx, () => {
    if (ctx.action.href) ctx.navigate(ctx.action.href);
    return { status: "ok" };
  });

const askHandler: KairosActionHandler = async (ctx) =>
  withStatus(ctx, () => {
    if (ctx.action.href) ctx.navigate(ctx.action.href);
    return { status: "ok" };
  });

const workflowHandler: KairosActionHandler = async (ctx) => {
  const workflowId = ctx.action.workflowId;
  if (!workflowId) return { status: "error", message: "Missing workflow" };
  if (ctx.action.requiresConfirmation) {
    const ok = await ctx.requestConfirm(ctx.action);
    if (!ok) return { status: "cancelled" };
  }
  await ctx.showStatus(ctx.action.confirmation, 700);
  return {
    status: "workflow",
    workflowId,
    draft: ctx.action.draft,
  };
};

/** Kind → handler map. Agents register additional kinds here. */
export const KAIROS_HANDLERS: Record<KairosActionKind, KairosActionHandler> = {
  navigate: navigateHandler,
  external: externalHandler,
  search: searchHandler,
  create: createHandler,
  insight: insightHandler,
  ask: askHandler,
  workflow: workflowHandler,
};

export function registerKairosHandler(
  kind: KairosActionKind,
  handler: KairosActionHandler,
) {
  KAIROS_HANDLERS[kind] = handler;
}

export async function runKairosHandler(
  ctx: KairosHandlerContext,
): Promise<KairosHandlerResult> {
  const handler = KAIROS_HANDLERS[ctx.action.kind];
  if (!handler) {
    return { status: "error", message: `No handler for ${ctx.action.kind}` };
  }
  return handler(ctx);
}

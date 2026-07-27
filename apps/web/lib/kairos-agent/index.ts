/**
 * Kairos V2 Action Agent — public API.
 * Future AI agents should import from here and/or register handlers.
 */

export type {
  KairosAction,
  KairosActionHandler,
  KairosActionKind,
  KairosCreateEntity,
  KairosHandlerContext,
  KairosHandlerResult,
  KairosWorkflow,
  KairosWorkflowStep,
  KairosWorkspaceContext,
  KairosWorkspaceModule,
} from "./types";

export {
  KAIROS_ACTION_CATALOG,
  KAIROS_SUGGESTED_ACTIONS,
  getKairosActionById,
} from "./catalog";

export {
  detectKairosIntent,
  matchKairosActions,
  normalizeQuery,
  parsePlusCommand,
  parseSlashCommand,
  PLUS_COMMAND_HINTS,
  SLASH_COMMAND_HINTS,
} from "./intent";

export {
  buildWorkspaceContext,
  contextSuggestedActionIds,
  moduleFromPathname,
} from "./context";

export { KAIROS_WORKFLOWS, getKairosWorkflow } from "./workflows";

export {
  KAIROS_HANDLERS,
  registerKairosHandler,
  runKairosHandler,
} from "./handlers";

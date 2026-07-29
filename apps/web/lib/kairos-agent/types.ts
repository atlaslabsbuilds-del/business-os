/**
 * Kairos V2 — shared action / workflow types.
 * Future agents plug into the same handler registry.
 */

export type KairosCreateEntity =
  | "customer"
  | "deal"
  | "task"
  | "reminder"
  | "note"
  | "meeting";

export type KairosActionKind =
  | "navigate"
  | "external"
  | "search"
  | "create"
  | "insight"
  | "ask"
  | "workflow";

export type KairosWorkspaceModule =
  | "dashboard"
  | "crm"
  | "inbox"
  | "analytics"
  | "customers"
  | "deals"
  | "marketing"
  | "settings"
  | "calendar"
  | "finance"
  | "chat"
  | "ai"
  | "other";

export type KairosWorkspaceContext = {
  pathname: string;
  module: KairosWorkspaceModule;
  workspaceId?: string;
  organizationName?: string;
  userId?: string;
  userEmail?: string | null;
  customerId?: string;
  dealId?: string;
  taskId?: string;
  threadId?: string;
};

export type KairosAction = {
  id: string;
  kind: KairosActionKind;
  label: string;
  description: string;
  /** Short status overlay, e.g. "Opening CRM..." */
  confirmation: string;
  href?: string;
  externalUrl?: string;
  searchQuery?: string;
  createEntity?: KairosCreateEntity;
  draft?: Record<string, string>;
  keywords: string[];
  /** Leave-app / destructive / irreversible — always confirm first */
  requiresConfirmation?: boolean;
  danger?: boolean;
  confirmTitle?: string;
  confirmBody?: string;
  /** Multi-step workflow id */
  workflowId?: string;
  /** Preferred modules for context-aware ranking */
  modules?: KairosWorkspaceModule[];
  slash?: string;
  plus?: string;
};

export type KairosWorkflowStep = {
  id: string;
  label: string;
  description: string;
  actionId: string;
  /** Override draft keys for this step */
  draftFrom?: Record<string, string>;
};

export type KairosWorkflow = {
  id: string;
  label: string;
  description: string;
  confirmation: string;
  steps: KairosWorkflowStep[];
  keywords: string[];
  requiresConfirmation?: boolean;
};

export type KairosHandlerResult =
  | { status: "ok" }
  | { status: "search"; query: string }
  | { status: "create"; entity: KairosCreateEntity; draft: Record<string, string> }
  | { status: "workflow"; workflowId: string; draft?: Record<string, string> }
  | { status: "confirm"; action: KairosAction }
  | { status: "cancelled" }
  | { status: "error"; message: string };

export type KairosHandlerContext = {
  action: KairosAction;
  workspace: KairosWorkspaceContext;
  navigate: (href: string) => void;
  openExternal: (url: string) => void;
  showStatus: (message: string, durationMs?: number) => Promise<void>;
  openQuickCreate: (
    entity: KairosCreateEntity,
    draft?: Record<string, string>,
  ) => void;
  requestConfirm: (action: KairosAction) => Promise<boolean>;
  startWorkflow: (
    workflowId: string,
    draft?: Record<string, string>,
  ) => void;
};

export type KairosActionHandler = (
  ctx: KairosHandlerContext,
) => Promise<KairosHandlerResult>;

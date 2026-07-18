export type ToolPermission =
  | "workspace:read"
  | "workspace:write"
  | "user:read"
  | "credits:read"
  | "team:read"
  | "knowledge:read"
  | "knowledge:write"
  | "crm:read"
  | "crm:write"
  | "inbox:read"
  | "inbox:write";

export type WorkspaceRole = "owner" | "admin" | "member";

export type ToolExecutionContext = {
  sessionId?: string;
  userId?: string;
  workspaceId?: string;
  workspaceRole?: WorkspaceRole;
  metadata?: Record<string, unknown>;
};

export class ToolPermissionError extends Error {
  readonly permission: ToolPermission;

  constructor(permission: ToolPermission) {
    super(`Missing permission: ${permission}`);
    this.name = "ToolPermissionError";
    this.permission = permission;
  }
}

const ROLE_RANK: Record<WorkspaceRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function assertToolPermissions(input: {
  required: ToolPermission[];
  context: ToolExecutionContext;
}): void {
  for (const permission of input.required) {
    if (!hasToolPermission(permission, input.context)) {
      throw new ToolPermissionError(permission);
    }
  }
}

export function hasToolPermission(
  permission: ToolPermission,
  context: ToolExecutionContext,
): boolean {
  switch (permission) {
    case "user:read":
      return Boolean(context.userId);
    case "workspace:read":
    case "workspace:write":
    case "crm:read":
    case "crm:write":
    case "inbox:read":
    case "inbox:write":
      return Boolean(context.workspaceId && context.userId);
    case "credits:read":
      return Boolean(context.workspaceId && context.userId);
    case "team:read":
      return Boolean(
        context.workspaceId &&
          context.userId &&
          context.workspaceRole &&
          ROLE_RANK[context.workspaceRole] >= ROLE_RANK.member,
      );
    case "knowledge:read":
      return Boolean(context.workspaceId && context.userId);
    case "knowledge:write":
      return Boolean(
        context.workspaceId &&
          context.userId &&
          context.workspaceRole &&
          ROLE_RANK[context.workspaceRole] >= ROLE_RANK.admin,
      );
    default:
      return false;
  }
}

export function filterToolsByPermissions<T extends { permissions?: ToolPermission[] }>(
  tools: T[],
  context: ToolExecutionContext,
): T[] {
  return tools.filter((tool) => {
    const required = tool.permissions ?? [];
    return required.every((permission) => hasToolPermission(permission, context));
  });
}

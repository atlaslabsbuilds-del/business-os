import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "admin", "member"]);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const invitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "revoked",
  "expired",
]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export type Invitation = {
  id: string;
  workspaceId: string;
  email: string;
  role: Exclude<WorkspaceRole, "owner">;
  status: InvitationStatus;
  invitedBy: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMembership = {
  membershipId: string;
  role: WorkspaceRole;
  workspace: Workspace;
};

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(60, "Workspace name must be at most 60 characters"),
});

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["admin", "member"]),
});

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters")
    .max(60, "Workspace name must be at most 60 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(60, "Slug must be at most 60 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters, numbers, and hyphens",
    ),
  logoUrl: z.union([z.literal(""), z.string().trim().url("Enter a valid logo URL")]),
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.string().uuid("Select a valid member"),
});

export const deleteWorkspaceSchema = z.object({
  confirmName: z.string().trim().min(1, "Type the workspace name to confirm"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type DeleteWorkspaceInput = z.infer<typeof deleteWorkspaceSchema>;

export const WORKSPACE_COOKIE = "bos_workspace_id";

export function slugifyWorkspaceName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base.length > 0 ? base : "workspace";
}

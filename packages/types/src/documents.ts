import { z } from "zod";

export const documentStatusSchema = z.enum([
  "draft",
  "published",
  "archived",
  "trashed",
]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentSharePermissionSchema = z.enum([
  "view",
  "comment",
  "edit",
  "owner",
]);
export type DocumentSharePermission = z.infer<
  typeof documentSharePermissionSchema
>;

export const knowledgeCategorySchema = z.enum([
  "wiki",
  "company",
  "policies",
  "guides",
  "playbooks",
]);
export type KnowledgeCategory = z.infer<typeof knowledgeCategorySchema>;

export type DocFolder = {
  id: string;
  workspaceId: string;
  createdBy: string;
  parentId: string | null;
  name: string;
  isArchived: boolean;
  isFavorite: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceDocument = {
  id: string;
  workspaceId: string;
  createdBy: string;
  ownerId: string | null;
  folderId: string | null;
  title: string;
  content: string;
  status: DocumentStatus;
  tags: string[];
  isTemplate: boolean;
  isFavorite: boolean;
  isKnowledge: boolean;
  knowledgeCategory: string | null;
  summary: string | null;
  wordCount: number;
  lastEditedBy: string | null;
  trashedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersion = {
  id: string;
  workspaceId: string;
  documentId: string;
  createdBy: string;
  title: string;
  content: string;
  versionNumber: number;
  changeSummary: string | null;
  createdAt: string;
};

export type DocumentComment = {
  id: string;
  workspaceId: string;
  documentId: string;
  createdBy: string;
  body: string;
  mentions: string[];
  anchor: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentShare = {
  id: string;
  workspaceId: string;
  documentId: string;
  sharedBy: string;
  userId: string | null;
  email: string | null;
  permission: DocumentSharePermission;
  createdAt: string;
};

export type KnowledgeArticle = {
  id: string;
  workspaceId: string;
  documentId: string | null;
  createdBy: string;
  title: string;
  category: KnowledgeCategory;
  summary: string | null;
  body: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DocumentSettings = {
  workspaceId: string;
  defaultSharePermission: DocumentSharePermission;
  autosaveSeconds: number;
  enableTemplates: boolean;
  knowledgeCategories: string[];
  permissions: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type DocumentsDashboardStats = {
  total: number;
  shared: number;
  recent: number;
  templates: number;
  knowledge: number;
  trashed: number;
};

export const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(120),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateFolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120).optional(),
  parentId: z.string().uuid().optional().nullable(),
  isArchived: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(200_000).optional(),
  folderId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).optional(),
  isTemplate: z.boolean().optional(),
  isKnowledge: z.boolean().optional(),
  knowledgeCategory: knowledgeCategorySchema.optional().nullable(),
  status: documentStatusSchema.optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: z.string().uuid(),
  summary: z.string().trim().max(2000).optional().nullable(),
  isFavorite: z.boolean().optional(),
});

export const createDocumentCommentSchema = z.object({
  documentId: z.string().uuid(),
  body: z.string().trim().min(1).max(4000),
  mentions: z.array(z.string().uuid()).optional(),
  anchor: z.string().trim().max(200).optional().nullable(),
});

export const createDocumentShareSchema = z.object({
  documentId: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  email: z.string().trim().email().optional().nullable(),
  permission: documentSharePermissionSchema.optional(),
});

export const createKnowledgeArticleSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: knowledgeCategorySchema.optional(),
  summary: z.string().trim().max(2000).optional().nullable(),
  body: z.string().max(100_000).optional(),
  tags: z.array(z.string()).optional(),
  documentId: z.string().uuid().optional().nullable(),
  isPublished: z.boolean().optional(),
});

export const updateDocumentSettingsSchema = z.object({
  defaultSharePermission: documentSharePermissionSchema.optional(),
  autosaveSeconds: z.number().int().min(1).max(60).optional(),
  enableTemplates: z.boolean().optional(),
  knowledgeCategories: z.array(z.string()).optional(),
  permissions: z.record(z.string(), z.unknown()).optional(),
});

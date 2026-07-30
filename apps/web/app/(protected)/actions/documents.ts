"use server";

import { getUser } from "@repo/auth/server";
import {
  answerFromKnowledgeBase,
  createDocument,
  createDocumentComment,
  createDocumentShare,
  createFolder,
  createKnowledgeArticle,
  deleteDocument,
  deleteFolder,
  getDocument,
  getDocumentSettings,
  getDocumentsDashboardStats,
  listDocumentComments,
  listDocumentShares,
  listDocumentVersions,
  listDocuments,
  listFolders,
  listKnowledgeArticles,
  searchDocumentsGlobal,
  trashDocument,
  updateDocument,
  updateDocumentSettings,
  updateFolder,
} from "@repo/database/documents";
import { getMembershipRole } from "@repo/database/workspace";
import {
  createDocumentCommentSchema,
  createDocumentSchema,
  createDocumentShareSchema,
  createFolderSchema,
  createKnowledgeArticleSchema,
  updateDocumentSchema,
  updateDocumentSettingsSchema,
  updateFolderSchema,
} from "@repo/types";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type DocumentsActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireDocumentsContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");
  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");
  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");
  return { userId: user.id, workspaceId: context.active.workspace.id };
}

function fail(error: unknown): DocumentsActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Something went wrong",
  };
}

export async function getDocumentsModuleData(input?: {
  folderId?: string | null;
  view?: "all" | "shared" | "recent" | "templates" | "knowledge" | "trash";
  query?: string;
}) {
  const ctx = await requireDocumentsContext();
  const view = input?.view ?? "all";
  const [stats, folders, settings, knowledge, documents] = await Promise.all([
    getDocumentsDashboardStats({ workspaceId: ctx.workspaceId }),
    listFolders({ workspaceId: ctx.workspaceId }),
    getDocumentSettings({ workspaceId: ctx.workspaceId }),
    listKnowledgeArticles({
      workspaceId: ctx.workspaceId,
      query: input?.query,
    }),
    listDocuments({
      workspaceId: ctx.workspaceId,
      query: input?.query,
      folderId: input?.folderId,
      templatesOnly: view === "templates",
      knowledgeOnly: view === "knowledge",
      sharedOnly: view === "shared",
      trashedOnly: view === "trash",
      limit: view === "recent" ? 20 : undefined,
    }),
  ]);

  return {
    stats,
    folders,
    settings,
    knowledge,
    documents:
      view === "recent"
        ? [...documents].sort(
            (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
          )
        : documents,
    userId: ctx.userId,
  };
}

export async function createFolderAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = createFolderSchema.parse(input);
    const folder = await createFolder({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: folder.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateFolderAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = updateFolderSchema.parse(input);
    const { id, ...patch } = parsed;
    const folder = await updateFolder({
      workspaceId: ctx.workspaceId,
      id,
      ...patch,
    });
    return { ok: true, data: { id: folder.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteFolderAction(input: {
  id: string;
}): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    await deleteFolder({ workspaceId: ctx.workspaceId, id: input.id });
    return { ok: true, data: { id: input.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createDocumentAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = createDocumentSchema.parse(input);
    const document = await createDocument({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: document.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateDocumentAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string; updatedAt: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = updateDocumentSchema.parse(input);
    const { id, ...patch } = parsed;
    const document = await updateDocument({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      id,
      ...patch,
      createVersion: Boolean(patch.content),
    });
    return {
      ok: true,
      data: { id: document.id, updatedAt: document.updatedAt },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function autosaveDocumentAction(input: {
  id: string;
  title?: string;
  content?: string;
}): Promise<DocumentsActionResult<{ id: string; updatedAt: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const document = await updateDocument({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      id: input.id,
      title: input.title,
      content: input.content,
      createVersion: false,
    });
    return {
      ok: true,
      data: { id: document.id, updatedAt: document.updatedAt },
    };
  } catch (error) {
    return fail(error);
  }
}

export async function trashDocumentAction(input: {
  id: string;
}): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const document = await trashDocument({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      id: input.id,
    });
    return { ok: true, data: { id: document.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteDocumentAction(input: {
  id: string;
}): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    await deleteDocument({ workspaceId: ctx.workspaceId, id: input.id });
    return { ok: true, data: { id: input.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function getDocumentDetailAction(input: {
  id: string;
}): Promise<
  DocumentsActionResult<{
    document: NonNullable<Awaited<ReturnType<typeof getDocument>>>;
    versions: Awaited<ReturnType<typeof listDocumentVersions>>;
    comments: Awaited<ReturnType<typeof listDocumentComments>>;
    shares: Awaited<ReturnType<typeof listDocumentShares>>;
  }>
> {
  try {
    const ctx = await requireDocumentsContext();
    const document = await getDocument({
      workspaceId: ctx.workspaceId,
      id: input.id,
    });
    if (!document) throw new Error("Document not found");
    const [versions, comments, shares] = await Promise.all([
      listDocumentVersions({
        workspaceId: ctx.workspaceId,
        documentId: input.id,
      }),
      listDocumentComments({
        workspaceId: ctx.workspaceId,
        documentId: input.id,
      }),
      listDocumentShares({
        workspaceId: ctx.workspaceId,
        documentId: input.id,
      }),
    ]);
    return { ok: true, data: { document, versions, comments, shares } };
  } catch (error) {
    return fail(error);
  }
}

export async function createDocumentCommentAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = createDocumentCommentSchema.parse(input);
    const comment = await createDocumentComment({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: comment.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createDocumentShareAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = createDocumentShareSchema.parse(input);
    const share = await createDocumentShare({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      documentId: parsed.documentId,
      sharedUserId: parsed.userId,
      email: parsed.email,
      permission: parsed.permission,
    });
    return { ok: true, data: { id: share.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function createKnowledgeArticleAction(
  input: unknown,
): Promise<DocumentsActionResult<{ id: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = createKnowledgeArticleSchema.parse(input);
    const article = await createKnowledgeArticle({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed,
    });
    return { ok: true, data: { id: article.id } };
  } catch (error) {
    return fail(error);
  }
}

export async function updateDocumentSettingsAction(
  input: unknown,
): Promise<DocumentsActionResult<{ workspaceId: string }>> {
  try {
    const ctx = await requireDocumentsContext();
    const parsed = updateDocumentSettingsSchema.parse(input);
    const settings = await updateDocumentSettings({
      workspaceId: ctx.workspaceId,
      ...parsed,
    });
    return { ok: true, data: { workspaceId: settings.workspaceId } };
  } catch (error) {
    return fail(error);
  }
}

export async function searchDocumentsAction(input: {
  query: string;
}): Promise<DocumentsActionResult<Awaited<ReturnType<typeof searchDocumentsGlobal>>>> {
  try {
    const ctx = await requireDocumentsContext();
    const data = await searchDocumentsGlobal({
      workspaceId: ctx.workspaceId,
      query: input.query,
    });
    return { ok: true, data };
  } catch (error) {
    return fail(error);
  }
}

export async function answerKnowledgeAction(input: {
  question: string;
}): Promise<
  DocumentsActionResult<Awaited<ReturnType<typeof answerFromKnowledgeBase>>>
> {
  try {
    const ctx = await requireDocumentsContext();
    const data = await answerFromKnowledgeBase({
      workspaceId: ctx.workspaceId,
      question: input.question,
    });
    return { ok: true, data };
  } catch (error) {
    return fail(error);
  }
}

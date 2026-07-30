import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  DocFolder,
  DocumentComment,
  DocumentSettings,
  DocumentShare,
  DocumentSharePermission,
  DocumentStatus,
  DocumentsDashboardStats,
  DocumentVersion,
  Json,
  KnowledgeArticle,
  KnowledgeCategory,
  WorkspaceDocument,
} from "@repo/types";
import { createServerClient } from "./server";

type FolderRow = Database["public"]["Tables"]["folders"]["Row"];
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type VersionRow = Database["public"]["Tables"]["document_versions"]["Row"];
type CommentRow = Database["public"]["Tables"]["document_comments"]["Row"];
type ShareRow = Database["public"]["Tables"]["document_shares"]["Row"];
type KnowledgeRow = Database["public"]["Tables"]["knowledge_articles"]["Row"];
type SettingsRow = Database["public"]["Tables"]["document_settings"]["Row"];

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

function wordCount(content: string): number {
  return content.trim() ? content.trim().split(/\s+/).length : 0;
}

function mapFolder(row: FolderRow): DocFolder {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    parentId: row.parent_id,
    name: row.name,
    isArchived: row.is_archived,
    isFavorite: row.is_favorite,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDocument(row: DocumentRow): WorkspaceDocument {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    ownerId: row.owner_id,
    folderId: row.folder_id,
    title: row.title,
    content: row.content,
    status: row.status,
    tags: row.tags ?? [],
    isTemplate: row.is_template,
    isFavorite: row.is_favorite,
    isKnowledge: row.is_knowledge,
    knowledgeCategory: row.knowledge_category,
    summary: row.summary,
    wordCount: row.word_count,
    lastEditedBy: row.last_edited_by,
    trashedAt: row.trashed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersion(row: VersionRow): DocumentVersion {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    documentId: row.document_id,
    createdBy: row.created_by,
    title: row.title,
    content: row.content,
    versionNumber: row.version_number,
    changeSummary: row.change_summary,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): DocumentComment {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    documentId: row.document_id,
    createdBy: row.created_by,
    body: row.body,
    mentions: row.mentions ?? [],
    anchor: row.anchor,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapShare(row: ShareRow): DocumentShare {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    documentId: row.document_id,
    sharedBy: row.shared_by,
    userId: row.user_id,
    email: row.email,
    permission: row.permission,
    createdAt: row.created_at,
  };
}

function mapKnowledge(row: KnowledgeRow): KnowledgeArticle {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    documentId: row.document_id,
    createdBy: row.created_by,
    title: row.title,
    category: row.category,
    summary: row.summary,
    body: row.body,
    tags: row.tags ?? [],
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): DocumentSettings {
  return {
    workspaceId: row.workspace_id,
    defaultSharePermission: row.default_share_permission,
    autosaveSeconds: row.autosave_seconds,
    enableTemplates: row.enable_templates,
    knowledgeCategories: Array.isArray(row.knowledge_categories)
      ? row.knowledge_categories.filter((item): item is string => typeof item === "string")
      : ["wiki", "company", "policies", "guides", "playbooks"],
    permissions:
      row.permissions && typeof row.permissions === "object" && !Array.isArray(row.permissions)
        ? (row.permissions as Record<string, unknown>)
        : { canShare: true, canPublish: true },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listFolders(input: {
  workspaceId: string;
  includeArchived?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<DocFolder[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("folders")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("position", { ascending: true });
  if (!input.includeArchived) builder = builder.eq("is_archived", false);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list folders: ${error.message}`);
  return (data ?? []).map(mapFolder);
}

export async function createFolder(input: {
  workspaceId: string;
  userId: string;
  name: string;
  parentId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<DocFolder> {
  const supabase = await clientOrDefault(input.client);
  const siblings = await listFolders({
    workspaceId: input.workspaceId,
    includeArchived: true,
    client: input.client,
  });
  const { data, error } = await supabase
    .from("folders")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name,
      parent_id: input.parentId ?? null,
      position: siblings.filter((folder) => folder.parentId === (input.parentId ?? null)).length,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create folder: ${error?.message ?? "Unknown"}`);
  }
  return mapFolder(data);
}

export async function updateFolder(input: {
  workspaceId: string;
  id: string;
  name?: string;
  parentId?: string | null;
  isArchived?: boolean;
  isFavorite?: boolean;
  position?: number;
  client?: SupabaseClient<Database>;
}): Promise<DocFolder> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["folders"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.parentId !== undefined) patch.parent_id = input.parentId;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;
  if (input.position !== undefined) patch.position = input.position;
  const { data, error } = await supabase
    .from("folders")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update folder: ${error?.message ?? "Unknown"}`);
  }
  return mapFolder(data);
}

export async function deleteFolder(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("folders")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete folder: ${error.message}`);
}

export async function listDocuments(input: {
  workspaceId: string;
  query?: string;
  folderId?: string | null;
  status?: DocumentStatus;
  templatesOnly?: boolean;
  knowledgeOnly?: boolean;
  favoritesOnly?: boolean;
  sharedOnly?: boolean;
  trashedOnly?: boolean;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceDocument[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });

  if (input.trashedOnly) builder = builder.eq("status", "trashed");
  else if (input.status) builder = builder.eq("status", input.status);
  else builder = builder.neq("status", "trashed");

  if (input.folderId !== undefined) {
    builder =
      input.folderId === null
        ? builder.is("folder_id", null)
        : builder.eq("folder_id", input.folderId);
  }
  if (input.templatesOnly) builder = builder.eq("is_template", true);
  if (input.knowledgeOnly) builder = builder.eq("is_knowledge", true);
  if (input.favoritesOnly) builder = builder.eq("is_favorite", true);
  if (input.query) {
    builder = builder.or(
      `title.ilike.%${input.query}%,content.ilike.%${input.query}%`,
    );
  }
  if (input.limit) builder = builder.limit(input.limit);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list documents: ${error.message}`);
  let rows = (data ?? []).map(mapDocument);
  if (input.sharedOnly) {
    const shares = await listDocumentShares({
      workspaceId: input.workspaceId,
      client: input.client,
    });
    const sharedIds = new Set(shares.map((share) => share.documentId));
    rows = rows.filter((doc) => sharedIds.has(doc.id));
  }
  return rows;
}

export async function getDocument(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceDocument | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load document: ${error.message}`);
  return data ? mapDocument(data) : null;
}

export async function createDocument(input: {
  workspaceId: string;
  userId: string;
  title?: string;
  content?: string;
  folderId?: string | null;
  tags?: string[];
  isTemplate?: boolean;
  isKnowledge?: boolean;
  knowledgeCategory?: string | null;
  status?: DocumentStatus;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceDocument> {
  const supabase = await clientOrDefault(input.client);
  const content = input.content ?? "";
  const { data, error } = await supabase
    .from("documents")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      last_edited_by: input.userId,
      title: input.title ?? "Untitled",
      content,
      word_count: wordCount(content),
      folder_id: input.folderId ?? null,
      tags: input.tags ?? [],
      is_template: input.isTemplate ?? false,
      is_knowledge: input.isKnowledge ?? false,
      knowledge_category: input.knowledgeCategory ?? null,
      status: input.status ?? "draft",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create document: ${error?.message ?? "Unknown"}`);
  }
  await supabase.from("document_versions").insert({
    workspace_id: input.workspaceId,
    document_id: data.id,
    created_by: input.userId,
    title: data.title,
    content: data.content,
    version_number: 1,
    change_summary: "Initial version",
  });
  return mapDocument(data);
}

export async function updateDocument(input: {
  workspaceId: string;
  userId: string;
  id: string;
  title?: string;
  content?: string;
  folderId?: string | null;
  tags?: string[];
  status?: DocumentStatus;
  summary?: string | null;
  isTemplate?: boolean;
  isFavorite?: boolean;
  isKnowledge?: boolean;
  knowledgeCategory?: string | null;
  createVersion?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceDocument> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["documents"]["Update"] = {
    last_edited_by: input.userId,
  };
  if (input.title !== undefined) patch.title = input.title;
  if (input.content !== undefined) {
    patch.content = input.content;
    patch.word_count = wordCount(input.content);
  }
  if (input.folderId !== undefined) patch.folder_id = input.folderId;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.trashed_at =
      input.status === "trashed" ? new Date().toISOString() : null;
  }
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.isTemplate !== undefined) patch.is_template = input.isTemplate;
  if (input.isFavorite !== undefined) patch.is_favorite = input.isFavorite;
  if (input.isKnowledge !== undefined) patch.is_knowledge = input.isKnowledge;
  if (input.knowledgeCategory !== undefined) {
    patch.knowledge_category = input.knowledgeCategory;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update document: ${error?.message ?? "Unknown"}`);
  }

  if (input.createVersion) {
    const versions = await listDocumentVersions({
      workspaceId: input.workspaceId,
      documentId: input.id,
      client: input.client,
    });
    await supabase.from("document_versions").insert({
      workspace_id: input.workspaceId,
      document_id: input.id,
      created_by: input.userId,
      title: data.title,
      content: data.content,
      version_number: (versions[0]?.versionNumber ?? 0) + 1,
      change_summary: "Autosave checkpoint",
    });
  }

  return mapDocument(data);
}

export async function trashDocument(input: {
  workspaceId: string;
  userId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<WorkspaceDocument> {
  return updateDocument({
    workspaceId: input.workspaceId,
    userId: input.userId,
    id: input.id,
    status: "trashed",
    client: input.client,
  });
}

export async function deleteDocument(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

export async function listDocumentVersions(input: {
  workspaceId: string;
  documentId: string;
  client?: SupabaseClient<Database>;
}): Promise<DocumentVersion[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("document_versions")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("document_id", input.documentId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(`Failed to list versions: ${error.message}`);
  return (data ?? []).map(mapVersion);
}

export async function listDocumentComments(input: {
  workspaceId: string;
  documentId: string;
  client?: SupabaseClient<Database>;
}): Promise<DocumentComment[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("document_comments")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("document_id", input.documentId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list document comments: ${error.message}`);
  return (data ?? []).map(mapComment);
}

export async function createDocumentComment(input: {
  workspaceId: string;
  userId: string;
  documentId: string;
  body: string;
  mentions?: string[];
  anchor?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<DocumentComment> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("document_comments")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      document_id: input.documentId,
      body: input.body,
      mentions: input.mentions ?? [],
      anchor: input.anchor ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create document comment: ${error?.message ?? "Unknown"}`);
  }
  return mapComment(data);
}

export async function listDocumentShares(input: {
  workspaceId: string;
  documentId?: string;
  client?: SupabaseClient<Database>;
}): Promise<DocumentShare[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("document_shares")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });
  if (input.documentId) builder = builder.eq("document_id", input.documentId);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list shares: ${error.message}`);
  return (data ?? []).map(mapShare);
}

export async function createDocumentShare(input: {
  workspaceId: string;
  userId: string;
  documentId: string;
  sharedUserId?: string | null;
  email?: string | null;
  permission?: DocumentSharePermission;
  client?: SupabaseClient<Database>;
}): Promise<DocumentShare> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("document_shares")
    .insert({
      workspace_id: input.workspaceId,
      shared_by: input.userId,
      document_id: input.documentId,
      user_id: input.sharedUserId ?? null,
      email: input.email ?? null,
      permission: input.permission ?? "view",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create share: ${error?.message ?? "Unknown"}`);
  }
  return mapShare(data);
}

export async function listKnowledgeArticles(input: {
  workspaceId: string;
  category?: KnowledgeCategory;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<KnowledgeArticle[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("knowledge_articles")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("is_published", true)
    .order("updated_at", { ascending: false });
  if (input.category) builder = builder.eq("category", input.category);
  if (input.query) {
    builder = builder.or(
      `title.ilike.%${input.query}%,body.ilike.%${input.query}%`,
    );
  }
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list knowledge articles: ${error.message}`);
  return (data ?? []).map(mapKnowledge);
}

export async function createKnowledgeArticle(input: {
  workspaceId: string;
  userId: string;
  title: string;
  category?: KnowledgeCategory;
  summary?: string | null;
  body?: string;
  tags?: string[];
  documentId?: string | null;
  isPublished?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<KnowledgeArticle> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("knowledge_articles")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title,
      category: input.category ?? "guides",
      summary: input.summary ?? null,
      body: input.body ?? "",
      tags: input.tags ?? [],
      document_id: input.documentId ?? null,
      is_published: input.isPublished ?? true,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to create knowledge article: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapKnowledge(data);
}

export async function getDocumentSettings(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<DocumentSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("document_settings")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load document settings: ${error.message}`);
  if (data) return mapSettings(data);
  const { data: created, error: createError } = await supabase
    .from("document_settings")
    .insert({ workspace_id: input.workspaceId })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(
      `Failed to create document settings: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(created);
}

export async function updateDocumentSettings(input: {
  workspaceId: string;
  defaultSharePermission?: DocumentSharePermission;
  autosaveSeconds?: number;
  enableTemplates?: boolean;
  knowledgeCategories?: string[];
  permissions?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<DocumentSettings> {
  const supabase = await clientOrDefault(input.client);
  await getDocumentSettings(input);
  const patch: Database["public"]["Tables"]["document_settings"]["Update"] = {};
  if (input.defaultSharePermission !== undefined) {
    patch.default_share_permission = input.defaultSharePermission;
  }
  if (input.autosaveSeconds !== undefined) {
    patch.autosave_seconds = input.autosaveSeconds;
  }
  if (input.enableTemplates !== undefined) {
    patch.enable_templates = input.enableTemplates;
  }
  if (input.knowledgeCategories !== undefined) {
    patch.knowledge_categories = input.knowledgeCategories as Json;
  }
  if (input.permissions !== undefined) {
    patch.permissions = input.permissions as Json;
  }
  const { data, error } = await supabase
    .from("document_settings")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update document settings: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(data);
}

export async function getDocumentsDashboardStats(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<DocumentsDashboardStats> {
  const [all, templates, knowledge, trashed, shares] = await Promise.all([
    listDocuments({ workspaceId: input.workspaceId, client: input.client }),
    listDocuments({
      workspaceId: input.workspaceId,
      templatesOnly: true,
      client: input.client,
    }),
    listDocuments({
      workspaceId: input.workspaceId,
      knowledgeOnly: true,
      client: input.client,
    }),
    listDocuments({
      workspaceId: input.workspaceId,
      trashedOnly: true,
      client: input.client,
    }),
    listDocumentShares({ workspaceId: input.workspaceId, client: input.client }),
  ]);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    total: all.length,
    shared: new Set(shares.map((share) => share.documentId)).size,
    recent: all.filter((doc) => Date.parse(doc.updatedAt) >= weekAgo).length,
    templates: templates.length,
    knowledge: knowledge.length,
    trashed: trashed.length,
  };
}

export async function searchDocumentsGlobal(input: {
  workspaceId: string;
  query: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<{
  documents: WorkspaceDocument[];
  folders: DocFolder[];
  knowledge: KnowledgeArticle[];
}> {
  const query = input.query.trim();
  if (!query) return { documents: [], folders: [], knowledge: [] };
  const [documents, folders, knowledge] = await Promise.all([
    listDocuments({
      workspaceId: input.workspaceId,
      query,
      limit: input.limit ?? 10,
      client: input.client,
    }),
    listFolders({ workspaceId: input.workspaceId, client: input.client }),
    listKnowledgeArticles({
      workspaceId: input.workspaceId,
      query,
      client: input.client,
    }),
  ]);
  return {
    documents,
    folders: folders
      .filter((folder) => folder.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, input.limit ?? 10),
    knowledge: knowledge.slice(0, input.limit ?? 10),
  };
}

export async function answerFromKnowledgeBase(input: {
  workspaceId: string;
  question: string;
  client?: SupabaseClient<Database>;
}): Promise<{ answer: string; sources: KnowledgeArticle[] }> {
  const articles = await listKnowledgeArticles({
    workspaceId: input.workspaceId,
    query: input.question,
    client: input.client,
  });
  const sources = articles.slice(0, 3);
  if (sources.length === 0) {
    return {
      answer:
        "No matching knowledge base articles were found. Add company docs, policies, or playbooks to improve answers.",
      sources: [],
    };
  }
  const snippets = sources
    .map(
      (article) =>
        `${article.title}: ${(article.summary || article.body).slice(0, 220)}`,
    )
    .join("\n\n");
  return {
    answer: `Based on the knowledge base:\n\n${snippets}`,
    sources,
  };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ContentAnalytics,
  ContentAsset,
  ContentBrandVoice,
  ContentDashboardStats,
  ContentItem,
  ContentStatus,
  ContentTemplate,
  ContentType,
  Database,
  Json,
} from "@repo/types";
import { createServerClient } from "./server";

type Client = SupabaseClient<Database>;
type ContentRow = Database["public"]["Tables"]["content_items"]["Row"];
type VoiceRow = Database["public"]["Tables"]["content_brand_voices"]["Row"];
type AssetRow = Database["public"]["Tables"]["content_assets"]["Row"];
type TemplateRow = Database["public"]["Tables"]["content_templates"]["Row"];

const clientOrDefault = async (client?: Client) =>
  client ?? (await createServerClient());

function record(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function analytics(value: Json): ContentAnalytics {
  const data = record(value);
  return {
    views: Number(data.views ?? 0),
    engagement: Number(data.engagement ?? 0),
    reach: Number(data.reach ?? 0),
    clicks: Number(data.clicks ?? 0),
  };
}

function mapContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    title: row.title,
    body: row.body,
    contentType: row.content_type,
    status: row.status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    tags: row.tags,
    aiGenerated: row.ai_generated,
    sourceItemId: row.source_item_id,
    analytics: analytics(row.analytics),
    metadata: record(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVoice(row: VoiceRow): ContentBrandVoice {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    tone: row.tone,
    writingStyle: row.writing_style,
    ctaPreferences: row.cta_preferences,
    keywords: row.keywords,
    audienceProfile: row.audience_profile,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAsset(row: AssetRow): ContentAsset {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    assetType: row.asset_type,
    url: row.url,
    storagePath: row.storage_path,
    metadata: record(row.metadata),
    createdAt: row.created_at,
  };
}

function mapTemplate(row: TemplateRow): ContentTemplate {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    templateType: row.template_type,
    body: row.body,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listContentItems(input: {
  workspaceId: string;
  status?: ContentStatus;
  contentType?: ContentType;
  from?: string;
  to?: string;
  limit?: number;
  client?: Client;
}): Promise<ContentItem[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("content_items")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 100);
  if (input.status) query = query.eq("status", input.status);
  if (input.contentType) query = query.eq("content_type", input.contentType);
  if (input.from) query = query.gte("scheduled_at", input.from);
  if (input.to) query = query.lte("scheduled_at", input.to);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list content: ${error.message}`);
  return (data ?? []).map(mapContent);
}

export async function getContentDashboardStats(input: {
  workspaceId: string;
  client?: Client;
}): Promise<ContentDashboardStats> {
  const items = await listContentItems({
    workspaceId: input.workspaceId,
    limit: 500,
    client: input.client,
  });
  const sums = items.reduce(
    (result, item) => {
      result.views += item.analytics.views;
      result.engagement += item.analytics.engagement;
      result.reach += item.analytics.reach;
      result.clicks += item.analytics.clicks;
      return result;
    },
    { views: 0, engagement: 0, reach: 0, clicks: 0 },
  );
  return {
    total: items.length,
    drafts: items.filter((item) => item.status === "draft").length,
    scheduled: items.filter((item) => item.status === "scheduled").length,
    published: items.filter((item) => item.status === "published").length,
    aiSuggestions: items.filter((item) => item.aiGenerated).length,
    ...sums,
  };
}

export async function createContentItem(input: {
  workspaceId: string;
  userId: string;
  title?: string;
  body?: string;
  contentType?: ContentType;
  status?: ContentStatus;
  scheduledAt?: string | null;
  tags?: string[];
  aiGenerated?: boolean;
  client?: Client;
}): Promise<ContentItem> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("content_items")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title ?? "Untitled content",
      body: input.body ?? "",
      content_type: input.contentType ?? "linkedin",
      status: input.status ?? "draft",
      scheduled_at: input.scheduledAt ?? null,
      tags: input.tags ?? [],
      ai_generated: input.aiGenerated ?? false,
      analytics: { views: 0, engagement: 0, reach: 0, clicks: 0 } as Json,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create content: ${error?.message ?? "Unknown"}`);
  }
  return mapContent(data);
}

export async function updateContentItem(input: {
  workspaceId: string;
  id: string;
  title?: string;
  body?: string;
  contentType?: ContentType;
  status?: ContentStatus;
  scheduledAt?: string | null;
  tags?: string[];
  client?: Client;
}): Promise<ContentItem> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["content_items"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.contentType !== undefined) patch.content_type = input.contentType;
  if (input.status !== undefined) patch.status = input.status;
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.status === "published") patch.published_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("content_items")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update content: ${error?.message ?? "Unknown"}`);
  }
  return mapContent(data);
}

export async function getContentBrandVoice(input: {
  workspaceId: string;
  client?: Client;
}): Promise<ContentBrandVoice | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("content_brand_voices")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load brand voice: ${error.message}`);
  return data ? mapVoice(data) : null;
}

export async function upsertContentBrandVoice(input: {
  workspaceId: string;
  userId: string;
  tone: string;
  writingStyle: string;
  ctaPreferences: string;
  keywords: string[];
  audienceProfile: string;
  client?: Client;
}): Promise<ContentBrandVoice> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("content_brand_voices")
    .upsert(
      {
        workspace_id: input.workspaceId,
        created_by: input.userId,
        tone: input.tone,
        writing_style: input.writingStyle,
        cta_preferences: input.ctaPreferences,
        keywords: input.keywords,
        audience_profile: input.audienceProfile,
      },
      { onConflict: "workspace_id" },
    )
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to save brand voice: ${error?.message ?? "Unknown"}`);
  }
  return mapVoice(data);
}

export async function listContentAssets(input: {
  workspaceId: string;
  limit?: number;
  client?: Client;
}): Promise<ContentAsset[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("content_assets")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (error) throw new Error(`Failed to list content assets: ${error.message}`);
  return (data ?? []).map(mapAsset);
}

export async function listContentTemplates(input: {
  workspaceId: string;
  templateType?: string;
  client?: Client;
}): Promise<ContentTemplate[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("content_templates")
    .select("*")
    .or(`workspace_id.eq.${input.workspaceId},workspace_id.is.null`)
    .order("created_at", { ascending: false });
  if (input.templateType) query = query.eq("template_type", input.templateType);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list content templates: ${error.message}`);
  return (data ?? []).map(mapTemplate);
}

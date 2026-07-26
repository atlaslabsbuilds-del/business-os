import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Json,
  SocialAccount,
  SocialDashboardStats,
  SocialEngagement,
  SocialPlatform,
  SocialPost,
  SocialPostAnalytics,
  SocialPostStatus,
} from "@repo/types";
import { createServerClient } from "./server";

type Client = SupabaseClient<Database>;
type AccountRow = Database["public"]["Tables"]["social_accounts"]["Row"];
type PostRow = Database["public"]["Tables"]["social_posts"]["Row"];
type EngagementRow = Database["public"]["Tables"]["social_engagement"]["Row"];

const clientOrDefault = async (client?: Client) =>
  client ?? (await createServerClient());

function objectValue(value: Json): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function postAnalytics(value: Json): SocialPostAnalytics {
  const data = objectValue(value);
  return {
    followers: Number(data.followers ?? 0),
    reach: Number(data.reach ?? 0),
    impressions: Number(data.impressions ?? 0),
    engagementRate: Number(data.engagementRate ?? 0),
    clicks: Number(data.clicks ?? 0),
  };
}

function mapAccount(row: AccountRow): SocialAccount {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    platform: row.platform as SocialPlatform,
    handle: row.handle,
    displayName: row.display_name,
    status: row.status,
    externalId: row.external_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPost(row: PostRow): SocialPost {
  const media = Array.isArray(row.media) ? row.media : [];
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    sourceContentId: row.source_content_id,
    title: row.title,
    body: row.body,
    media,
    platforms: row.platforms as SocialPlatform[],
    status: row.status,
    approvalStatus: row.approval_status,
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    failureReason: row.failure_reason,
    analytics: postAnalytics(row.analytics),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEngagement(row: EngagementRow): SocialEngagement {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    accountId: row.account_id,
    postId: row.post_id,
    engagementType: row.engagement_type,
    authorName: row.author_name,
    body: row.body,
    status: row.status,
    replySuggestion: row.reply_suggestion,
    createdAt: row.created_at,
  };
}

export async function listSocialAccounts(input: {
  workspaceId: string;
  client?: Client;
}): Promise<SocialAccount[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("platform");
  if (error) throw new Error(`Failed to list social accounts: ${error.message}`);
  return (data ?? []).map(mapAccount);
}

export async function listSocialPosts(input: {
  workspaceId: string;
  status?: SocialPostStatus;
  limit?: number;
  client?: Client;
}): Promise<SocialPost[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("social_posts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 100);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list social posts: ${error.message}`);
  return (data ?? []).map(mapPost);
}

export async function getSocialDashboardStats(input: {
  workspaceId: string;
  client?: Client;
}): Promise<SocialDashboardStats> {
  const [accounts, posts, engagement] = await Promise.all([
    listSocialAccounts({ workspaceId: input.workspaceId, client: input.client }),
    listSocialPosts({ workspaceId: input.workspaceId, limit: 500, client: input.client }),
    listSocialEngagement({ workspaceId: input.workspaceId, status: "open", client: input.client }),
  ]);
  const published = posts.filter((post) => post.status === "published");
  const analytics = published.reduce(
    (result, post) => ({
      followers: result.followers + post.analytics.followers,
      reach: result.reach + post.analytics.reach,
      impressions: result.impressions + post.analytics.impressions,
      engagementRate: result.engagementRate + post.analytics.engagementRate,
      clicks: result.clicks + post.analytics.clicks,
    }),
    { followers: 0, reach: 0, impressions: 0, engagementRate: 0, clicks: 0 },
  );
  return {
    ...analytics,
    engagementRate: published.length
      ? Number((analytics.engagementRate / published.length).toFixed(2))
      : 0,
    accounts: accounts.length,
    connectedAccounts: accounts.filter((account) => account.status === "connected").length,
    totalPosts: posts.length,
    drafts: posts.filter((post) => post.status === "draft").length,
    queued: posts.filter((post) => post.status === "queued").length,
    scheduled: posts.filter((post) => post.status === "scheduled").length,
    published: published.length,
    failed: posts.filter((post) => post.status === "failed").length,
    openEngagement: engagement.length,
  };
}

export async function createSocialPost(input: {
  workspaceId: string;
  userId: string;
  title?: string;
  body?: string;
  platforms: SocialPlatform[];
  status?: SocialPostStatus;
  scheduledAt?: string | null;
  assignedTo?: string | null;
  client?: Client;
}): Promise<SocialPost> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("social_posts")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title ?? "Untitled social post",
      body: input.body ?? "",
      platforms: input.platforms,
      status: input.status ?? "draft",
      scheduled_at: input.scheduledAt ?? null,
      assigned_to: input.assignedTo ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to create social post: ${error?.message ?? "Unknown"}`);
  return mapPost(data);
}

export async function updateSocialPost(input: {
  workspaceId: string;
  id: string;
  title?: string;
  body?: string;
  platforms?: SocialPlatform[];
  status?: SocialPostStatus;
  scheduledAt?: string | null;
  assignedTo?: string | null;
  client?: Client;
}): Promise<SocialPost> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["social_posts"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  if (input.platforms !== undefined) patch.platforms = input.platforms;
  if (input.status !== undefined) patch.status = input.status;
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.status === "published") patch.published_at = new Date().toISOString();
  const { data, error } = await supabase
    .from("social_posts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) throw new Error(`Failed to update social post: ${error?.message ?? "Unknown"}`);
  return mapPost(data);
}

export async function listSocialEngagement(input: {
  workspaceId: string;
  status?: "open" | "replied" | "archived";
  limit?: number;
  client?: Client;
}): Promise<SocialEngagement[]> {
  const supabase = await clientOrDefault(input.client);
  let query = supabase
    .from("social_engagement")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 30);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) throw new Error(`Failed to list social engagement: ${error.message}`);
  return (data ?? []).map(mapEngagement);
}

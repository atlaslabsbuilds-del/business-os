import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  FeedbackCategory,
  FeedbackItem,
  FeedbackPriority,
  FeedbackStatus,
  Json,
} from "@repo/types";
import { ROADMAP_STATUSES } from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";
import { createAdminClient } from "./admin";

type FeedbackRow = Database["public"]["Tables"]["feedback_items"]["Row"];
type Db = SupabaseClient<Database>;

function mapFeedback(
  row: FeedbackRow,
  extras?: Partial<
    Pick<FeedbackItem, "reporterName" | "reporterEmail" | "assigneeName" | "hasVoted">
  >,
): FeedbackItem {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    category: row.category as FeedbackCategory,
    priority: row.priority as FeedbackPriority,
    status: row.status as FeedbackStatus,
    screenshotPath: row.screenshot_path,
    assigneeId: row.assignee_id,
    voteCount: row.vote_count,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reporterName: extras?.reporterName ?? null,
    reporterEmail: extras?.reporterEmail ?? null,
    assigneeName: extras?.assigneeName ?? null,
    hasVoted: extras?.hasVoted ?? false,
  };
}

async function attachProfiles(
  items: FeedbackItem[],
  client: Db,
): Promise<FeedbackItem[]> {
  if (items.length === 0) return items;
  const ids = Array.from(
    new Set(
      items
        .flatMap((item) => [item.createdBy, item.assigneeId])
        .filter((id): id is string => Boolean(id)),
    ),
  );
  if (ids.length === 0) return items;

  const { data } = await client
    .from("profiles")
    .select("id, email, full_name")
    .in("id", ids);

  const map = new Map((data ?? []).map((row) => [row.id, row]));
  return items.map((item) => {
    const reporter = map.get(item.createdBy);
    const assignee = item.assigneeId ? map.get(item.assigneeId) : null;
    return {
      ...item,
      reporterName: reporter?.full_name ?? null,
      reporterEmail: reporter?.email ?? null,
      assigneeName: assignee?.full_name ?? assignee?.email ?? null,
    };
  });
}

async function attachVotes(
  items: FeedbackItem[],
  userId: string | null | undefined,
  client: Db,
): Promise<FeedbackItem[]> {
  if (!userId || items.length === 0) return items;
  const { data } = await client
    .from("feedback_votes")
    .select("feedback_id")
    .eq("user_id", userId)
    .in(
      "feedback_id",
      items.map((item) => item.id),
    );
  const voted = new Set((data ?? []).map((row) => row.feedback_id));
  return items.map((item) => ({ ...item, hasVoted: voted.has(item.id) }));
}

export async function listFeedbackItems(input: {
  workspaceId: string;
  userId?: string;
  query?: string;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  mineOnly?: boolean;
  limit?: number;
  client?: Db;
}): Promise<FeedbackItem[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("feedback_items")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 50);

  if (input.category) builder = builder.eq("category", input.category);
  if (input.status) builder = builder.eq("status", input.status);
  if (input.priority) builder = builder.eq("priority", input.priority);
  if (input.mineOnly && input.userId) {
    builder = builder.eq("created_by", input.userId);
  }
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    builder = builder.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list feedback: ${error.message}`);

  let items = (data ?? []).map((row) => mapFeedback(row));
  items = await attachProfiles(items, supabase);
  items = await attachVotes(items, input.userId, supabase);
  return items;
}

export async function listAllFeedbackForAdmin(input: {
  query?: string;
  category?: FeedbackCategory;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  limit?: number;
}): Promise<FeedbackItem[]> {
  const supabase = createAdminClient();
  let builder = supabase
    .from("feedback_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (input.category) builder = builder.eq("category", input.category);
  if (input.status) builder = builder.eq("status", input.status);
  if (input.priority) builder = builder.eq("priority", input.priority);
  if (input.query?.trim()) {
    const term = input.query.trim().replace(/[%_]/g, "");
    builder = builder.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list admin feedback: ${error.message}`);

  let items = (data ?? []).map((row) => mapFeedback(row));
  items = await attachProfiles(items, supabase);
  return items;
}

export async function listRoadmapFeedback(input?: {
  userId?: string | null;
  limit?: number;
}): Promise<FeedbackItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("category", "feature_request")
    .in("status", [...ROADMAP_STATUSES])
    .order("vote_count", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(input?.limit ?? 60);

  if (error) throw new Error(`Failed to list roadmap: ${error.message}`);

  let items = (data ?? []).map((row) => mapFeedback(row));
  items = await attachProfiles(items, supabase);

  if (input?.userId) {
    const userClient = await clientOrDefault();
    items = await attachVotes(items, input.userId, userClient);
  }
  return items;
}

export async function getFeedbackItem(input: {
  workspaceId: string;
  feedbackId: string;
  client?: Db;
}): Promise<FeedbackItem | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.feedbackId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load feedback: ${error.message}`);
  if (!data) return null;
  const [item] = await attachProfiles([mapFeedback(data)], supabase);
  return item ?? null;
}

export async function createFeedbackItem(input: {
  workspaceId: string;
  userId: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  priority?: FeedbackPriority;
  screenshotPath?: string | null;
  client?: Db;
}): Promise<FeedbackItem> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("feedback_items")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority ?? "normal",
      status: "submitted",
      screenshot_path: input.screenshotPath ?? null,
      metadata: {} as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create feedback: ${error?.message ?? "Unknown"}`);
  }
  return mapFeedback(data);
}

export async function updateFeedbackItem(input: {
  feedbackId: string;
  workspaceId?: string;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  assigneeId?: string | null;
  client?: Db;
  useAdmin?: boolean;
}): Promise<FeedbackItem> {
  const supabase = input.useAdmin
    ? createAdminClient()
    : await clientOrDefault(input.client);

  const patch: Database["public"]["Tables"]["feedback_items"]["Update"] = {};
  if (input.status !== undefined) patch.status = input.status;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.assigneeId !== undefined) patch.assignee_id = input.assigneeId;

  let builder = supabase
    .from("feedback_items")
    .update(patch)
    .eq("id", input.feedbackId);
  if (input.workspaceId) {
    builder = builder.eq("workspace_id", input.workspaceId);
  }

  const { data, error } = await builder.select("*").single();
  if (error || !data) {
    throw new Error(`Failed to update feedback: ${error?.message ?? "Unknown"}`);
  }
  const [item] = await attachProfiles([mapFeedback(data)], supabase);
  return item!;
}

export async function voteOnFeedback(input: {
  feedbackId: string;
  userId: string;
  client?: Db;
}): Promise<{ voted: boolean; voteCount: number }> {
  const supabase = await clientOrDefault(input.client);
  const existing = await supabase
    .from("feedback_votes")
    .select("id")
    .eq("feedback_id", input.feedbackId)
    .eq("user_id", input.userId)
    .maybeSingle();

  if (existing.data) {
    const { error } = await supabase
      .from("feedback_votes")
      .delete()
      .eq("id", existing.data.id);
    if (error) throw new Error(`Failed to remove vote: ${error.message}`);
  } else {
    const { error } = await supabase.from("feedback_votes").insert({
      feedback_id: input.feedbackId,
      user_id: input.userId,
    });
    if (error) throw new Error(`Failed to cast vote: ${error.message}`);
  }

  const { data } = await supabase
    .from("feedback_items")
    .select("vote_count")
    .eq("id", input.feedbackId)
    .single();

  return {
    voted: !existing.data,
    voteCount: data?.vote_count ?? 0,
  };
}

export async function getFeedbackStats(input: {
  workspaceId: string;
  userId?: string;
  client?: Db;
}): Promise<Record<FeedbackStatus, number>> {
  const items = await listFeedbackItems({
    workspaceId: input.workspaceId,
    userId: input.userId,
    mineOnly: Boolean(input.userId),
    limit: 200,
    client: input.client,
  });
  const counts: Record<FeedbackStatus, number> = {
    submitted: 0,
    in_review: 0,
    planned: 0,
    in_progress: 0,
    completed: 0,
    rejected: 0,
  };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

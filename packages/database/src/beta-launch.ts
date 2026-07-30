import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BetaAnalyticsEvent,
  BetaReleaseNote,
  Database,
  Json,
  WorkspaceBetaLaunchProfile,
  WorkspaceTemplateKey,
} from "@repo/types";
import { clientOrDefault, jsonToRecord } from "./platform-helpers";
import { createContact, createDeal } from "./crm";
import { createProject, createProjectTask } from "./projects";
import { createDocument } from "./documents";
import {
  createFinanceExpense,
  createFinanceInvoice,
  updateFinanceInvoiceStatus,
} from "./finance";
import { createCalendarEvent } from "./calendar-module";
import { createWorkspaceActivityEvent } from "./activity";
import { emitWorkspaceNotification } from "./notifications";

type Client = SupabaseClient<Database>;
type ProfileRow =
  Database["public"]["Tables"]["workspace_beta_launch_profiles"]["Row"];
type EventRow = Database["public"]["Tables"]["beta_analytics_events"]["Row"];
type ReleaseRow = Database["public"]["Tables"]["beta_release_notes"]["Row"];

function mapProfile(row: ProfileRow): WorkspaceBetaLaunchProfile {
  return {
    workspaceId: row.workspace_id,
    templateKey: row.template_key,
    launchStage: row.launch_stage,
    demoDataSeededAt: row.demo_data_seeded_at,
    checklist: jsonToRecord(row.checklist),
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: EventRow): BetaAnalyticsEvent {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    eventName: row.event_name,
    eventCategory: row.event_category,
    source: row.source,
    path: row.path,
    metadata: jsonToRecord(row.metadata),
    createdAt: row.created_at,
  };
}

function mapRelease(row: ReleaseRow): BetaReleaseNote {
  return {
    id: row.id,
    version: row.version,
    title: row.title,
    summary: row.summary,
    highlights: row.highlights ?? [],
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

export async function getWorkspaceBetaLaunchProfile(input: {
  workspaceId: string;
  client?: Client;
}): Promise<WorkspaceBetaLaunchProfile> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("workspace_beta_launch_profiles")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load beta profile: ${error.message}`);
  }

  if (data) return mapProfile(data);

  const { data: created, error: createError } = await supabase
    .from("workspace_beta_launch_profiles")
    .insert({ workspace_id: input.workspaceId })
    .select("*")
    .single();

  if (createError || !created) {
    throw new Error(
      `Failed to create beta profile: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapProfile(created);
}

export async function upsertWorkspaceBetaLaunchProfile(input: {
  workspaceId: string;
  templateKey?: WorkspaceTemplateKey | string;
  launchStage?: string;
  demoDataSeededAt?: string | null;
  checklist?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  client?: Client;
}): Promise<WorkspaceBetaLaunchProfile> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["workspace_beta_launch_profiles"]["Insert"] =
    {
      workspace_id: input.workspaceId,
    };
  if (input.templateKey !== undefined) patch.template_key = input.templateKey;
  if (input.launchStage !== undefined) patch.launch_stage = input.launchStage;
  if (input.demoDataSeededAt !== undefined) {
    patch.demo_data_seeded_at = input.demoDataSeededAt;
  }
  if (input.checklist !== undefined) patch.checklist = input.checklist as Json;
  if (input.metadata !== undefined) patch.metadata = input.metadata as Json;

  const { data, error } = await supabase
    .from("workspace_beta_launch_profiles")
    .upsert(patch, { onConflict: "workspace_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to save beta profile: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapProfile(data);
}

export async function trackBetaAnalyticsEvent(input: {
  workspaceId?: string | null;
  userId?: string | null;
  eventName: string;
  eventCategory?: string;
  source?: string;
  path?: string | null;
  metadata?: Record<string, unknown>;
  client?: Client;
}): Promise<BetaAnalyticsEvent> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("beta_analytics_events")
    .insert({
      workspace_id: input.workspaceId ?? null,
      user_id: input.userId ?? null,
      event_name: input.eventName,
      event_category: input.eventCategory ?? "feature_usage",
      source: input.source ?? "web",
      path: input.path ?? null,
      metadata: (input.metadata ?? {}) as Json,
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to track beta event: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapEvent(data);
}

export async function listBetaAnalyticsEvents(input: {
  workspaceId: string;
  limit?: number;
  client?: Client;
}): Promise<BetaAnalyticsEvent[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("beta_analytics_events")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (error) throw new Error(`Failed to list beta events: ${error.message}`);
  return (data ?? []).map(mapEvent);
}

export async function listBetaReleaseNotes(input?: {
  limit?: number;
  client?: Client;
}): Promise<BetaReleaseNote[]> {
  const supabase = await clientOrDefault(input?.client);
  const { data, error } = await supabase
    .from("beta_release_notes")
    .select("*")
    .order("published_at", { ascending: false })
    .limit(input?.limit ?? 20);
  if (error) throw new Error(`Failed to list release notes: ${error.message}`);
  return (data ?? []).map(mapRelease);
}

export async function getBetaLaunchReadiness(input: {
  workspaceId: string;
  client?: Client;
}) {
  const [profile, events] = await Promise.all([
    getWorkspaceBetaLaunchProfile(input),
    listBetaAnalyticsEvents({
      workspaceId: input.workspaceId,
      limit: 200,
      client: input.client,
    }).catch(() => []),
  ]);
  const categories = new Set(events.map((event) => event.eventCategory));
  const activated = categories.has("activation");
  const aiUsed = categories.has("ai_usage");
  const featureUsed = categories.has("feature_usage");
  const score = Math.min(
    100,
    25 +
      (profile.templateKey !== "blank" ? 15 : 0) +
      (profile.demoDataSeededAt ? 20 : 0) +
      (activated ? 15 : 0) +
      (featureUsed ? 15 : 0) +
      (aiUsed ? 10 : 0),
  );
  return { profile, events: events.slice(0, 20), score };
}

export async function seedDemoWorkspace(input: {
  workspaceId: string;
  userId: string;
  templateKey?: WorkspaceTemplateKey | string;
  client?: Client;
}) {
  const templateKey = input.templateKey ?? "startup";
  const profile = await getWorkspaceBetaLaunchProfile({
    workspaceId: input.workspaceId,
    client: input.client,
  });
  if (profile.demoDataSeededAt) {
    return { seeded: false, profile };
  }

  const contact = await createContact({
    workspaceId: input.workspaceId,
    userId: input.userId,
    firstName: "Maya",
    lastName: "Chen",
    email: "maya.chen@example.com",
    title: "VP Operations",
    lifecycleStage: "qualified",
    source: "Public beta demo",
    priority: "high",
    client: input.client,
  });
  const deal = await createDeal({
    workspaceId: input.workspaceId,
    userId: input.userId,
    title: "Acme beta rollout",
    amount: 42000,
    stage: "proposal",
    probability: 65,
    expectedCloseDate: nextIsoDate(21),
    contactId: contact.id,
    products: ["VanderBase Pro", "Kairos onboarding"],
    notes: "Demo opportunity created for public beta exploration.",
    client: input.client,
  });
  const project = await createProject({
    workspaceId: input.workspaceId,
    userId: input.userId,
    name: `${titleCase(templateKey)} launch workspace`,
    description: "Demo project showing tasks, milestones, and delivery reports.",
    status: "active",
    priority: "high",
    dueDate: nextIsoDate(30),
    tags: ["demo", "beta"],
    client: input.client,
  });
  await Promise.all([
    createProjectTask({
      workspaceId: input.workspaceId,
      userId: input.userId,
      projectId: project.id,
      title: "Invite launch team",
      status: "todo",
      priority: "high",
      dueAt: nextIsoDate(3),
      labels: ["onboarding"],
      client: input.client,
    }),
    createProjectTask({
      workspaceId: input.workspaceId,
      userId: input.userId,
      projectId: project.id,
      title: "Review Kairos daily briefing",
      status: "in_progress",
      priority: "medium",
      dueAt: nextIsoDate(5),
      labels: ["ai"],
      client: input.client,
    }),
  ]);
  await createDocument({
    workspaceId: input.workspaceId,
    userId: input.userId,
    title: "Public beta operating plan",
    content:
      "# Public beta operating plan\n\nUse this document to align launch goals, customer feedback loops, weekly metrics, and Kairos prompts.",
    tags: ["demo", "launch"],
    isKnowledge: true,
    knowledgeCategory: "operations",
    status: "published",
    client: input.client,
  });
  const invoice = await createFinanceInvoice({
    workspaceId: input.workspaceId,
    userId: input.userId,
    invoiceNumber: `VB-DEMO-${Date.now().toString().slice(-5)}`,
    customerName: "Acme Beta Co.",
    items: [
      {
        description: "Beta onboarding package",
        quantity: 1,
        unitPrice: 4200,
        amount: 4200,
      },
    ],
    tax: 0,
    dueDate: nextIsoDate(14),
    notes: "Sample invoice for finance dashboard previews.",
    client: input.client,
  });
  await updateFinanceInvoiceStatus({
    workspaceId: input.workspaceId,
    id: invoice.id,
    status: "sent",
    client: input.client,
  });
  await createFinanceExpense({
    workspaceId: input.workspaceId,
    userId: input.userId,
    category: "Software",
    vendor: "Launch tooling",
    amount: 320,
    expenseDate: new Date().toISOString().slice(0, 10),
    notes: "Sample demo expense.",
    client: input.client,
  });
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 45);
  await createCalendarEvent({
    workspaceId: input.workspaceId,
    userId: input.userId,
    title: "Beta launch standup",
    description: "Review activation, feedback, support, and Kairos usage.",
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
    priority: "high",
    category: "launch",
    client: input.client,
  });
  await Promise.all([
    createWorkspaceActivityEvent({
      workspaceId: input.workspaceId,
      userId: input.userId,
      module: "workspace",
      eventType: "demo_seeded",
      title: "Demo workspace generated",
      body: "Sample CRM, project, finance, calendar, and document data are ready.",
      actionUrl: "/dashboard",
      metadata: { templateKey, contactId: contact.id, dealId: deal.id, projectId: project.id },
      client: input.client,
    }),
    emitWorkspaceNotification({
      workspaceId: input.workspaceId,
      module: "workspace",
      category: "ai_recommendation",
      title: "Demo workspace is ready",
      body: "Explore sample CRM, projects, finance, calendar, and documents.",
      actionUrl: "/dashboard",
      userId: input.userId,
      recipientUserId: input.userId,
      priority: "normal",
      client: input.client,
    }),
    trackBetaAnalyticsEvent({
      workspaceId: input.workspaceId,
      userId: input.userId,
      eventName: "demo_workspace_seeded",
      eventCategory: "activation",
      metadata: { templateKey },
      client: input.client,
    }),
  ]);

  const updatedProfile = await upsertWorkspaceBetaLaunchProfile({
    workspaceId: input.workspaceId,
    templateKey,
    launchStage: "activated",
    demoDataSeededAt: new Date().toISOString(),
    metadata: { seededModules: ["crm", "projects", "documents", "finance", "calendar"] },
    client: input.client,
  });
  return { seeded: true, profile: updatedProfile };
}

function nextIsoDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function titleCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

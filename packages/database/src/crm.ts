import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CrmActivity,
  CrmActivityType,
  CrmCompany,
  CrmContact,
  CrmDashboardStats,
  CrmDeal,
  CrmDealStage,
  CrmEntityType,
  CrmLifecycleStage,
  CrmNote,
  CrmPipeline,
  CrmPipelineStage,
  CrmPriority,
  CrmReportSnapshot,
  CrmSettings,
  CrmTag,
  CrmTask,
  CrmTaskStatus,
  CrmTimelineItem,
  Database,
  Json,
} from "@repo/types";
import { createServerClient } from "./server";

type CompanyRow = Database["public"]["Tables"]["crm_companies"]["Row"];
type ContactRow = Database["public"]["Tables"]["crm_contacts"]["Row"];
type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];
type ActivityRow = Database["public"]["Tables"]["crm_activities"]["Row"];
type NoteRow = Database["public"]["Tables"]["crm_notes"]["Row"];
type TagRow = Database["public"]["Tables"]["crm_tags"]["Row"];
type TaskRow = Database["public"]["Tables"]["crm_tasks"]["Row"];
type PipelineRow = Database["public"]["Tables"]["crm_pipelines"]["Row"];
type PipelineStageRow = Database["public"]["Tables"]["crm_pipeline_stages"]["Row"];
type SettingsRow = Database["public"]["Tables"]["crm_settings"]["Row"];

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object" && !Array.isArray(item),
  );
}

function asPriority(value: string | null | undefined): CrmPriority {
  if (value === "low" || value === "high" || value === "urgent") return value;
  return "medium";
}

function asTaskStatus(value: string | null | undefined): CrmTaskStatus {
  if (
    value === "in_progress" ||
    value === "done" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "open";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function mapCompany(row: CompanyRow): CrmCompany {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    domain: row.domain,
    industry: row.industry,
    website: row.website,
    phone: row.phone,
    description: row.description,
    employeeCount: row.employee_count,
    annualRevenue:
      row.annual_revenue === null || row.annual_revenue === undefined
        ? null
        : Number(row.annual_revenue),
    ownerId: row.owner_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapContact(row: ContactRow): CrmContact {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    title: row.title,
    lifecycleStage: row.lifecycle_stage,
    source: row.source,
    priority: asPriority(row.priority),
    ownerId: row.owner_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDeal(row: DealRow): CrmDeal {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    companyId: row.company_id,
    contactId: row.contact_id,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency,
    stage: row.stage,
    probability: row.probability,
    expectedCloseDate: row.expected_close_date,
    products: asStringArray(row.products),
    notes: row.notes,
    ownerId: row.owner_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: ActivityRow): CrmActivity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    type: row.type,
    subject: row.subject,
    body: row.body,
    dueAt: row.due_at,
    completedAt: row.completed_at,
    contactId: row.contact_id,
    companyId: row.company_id,
    dealId: row.deal_id,
    ownerId: row.owner_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapNote(row: NoteRow): CrmNote {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    body: row.body,
    contactId: row.contact_id,
    companyId: row.company_id,
    dealId: row.deal_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTag(row: TagRow): CrmTag {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    color: row.color,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTask(row: TaskRow): CrmTask {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    status: asTaskStatus(row.status),
    priority: asPriority(row.priority),
    dueAt: row.due_at,
    reminderAt: row.reminder_at,
    assigneeId: row.assignee_id,
    contactId: row.contact_id,
    companyId: row.company_id,
    dealId: row.deal_id,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPipeline(row: PipelineRow): CrmPipeline {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    createdBy: row.created_by,
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPipelineStage(row: PipelineStageRow): CrmPipelineStage {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    pipelineId: row.pipeline_id,
    name: row.name,
    slug: row.slug,
    position: row.position,
    probability: row.probability,
    isWon: row.is_won,
    isLost: row.is_lost,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSettings(row: SettingsRow): CrmSettings {
  return {
    workspaceId: row.workspace_id,
    leadSources: asStringArray(row.lead_sources),
    customFields: asRecordArray(row.custom_fields),
    automationRules: asRecordArray(row.automation_rules),
    defaultPipelineId: row.default_pipeline_id,
    permissions:
      row.permissions && typeof row.permissions === "object" && !Array.isArray(row.permissions)
        ? (row.permissions as Record<string, unknown>)
        : { canExport: true, canImport: true },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function clientOrDefault(client?: SupabaseClient<Database>) {
  return client ?? (await createServerClient());
}

// ── Companies ──────────────────────────────────────────────

export async function listCompanies(input: {
  workspaceId: string;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmCompany[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_companies")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });

  if (input.query) {
    builder = builder.or(
      `name.ilike.%${input.query}%,domain.ilike.%${input.query}%`,
    );
  }

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list companies: ${error.message}`);
  return (data ?? []).map(mapCompany);
}

export async function getCompany(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmCompany | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_companies")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load company: ${error.message}`);
  return data ? mapCompany(data) : null;
}

export async function createCompany(input: {
  workspaceId: string;
  userId: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  employeeCount?: number | null;
  annualRevenue?: number | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmCompany> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_companies")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      name: input.name,
      domain: input.domain ?? null,
      industry: input.industry ?? null,
      website: input.website ?? null,
      phone: input.phone ?? null,
      description: input.description ?? null,
      employee_count: input.employeeCount ?? null,
      annual_revenue: input.annualRevenue ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create company: ${error?.message ?? "Unknown"}`);
  }
  return mapCompany(data);
}

export async function updateCompany(input: {
  workspaceId: string;
  id: string;
  name?: string;
  domain?: string | null;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  employeeCount?: number | null;
  annualRevenue?: number | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmCompany> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["crm_companies"]["Update"] = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.domain !== undefined) patch.domain = input.domain;
  if (input.industry !== undefined) patch.industry = input.industry;
  if (input.website !== undefined) patch.website = input.website;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.description !== undefined) patch.description = input.description;
  if (input.employeeCount !== undefined) patch.employee_count = input.employeeCount;
  if (input.annualRevenue !== undefined) patch.annual_revenue = input.annualRevenue;

  const { data, error } = await supabase
    .from("crm_companies")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update company: ${error?.message ?? "Unknown"}`);
  }
  return mapCompany(data);
}

export async function deleteCompany(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_companies")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete company: ${error.message}`);
}

export async function searchCompanies(input: {
  workspaceId: string;
  query: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<CrmCompany[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_companies")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .or(`name.ilike.%${input.query}%,domain.ilike.%${input.query}%`)
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 20);
  if (error) throw new Error(`Failed to search companies: ${error.message}`);
  return (data ?? []).map(mapCompany);
}

// ── Contacts / Leads ───────────────────────────────────────

export async function listContacts(input: {
  workspaceId: string;
  query?: string;
  stage?: CrmLifecycleStage;
  companyId?: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_contacts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });

  if (input.stage) builder = builder.eq("lifecycle_stage", input.stage);
  if (input.companyId) builder = builder.eq("company_id", input.companyId);
  if (input.query) {
    builder = builder.or(
      `first_name.ilike.%${input.query}%,last_name.ilike.%${input.query}%,email.ilike.%${input.query}%`,
    );
  }
  if (input.limit !== undefined) {
    builder = builder.limit(input.limit);
  }

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list contacts: ${error.message}`);
  return (data ?? []).map(mapContact);
}

export async function listLeads(input: {
  workspaceId: string;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact[]> {
  return listContacts({
    workspaceId: input.workspaceId,
    query: input.query,
    stage: "lead",
    client: input.client,
  });
}

export async function getContact(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact | null> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load contact: ${error.message}`);
  return data ? mapContact(data) : null;
}

export async function createContact(input: {
  workspaceId: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  lifecycleStage?: CrmLifecycleStage;
  source?: string | null;
  priority?: CrmPriority;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact> {
  const supabase = await clientOrDefault(input.client);
  const email =
    input.email === "" || input.email === undefined ? null : input.email;
  const { data, error } = await supabase
    .from("crm_contacts")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      first_name: input.firstName,
      last_name: input.lastName ?? "",
      email,
      phone: input.phone ?? null,
      title: input.title ?? null,
      company_id: input.companyId ?? null,
      lifecycle_stage: input.lifecycleStage ?? "lead",
      source: input.source ?? null,
      priority: input.priority ?? "medium",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create contact: ${error?.message ?? "Unknown"}`);
  }
  return mapContact(data);
}

export async function createLead(input: {
  workspaceId: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  source?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact> {
  return createContact({
    ...input,
    lifecycleStage: "lead",
  });
}

export async function updateContact(input: {
  workspaceId: string;
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  companyId?: string | null;
  lifecycleStage?: CrmLifecycleStage;
  source?: string | null;
  priority?: CrmPriority;
  client?: SupabaseClient<Database>;
}): Promise<CrmContact> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["crm_contacts"]["Update"] = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.email !== undefined) {
    patch.email = input.email === "" ? null : input.email;
  }
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.title !== undefined) patch.title = input.title;
  if (input.companyId !== undefined) patch.company_id = input.companyId;
  if (input.lifecycleStage !== undefined) {
    patch.lifecycle_stage = input.lifecycleStage;
  }
  if (input.source !== undefined) patch.source = input.source;
  if (input.priority !== undefined) patch.priority = input.priority;

  const { data, error } = await supabase
    .from("crm_contacts")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update contact: ${error?.message ?? "Unknown"}`);
  }
  return mapContact(data);
}

export async function deleteContact(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_contacts")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete contact: ${error.message}`);
}

// ── Deals ──────────────────────────────────────────────────

export async function listDeals(input: {
  workspaceId: string;
  query?: string;
  stage?: CrmDealStage;
  client?: SupabaseClient<Database>;
}): Promise<CrmDeal[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_deals")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("updated_at", { ascending: false });

  if (input.stage) builder = builder.eq("stage", input.stage);
  if (input.query) builder = builder.ilike("title", `%${input.query}%`);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list deals: ${error.message}`);
  return (data ?? []).map(mapDeal);
}

export async function createDeal(input: {
  workspaceId: string;
  userId: string;
  title: string;
  amount?: number;
  currency?: string;
  stage?: CrmDealStage;
  probability?: number;
  expectedCloseDate?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  products?: string[];
  notes?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmDeal> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_deals")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      title: input.title,
      amount: input.amount ?? 0,
      currency: input.currency ?? "USD",
      stage: input.stage ?? "qualified",
      probability: input.probability ?? 10,
      expected_close_date: input.expectedCloseDate ?? null,
      company_id: input.companyId ?? null,
      contact_id: input.contactId ?? null,
      products: (input.products ?? []) as Json,
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create deal: ${error?.message ?? "Unknown"}`);
  }
  return mapDeal(data);
}

export async function updateDeal(input: {
  workspaceId: string;
  id: string;
  title?: string;
  amount?: number;
  currency?: string;
  stage?: CrmDealStage;
  probability?: number;
  expectedCloseDate?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  products?: string[];
  notes?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmDeal> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["crm_deals"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.amount !== undefined) patch.amount = input.amount;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.stage !== undefined) patch.stage = input.stage;
  if (input.probability !== undefined) patch.probability = input.probability;
  if (input.expectedCloseDate !== undefined) {
    patch.expected_close_date = input.expectedCloseDate;
  }
  if (input.companyId !== undefined) patch.company_id = input.companyId;
  if (input.contactId !== undefined) patch.contact_id = input.contactId;
  if (input.products !== undefined) patch.products = input.products as Json;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from("crm_deals")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update deal: ${error?.message ?? "Unknown"}`);
  }
  return mapDeal(data);
}

export async function deleteDeal(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_deals")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete deal: ${error.message}`);
}

// ── Activities ─────────────────────────────────────────────

export async function listActivities(input: {
  workspaceId: string;
  query?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmActivity[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_activities")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });

  if (input.contactId) builder = builder.eq("contact_id", input.contactId);
  if (input.companyId) builder = builder.eq("company_id", input.companyId);
  if (input.dealId) builder = builder.eq("deal_id", input.dealId);
  if (input.query) builder = builder.ilike("subject", `%${input.query}%`);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list activities: ${error.message}`);
  return (data ?? []).map(mapActivity);
}

export async function createActivity(input: {
  workspaceId: string;
  userId: string;
  type?: CrmActivityType;
  subject: string;
  body?: string | null;
  dueAt?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmActivity> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      owner_id: input.userId,
      type: input.type ?? "task",
      subject: input.subject,
      body: input.body ?? null,
      due_at: input.dueAt ?? null,
      contact_id: input.contactId ?? null,
      company_id: input.companyId ?? null,
      deal_id: input.dealId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create activity: ${error?.message ?? "Unknown"}`);
  }
  return mapActivity(data);
}

export async function updateActivity(input: {
  workspaceId: string;
  id: string;
  type?: CrmActivityType;
  subject?: string;
  body?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmActivity> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["crm_activities"]["Update"] = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.body !== undefined) patch.body = input.body;
  if (input.dueAt !== undefined) patch.due_at = input.dueAt;
  if (input.completedAt !== undefined) patch.completed_at = input.completedAt;

  const { data, error } = await supabase
    .from("crm_activities")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update activity: ${error?.message ?? "Unknown"}`);
  }
  return mapActivity(data);
}

export async function deleteActivity(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_activities")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete activity: ${error.message}`);
}

// ── Notes ──────────────────────────────────────────────────

export async function listNotes(input: {
  workspaceId: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmNote[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_notes")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: false });

  if (input.contactId) builder = builder.eq("contact_id", input.contactId);
  if (input.companyId) builder = builder.eq("company_id", input.companyId);
  if (input.dealId) builder = builder.eq("deal_id", input.dealId);

  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list notes: ${error.message}`);
  return (data ?? []).map(mapNote);
}

export async function createNote(input: {
  workspaceId: string;
  userId: string;
  body: string;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmNote> {
  if (!input.contactId && !input.companyId && !input.dealId) {
    throw new Error("Note requires a contact, company, or deal");
  }
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_notes")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      body: input.body,
      contact_id: input.contactId ?? null,
      company_id: input.companyId ?? null,
      deal_id: input.dealId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create note: ${error?.message ?? "Unknown"}`);
  }
  return mapNote(data);
}

export async function deleteNote(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_notes")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete note: ${error.message}`);
}

// ── Tags ───────────────────────────────────────────────────

export async function listTags(input: {
  workspaceId: string;
  query?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmTag[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_tags")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("name", { ascending: true });
  if (input.query) builder = builder.ilike("name", `%${input.query}%`);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list tags: ${error.message}`);
  return (data ?? []).map(mapTag);
}

export async function createTag(input: {
  workspaceId: string;
  userId: string;
  name: string;
  color?: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmTag> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_tags")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name,
      color: input.color ?? "#F97316",
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create tag: ${error?.message ?? "Unknown"}`);
  }
  return mapTag(data);
}

export async function deleteTag(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_tags")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete tag: ${error.message}`);
}

export async function assignTag(input: {
  workspaceId: string;
  tagId: string;
  entityType: CrmEntityType;
  entityId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase.from("crm_taggings").upsert(
    {
      workspace_id: input.workspaceId,
      tag_id: input.tagId,
      entity_type: input.entityType,
      entity_id: input.entityId,
    },
    { onConflict: "tag_id,entity_type,entity_id" },
  );
  if (error) throw new Error(`Failed to assign tag: ${error.message}`);
}

export async function unassignTag(input: {
  workspaceId: string;
  tagId: string;
  entityType: CrmEntityType;
  entityId: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_taggings")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("tag_id", input.tagId)
    .eq("entity_type", input.entityType)
    .eq("entity_id", input.entityId);
  if (error) throw new Error(`Failed to unassign tag: ${error.message}`);
}

// ── Dashboard / Timeline ───────────────────────────────────

export async function getCrmDashboardStats(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmDashboardStats> {
  const [contacts, companies, leads, deals, activities] = await Promise.all([
    listContacts({ workspaceId: input.workspaceId, client: input.client }),
    listCompanies({ workspaceId: input.workspaceId, client: input.client }),
    listLeads({ workspaceId: input.workspaceId, client: input.client }),
    listDeals({ workspaceId: input.workspaceId, client: input.client }),
    listActivities({ workspaceId: input.workspaceId, client: input.client }),
  ]);

  const qualifiedLeads = contacts.filter(
    (contact) => contact.lifecycleStage === "qualified",
  ).length;
  const openDeals = deals.filter(
    (deal) => deal.stage !== "won" && deal.stage !== "lost",
  );
  const wonDeals = deals.filter((deal) => deal.stage === "won");
  const lostDeals = deals.filter((deal) => deal.stage === "lost");
  const closed = wonDeals.length + lostDeals.length;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const salesThisMonth = wonDeals
    .filter((deal) => Date.parse(deal.updatedAt) >= monthStart.getTime())
    .reduce((sum, deal) => sum + deal.amount, 0);

  return {
    contacts: contacts.length,
    companies: companies.length,
    leads: leads.length,
    qualifiedLeads,
    openDeals: openDeals.length,
    wonDeals: wonDeals.length,
    lostDeals: lostDeals.length,
    pipelineValue: openDeals.reduce((sum, deal) => sum + deal.amount, 0),
    conversionRate: closed === 0 ? 0 : Math.round((wonDeals.length / closed) * 100),
    salesThisMonth,
    activities: activities.length,
  };
}

export async function getCustomerTimeline(input: {
  workspaceId: string;
  contactId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmTimelineItem[]> {
  const [activities, notes, deals] = await Promise.all([
    listActivities({
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      client: input.client,
    }),
    listNotes({
      workspaceId: input.workspaceId,
      contactId: input.contactId,
      client: input.client,
    }),
    listDeals({ workspaceId: input.workspaceId, client: input.client }),
  ]);

  const contactDeals = deals.filter((deal) => deal.contactId === input.contactId);
  const items: CrmTimelineItem[] = [
    ...activities.map((item) => ({ kind: "activity" as const, item })),
    ...notes.map((item) => ({ kind: "note" as const, item })),
    ...contactDeals.map((item) => ({ kind: "deal" as const, item })),
  ];

  return items.sort((a, b) => {
    const aAt = Date.parse(a.item.createdAt);
    const bAt = Date.parse(b.item.createdAt);
    return bAt - aAt;
  });
}

export function contactDisplayName(contact: CrmContact): string {
  return [contact.firstName, contact.lastName].filter(Boolean).join(" ").trim();
}

const DEFAULT_PIPELINE_STAGES: Array<{
  name: string;
  slug: CrmDealStage;
  position: number;
  probability: number;
  isWon?: boolean;
  isLost?: boolean;
  color: string;
}> = [
  { name: "Lead", slug: "lead", position: 0, probability: 10, color: "#94a3b8" },
  { name: "Qualified", slug: "qualified", position: 1, probability: 25, color: "#38bdf8" },
  { name: "Proposal", slug: "proposal", position: 2, probability: 50, color: "#a78bfa" },
  { name: "Negotiation", slug: "negotiation", position: 3, probability: 75, color: "#f97316" },
  { name: "Won", slug: "won", position: 4, probability: 100, isWon: true, color: "#22c55e" },
  { name: "Lost", slug: "lost", position: 5, probability: 0, isLost: true, color: "#ef4444" },
];

export async function listCrmTasks(input: {
  workspaceId: string;
  status?: CrmTaskStatus;
  client?: SupabaseClient<Database>;
}): Promise<CrmTask[]> {
  const supabase = await clientOrDefault(input.client);
  let builder = supabase
    .from("crm_tasks")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("due_at", { ascending: true })
    .order("updated_at", { ascending: false });
  if (input.status) builder = builder.eq("status", input.status);
  const { data, error } = await builder;
  if (error) throw new Error(`Failed to list CRM tasks: ${error.message}`);
  return (data ?? []).map(mapTask);
}

export async function createCrmTask(input: {
  workspaceId: string;
  userId: string;
  title: string;
  description?: string | null;
  status?: CrmTaskStatus;
  priority?: CrmPriority;
  dueAt?: string | null;
  reminderAt?: string | null;
  assigneeId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmTask> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_tasks")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? "open",
      priority: input.priority ?? "medium",
      due_at: input.dueAt ?? null,
      reminder_at: input.reminderAt ?? null,
      assignee_id: input.assigneeId ?? input.userId,
      contact_id: input.contactId ?? null,
      company_id: input.companyId ?? null,
      deal_id: input.dealId ?? null,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to create CRM task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

export async function updateCrmTask(input: {
  workspaceId: string;
  id: string;
  title?: string;
  description?: string | null;
  status?: CrmTaskStatus;
  priority?: CrmPriority;
  dueAt?: string | null;
  reminderAt?: string | null;
  assigneeId?: string | null;
  contactId?: string | null;
  companyId?: string | null;
  dealId?: string | null;
  completedAt?: string | null;
  client?: SupabaseClient<Database>;
}): Promise<CrmTask> {
  const supabase = await clientOrDefault(input.client);
  const patch: Database["public"]["Tables"]["crm_tasks"]["Update"] = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === "done" && input.completedAt === undefined) {
      patch.completed_at = new Date().toISOString();
    }
  }
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueAt !== undefined) patch.due_at = input.dueAt;
  if (input.reminderAt !== undefined) patch.reminder_at = input.reminderAt;
  if (input.assigneeId !== undefined) patch.assignee_id = input.assigneeId;
  if (input.contactId !== undefined) patch.contact_id = input.contactId;
  if (input.companyId !== undefined) patch.company_id = input.companyId;
  if (input.dealId !== undefined) patch.deal_id = input.dealId;
  if (input.completedAt !== undefined) patch.completed_at = input.completedAt;

  const { data, error } = await supabase
    .from("crm_tasks")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(`Failed to update CRM task: ${error?.message ?? "Unknown"}`);
  }
  return mapTask(data);
}

export async function deleteCrmTask(input: {
  workspaceId: string;
  id: string;
  client?: SupabaseClient<Database>;
}): Promise<void> {
  const supabase = await clientOrDefault(input.client);
  const { error } = await supabase
    .from("crm_tasks")
    .delete()
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.id);
  if (error) throw new Error(`Failed to delete CRM task: ${error.message}`);
}

export async function listCrmPipelines(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmPipeline[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_pipelines")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to list pipelines: ${error.message}`);
  return (data ?? []).map(mapPipeline);
}

export async function listCrmPipelineStages(input: {
  workspaceId: string;
  pipelineId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmPipelineStage[]> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("pipeline_id", input.pipelineId)
    .order("position", { ascending: true });
  if (error) throw new Error(`Failed to list pipeline stages: ${error.message}`);
  return (data ?? []).map(mapPipelineStage);
}

export async function ensureDefaultCrmPipeline(input: {
  workspaceId: string;
  userId: string;
  client?: SupabaseClient<Database>;
}): Promise<{ pipeline: CrmPipeline; stages: CrmPipelineStage[] }> {
  const existing = await listCrmPipelines(input);
  const defaultPipeline =
    existing.find((pipeline) => pipeline.isDefault) ?? existing[0] ?? null;

  if (defaultPipeline) {
    const stages = await listCrmPipelineStages({
      workspaceId: input.workspaceId,
      pipelineId: defaultPipeline.id,
      client: input.client,
    });
    if (stages.length > 0) {
      return { pipeline: defaultPipeline, stages };
    }
  }

  const supabase = await clientOrDefault(input.client);
  const { data: pipelineRow, error: pipelineError } = await supabase
    .from("crm_pipelines")
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: "Sales Pipeline",
      is_default: true,
    })
    .select("*")
    .single();
  if (pipelineError || !pipelineRow) {
    throw new Error(
      `Failed to create default pipeline: ${pipelineError?.message ?? "Unknown"}`,
    );
  }

  const { data: stageRows, error: stageError } = await supabase
    .from("crm_pipeline_stages")
    .insert(
      DEFAULT_PIPELINE_STAGES.map((stage) => ({
        workspace_id: input.workspaceId,
        pipeline_id: pipelineRow.id,
        name: stage.name,
        slug: stage.slug,
        position: stage.position,
        probability: stage.probability,
        is_won: stage.isWon ?? false,
        is_lost: stage.isLost ?? false,
        color: stage.color,
      })),
    )
    .select("*");
  if (stageError || !stageRows) {
    throw new Error(
      `Failed to create default pipeline stages: ${stageError?.message ?? "Unknown"}`,
    );
  }

  await supabase.from("crm_settings").upsert({
    workspace_id: input.workspaceId,
    default_pipeline_id: pipelineRow.id,
  });

  return {
    pipeline: mapPipeline(pipelineRow),
    stages: stageRows.map(mapPipelineStage),
  };
}

export async function createCrmPipelineStage(input: {
  workspaceId: string;
  pipelineId: string;
  name: string;
  slug?: string;
  position?: number;
  probability?: number;
  color?: string;
  isWon?: boolean;
  isLost?: boolean;
  client?: SupabaseClient<Database>;
}): Promise<CrmPipelineStage> {
  const supabase = await clientOrDefault(input.client);
  const stages = await listCrmPipelineStages({
    workspaceId: input.workspaceId,
    pipelineId: input.pipelineId,
    client: input.client,
  });
  const { data, error } = await supabase
    .from("crm_pipeline_stages")
    .insert({
      workspace_id: input.workspaceId,
      pipeline_id: input.pipelineId,
      name: input.name,
      slug: input.slug ?? slugify(input.name),
      position: input.position ?? stages.length,
      probability: input.probability ?? 20,
      color: input.color ?? "#f97316",
      is_won: input.isWon ?? false,
      is_lost: input.isLost ?? false,
    })
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to create pipeline stage: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapPipelineStage(data);
}

export async function getCrmSettings(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmSettings> {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase
    .from("crm_settings")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load CRM settings: ${error.message}`);
  if (data) return mapSettings(data);

  const { data: created, error: createError } = await supabase
    .from("crm_settings")
    .insert({ workspace_id: input.workspaceId })
    .select("*")
    .single();
  if (createError || !created) {
    throw new Error(
      `Failed to create CRM settings: ${createError?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(created);
}

export async function updateCrmSettings(input: {
  workspaceId: string;
  leadSources?: string[];
  customFields?: Array<Record<string, unknown>>;
  automationRules?: Array<Record<string, unknown>>;
  defaultPipelineId?: string | null;
  permissions?: Record<string, unknown>;
  client?: SupabaseClient<Database>;
}): Promise<CrmSettings> {
  const supabase = await clientOrDefault(input.client);
  await getCrmSettings({
    workspaceId: input.workspaceId,
    client: input.client,
  });

  const patch: Database["public"]["Tables"]["crm_settings"]["Update"] = {};
  if (input.leadSources !== undefined) {
    patch.lead_sources = input.leadSources as Json;
  }
  if (input.customFields !== undefined) {
    patch.custom_fields = input.customFields as Json;
  }
  if (input.automationRules !== undefined) {
    patch.automation_rules = input.automationRules as Json;
  }
  if (input.defaultPipelineId !== undefined) {
    patch.default_pipeline_id = input.defaultPipelineId;
  }
  if (input.permissions !== undefined) {
    patch.permissions = input.permissions as Json;
  }

  const { data, error } = await supabase
    .from("crm_settings")
    .update(patch)
    .eq("workspace_id", input.workspaceId)
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(
      `Failed to update CRM settings: ${error?.message ?? "Unknown"}`,
    );
  }
  return mapSettings(data);
}

export async function getCrmReportSnapshot(input: {
  workspaceId: string;
  client?: SupabaseClient<Database>;
}): Promise<CrmReportSnapshot> {
  const deals = await listDeals({
    workspaceId: input.workspaceId,
    client: input.client,
  });
  const stages: CrmDealStage[] = [
    "lead",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ];
  const won = deals.filter((deal) => deal.stage === "won");
  const lost = deals.filter((deal) => deal.stage === "lost");
  const open = deals.filter(
    (deal) => deal.stage !== "won" && deal.stage !== "lost",
  );
  const closed = won.length + lost.length;

  const monthMap = new Map<string, { won: number; lost: number }>();
  for (const deal of deals) {
    if (deal.stage !== "won" && deal.stage !== "lost") continue;
    const month = deal.updatedAt.slice(0, 7);
    const entry = monthMap.get(month) ?? { won: 0, lost: 0 };
    if (deal.stage === "won") entry.won += deal.amount;
    else entry.lost += deal.amount;
    monthMap.set(month, entry);
  }

  return {
    wonValue: won.reduce((sum, deal) => sum + deal.amount, 0),
    lostValue: lost.reduce((sum, deal) => sum + deal.amount, 0),
    openValue: open.reduce((sum, deal) => sum + deal.amount, 0),
    winRate: closed === 0 ? 0 : Math.round((won.length / closed) * 100),
    dealsByStage: stages.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      return {
        stage,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, deal) => sum + deal.amount, 0),
      };
    }),
    salesByMonth: [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, values]) => ({ month, ...values })),
  };
}

export async function searchCrmGlobal(input: {
  workspaceId: string;
  query: string;
  limit?: number;
  client?: SupabaseClient<Database>;
}): Promise<{
  contacts: CrmContact[];
  companies: CrmCompany[];
  deals: CrmDeal[];
}> {
  const limit = input.limit ?? 8;
  const query = input.query.trim();
  if (!query) {
    return { contacts: [], companies: [], deals: [] };
  }
  const [contacts, companies, deals] = await Promise.all([
    listContacts({
      workspaceId: input.workspaceId,
      query,
      limit,
      client: input.client,
    }),
    searchCompanies({
      workspaceId: input.workspaceId,
      query,
      limit,
      client: input.client,
    }),
    listDeals({
      workspaceId: input.workspaceId,
      query,
      client: input.client,
    }),
  ]);
  return {
    contacts,
    companies,
    deals: deals.slice(0, limit),
  };
}

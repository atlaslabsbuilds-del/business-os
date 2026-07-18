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
  CrmTag,
  CrmTimelineItem,
  Database,
} from "@repo/types";
import { createServerClient } from "./server";

type CompanyRow = Database["public"]["Tables"]["crm_companies"]["Row"];
type ContactRow = Database["public"]["Tables"]["crm_contacts"]["Row"];
type DealRow = Database["public"]["Tables"]["crm_deals"]["Row"];
type ActivityRow = Database["public"]["Tables"]["crm_activities"]["Row"];
type NoteRow = Database["public"]["Tables"]["crm_notes"]["Row"];
type TagRow = Database["public"]["Tables"]["crm_tags"]["Row"];

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
      color: input.color ?? "#4f46e5",
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

  const openDeals = deals.filter(
    (deal) => deal.stage !== "won" && deal.stage !== "lost",
  );

  return {
    contacts: contacts.length,
    companies: companies.length,
    leads: leads.length,
    openDeals: openDeals.length,
    pipelineValue: openDeals.reduce((sum, deal) => sum + deal.amount, 0),
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

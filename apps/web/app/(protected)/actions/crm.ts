"use server";

import { getUser } from "@repo/auth/server";
import {
  assignTag,
  createActivity,
  createCompany,
  createContact,
  createDeal,
  createLead,
  contactDisplayName,
  createNote,
  createTag,
  deleteActivity,
  deleteCompany,
  deleteContact,
  deleteDeal,
  deleteNote,
  deleteTag,
  getCrmDashboardStats,
  getCustomerTimeline,
  listActivities,
  listCompanies,
  listContacts,
  listDeals,
  listLeads,
  listNotes,
  listTags,
  searchCompanies,
  unassignTag,
  updateActivity,
  updateCompany,
  updateContact,
  updateDeal,
} from "@repo/database/crm";
import { getMembershipRole } from "@repo/database/workspace";
import { emitWorkspaceNotification } from "@repo/database/notifications";
import {
  assignTagSchema,
  createActivitySchema,
  createCompanySchema,
  createContactSchema,
  createDealSchema,
  createLeadSchema,
  createNoteSchema,
  createTagSchema,
  crmSearchSchema,
  deleteCrmEntitySchema,
  updateActivitySchema,
  updateCompanySchema,
  updateContactSchema,
  updateDealSchema,
} from "@repo/types";
import { ensureCrmAiToolsRegistered } from "../../../lib/crm-ai";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export type CrmActionResult<T> =
  | { ok: true; data: T; tools?: string[] }
  | { ok: false; error: string };

async function requireCrmContext() {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const context = await resolveActiveWorkspace();
  if (!context) throw new Error("No active workspace");

  const role = await getMembershipRole(context.active.workspace.id, user.id);
  if (!role) throw new Error("Forbidden");

  const { registered } = ensureCrmAiToolsRegistered();

  return {
    userId: user.id,
    workspaceId: context.active.workspace.id,
    tools: registered,
  };
}

function fail(error: unknown): CrmActionResult<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "CRM action failed",
  };
}

export async function getCrmDashboardAction(): Promise<
  CrmActionResult<{
    stats: Awaited<ReturnType<typeof getCrmDashboardStats>>;
    tools: string[];
  }>
> {
  try {
    const ctx = await requireCrmContext();
    const stats = await getCrmDashboardStats({ workspaceId: ctx.workspaceId });
    return { ok: true, data: { stats, tools: ctx.tools } };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmContactsAction(
  input: unknown,
): Promise<CrmActionResult<{ contacts: Awaited<ReturnType<typeof listContacts>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const contacts = await listContacts({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
      stage: parsed.data.stage,
      companyId: parsed.data.companyId,
    });
    return { ok: true, data: { contacts }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmLeadsAction(
  input: unknown,
): Promise<CrmActionResult<{ leads: Awaited<ReturnType<typeof listLeads>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const leads = await listLeads({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
    });
    return { ok: true, data: { leads }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmContactAction(
  input: unknown,
): Promise<CrmActionResult<{ contact: Awaited<ReturnType<typeof createContact>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createContactSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const contact = await createContact({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
      email: parsed.data.email || null,
    });
    await emitWorkspaceNotification({
      workspaceId: ctx.workspaceId,
      module: "crm",
      category: "new_customer",
      title: "New customer added",
      body: contactDisplayName(contact),
      actionUrl: `/crm/contacts`,
      userId: ctx.userId,
      metadata: { contactId: contact.id },
    });
    return { ok: true, data: { contact }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmLeadAction(
  input: unknown,
): Promise<CrmActionResult<{ lead: Awaited<ReturnType<typeof createLead>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createLeadSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const lead = await createLead({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email || null,
      phone: parsed.data.phone,
      title: parsed.data.title,
      companyId: parsed.data.companyId,
      source: parsed.data.source,
    });
    const leadName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim() || "New lead";
    await emitWorkspaceNotification({
      workspaceId: ctx.workspaceId,
      module: "crm",
      category: "new_lead",
      title: "New lead captured",
      body: leadName,
      actionUrl: "/crm/leads",
      userId: ctx.userId,
      metadata: { leadId: lead.id },
    });
    return { ok: true, data: { lead }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCrmContactAction(
  input: unknown,
): Promise<CrmActionResult<{ contact: Awaited<ReturnType<typeof updateContact>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = updateContactSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, ...rest } = parsed.data;
    const contact = await updateContact({
      workspaceId: ctx.workspaceId,
      id,
      ...rest,
      email: rest.email === "" ? null : rest.email,
    });
    return { ok: true, data: { contact }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmContactAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteContact({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmCompaniesAction(
  input: unknown,
): Promise<CrmActionResult<{ companies: Awaited<ReturnType<typeof listCompanies>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const companies = await listCompanies({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
    });
    return { ok: true, data: { companies }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function searchCrmCompaniesAction(
  input: unknown,
): Promise<CrmActionResult<{ companies: Awaited<ReturnType<typeof searchCompanies>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success || !parsed.data.query) {
      return { ok: false, error: "Search query is required" };
    }
    const companies = await searchCompanies({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
    });
    return { ok: true, data: { companies }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmCompanyAction(
  input: unknown,
): Promise<CrmActionResult<{ company: Awaited<ReturnType<typeof createCompany>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createCompanySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const company = await createCompany({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { company }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCrmCompanyAction(
  input: unknown,
): Promise<CrmActionResult<{ company: Awaited<ReturnType<typeof updateCompany>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = updateCompanySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, ...rest } = parsed.data;
    const company = await updateCompany({
      workspaceId: ctx.workspaceId,
      id,
      ...rest,
    });
    return { ok: true, data: { company }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmCompanyAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteCompany({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmDealsAction(
  input: unknown,
): Promise<CrmActionResult<{ deals: Awaited<ReturnType<typeof listDeals>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const deals = await listDeals({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
      stage: parsed.data.dealStage,
    });
    return { ok: true, data: { deals }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmDealAction(
  input: unknown,
): Promise<CrmActionResult<{ deal: Awaited<ReturnType<typeof createDeal>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createDealSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const deal = await createDeal({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { deal }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCrmDealAction(
  input: unknown,
): Promise<CrmActionResult<{ deal: Awaited<ReturnType<typeof updateDeal>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = updateDealSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, ...rest } = parsed.data;
    const deal = await updateDeal({
      workspaceId: ctx.workspaceId,
      id,
      ...rest,
    });
    return { ok: true, data: { deal }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmDealAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteDeal({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmActivitiesAction(
  input: unknown,
): Promise<
  CrmActionResult<{ activities: Awaited<ReturnType<typeof listActivities>> }>
> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const activities = await listActivities({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
    });
    return { ok: true, data: { activities }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmActivityAction(
  input: unknown,
): Promise<CrmActionResult<{ activity: Awaited<ReturnType<typeof createActivity>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createActivitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const activity = await createActivity({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { activity }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function updateCrmActivityAction(
  input: unknown,
): Promise<CrmActionResult<{ activity: Awaited<ReturnType<typeof updateActivity>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = updateActivitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const { id, ...rest } = parsed.data;
    const activity = await updateActivity({
      workspaceId: ctx.workspaceId,
      id,
      ...rest,
    });
    return { ok: true, data: { activity }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmActivityAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteActivity({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmNotesAction(input: {
  contactId?: string;
  companyId?: string;
  dealId?: string;
}): Promise<CrmActionResult<{ notes: Awaited<ReturnType<typeof listNotes>> }>> {
  try {
    const ctx = await requireCrmContext();
    const notes = await listNotes({
      workspaceId: ctx.workspaceId,
      contactId: input.contactId,
      companyId: input.companyId,
      dealId: input.dealId,
    });
    return { ok: true, data: { notes }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmNoteAction(
  input: unknown,
): Promise<CrmActionResult<{ note: Awaited<ReturnType<typeof createNote>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createNoteSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const note = await createNote({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { note }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmNoteAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteNote({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function listCrmTagsAction(
  input: unknown,
): Promise<CrmActionResult<{ tags: Awaited<ReturnType<typeof listTags>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = crmSearchSchema.safeParse(input ?? {});
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const tags = await listTags({
      workspaceId: ctx.workspaceId,
      query: parsed.data.query,
    });
    return { ok: true, data: { tags }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function createCrmTagAction(
  input: unknown,
): Promise<CrmActionResult<{ tag: Awaited<ReturnType<typeof createTag>> }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = createTagSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    const tag = await createTag({
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      ...parsed.data,
    });
    return { ok: true, data: { tag }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCrmTagAction(
  input: unknown,
): Promise<CrmActionResult<{ deleted: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = deleteCrmEntitySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await deleteTag({ workspaceId: ctx.workspaceId, id: parsed.data.id });
    return { ok: true, data: { deleted: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function assignCrmTagAction(
  input: unknown,
): Promise<CrmActionResult<{ assigned: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = assignTagSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await assignTag({ workspaceId: ctx.workspaceId, ...parsed.data });
    return { ok: true, data: { assigned: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function unassignCrmTagAction(
  input: unknown,
): Promise<CrmActionResult<{ unassigned: true }>> {
  try {
    const ctx = await requireCrmContext();
    const parsed = assignTagSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
    await unassignTag({ workspaceId: ctx.workspaceId, ...parsed.data });
    return { ok: true, data: { unassigned: true }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

export async function getCrmTimelineAction(input: {
  contactId: string;
}): Promise<
  CrmActionResult<{ items: Awaited<ReturnType<typeof getCustomerTimeline>> }>
> {
  try {
    const ctx = await requireCrmContext();
    const items = await getCustomerTimeline({
      workspaceId: ctx.workspaceId,
      contactId: input.contactId,
    });
    return { ok: true, data: { items }, tools: ctx.tools };
  } catch (error) {
    return fail(error);
  }
}

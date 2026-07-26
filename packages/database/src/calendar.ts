import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalendarAvailability, CalendarBookingLink, CalendarDashboardStats, CalendarMeetingNote, Database, Json } from "@repo/types";
import { createServerClient } from "./server";
import { listInboxCalendarEvents } from "./inbox";

type Client = SupabaseClient<Database>;
const clientOrDefault = async (client?: Client) => client ?? (await createServerClient());
const objectValue = (value: Json) => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};

function mapLink(row: Database["public"]["Tables"]["calendar_booking_links"]["Row"]): CalendarBookingLink {
  return { id: row.id, workspaceId: row.workspace_id, name: row.name, slug: row.slug, durationMinutes: row.duration_minutes, bufferMinutes: row.buffer_minutes, timezone: row.timezone, workingHours: objectValue(row.working_hours), active: row.active, bookingCount: row.booking_count };
}
function mapAvailability(row: Database["public"]["Tables"]["calendar_availability"]["Row"]): CalendarAvailability {
  return { id: row.id, workspaceId: row.workspace_id, name: row.name, timezone: row.timezone, workingDays: objectValue(row.working_days), hours: objectValue(row.hours), holidays: Array.isArray(row.holidays) ? row.holidays : [] };
}
function mapNote(row: Database["public"]["Tables"]["calendar_meeting_notes"]["Row"]): CalendarMeetingNote {
  return { id: row.id, eventId: row.event_id, summary: row.summary, actionItems: Array.isArray(row.action_items) ? row.action_items : [], crmSynced: row.crm_synced };
}

export async function listBookingLinks(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("calendar_booking_links").select("*").eq("workspace_id", input.workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list booking links: ${error.message}`);
  return (data ?? []).map(mapLink);
}
export async function createBookingLink(input: { workspaceId: string; userId: string; name: string; durationMinutes: number; bufferMinutes: number; timezone: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "booking";
  const { data, error } = await supabase.from("calendar_booking_links").insert({
    workspace_id: input.workspaceId, created_by: input.userId, name: input.name,
    slug: `${slug}-${Date.now().toString(36)}`, duration_minutes: input.durationMinutes,
    buffer_minutes: input.bufferMinutes, timezone: input.timezone,
  }).select("*").single();
  if (error || !data) throw new Error(`Failed to create booking link: ${error?.message ?? "Unknown"}`);
  return mapLink(data);
}
export async function getAvailability(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("calendar_availability").select("*").eq("workspace_id", input.workspaceId).order("created_at").limit(1).maybeSingle();
  if (error) throw new Error(`Failed to load availability: ${error.message}`);
  return data ? mapAvailability(data) : null;
}
export async function upsertAvailability(input: { workspaceId: string; userId: string; name: string; timezone: string; workingDays: Record<string, boolean>; hours: Record<string, string>; holidays: string[]; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("calendar_availability").upsert({
    workspace_id: input.workspaceId, created_by: input.userId, name: input.name,
    timezone: input.timezone, working_days: input.workingDays, hours: input.hours, holidays: input.holidays,
  }, { onConflict: "id" }).select("*").single();
  if (error || !data) throw new Error(`Failed to save availability: ${error?.message ?? "Unknown"}`);
  return mapAvailability(data);
}
export async function listMeetingNotes(input: { workspaceId: string; client?: Client }) {
  const supabase = await clientOrDefault(input.client);
  const { data, error } = await supabase.from("calendar_meeting_notes").select("*").eq("workspace_id", input.workspaceId).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to list meeting notes: ${error.message}`);
  return (data ?? []).map(mapNote);
}
export async function getCalendarDashboardStats(input: { workspaceId: string; client?: Client }): Promise<CalendarDashboardStats> {
  const [events, links] = await Promise.all([
    listInboxCalendarEvents({ workspaceId: input.workspaceId, client: input.client }),
    listBookingLinks({ workspaceId: input.workspaceId, client: input.client }),
  ]);
  const now = Date.now();
  const upcoming = events.filter((event) => new Date(event.startsAt).getTime() >= now && event.status === "scheduled");
  const completed = events.filter((event) => event.status === "completed");
  const cancelled = events.filter((event) => event.status === "cancelled");
  const today = events.filter((event) => new Date(event.startsAt).toDateString() === new Date().toDateString());
  const minutes = events.reduce((sum, event) => sum + Math.max(0, (new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 60000), 0);
  return { upcoming: upcoming.length, completed: completed.length, cancelled: cancelled.length, today: today.length, bookings: links.reduce((sum, link) => sum + link.bookingCount, 0), noShowRate: 0, meetingMinutes: Math.round(minutes), conversionRate: 0 };
}

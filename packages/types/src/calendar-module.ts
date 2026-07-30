import { z } from "zod";

export const calendarEventStatusSchema = z.enum(["scheduled", "confirmed", "completed", "cancelled"]);
export type CalendarEventStatus = z.infer<typeof calendarEventStatusSchema>;
export const calendarEventPrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type CalendarEventPriority = z.infer<typeof calendarEventPrioritySchema>;
export const calendarIntegrationProviderSchema = z.enum(["google", "outlook", "apple"]);
export type CalendarIntegrationProvider = z.infer<typeof calendarIntegrationProviderSchema>;

export type CalendarEvent = {
  id: string; workspaceId: string; createdBy: string; title: string; description: string | null;
  location: string | null; videoUrl: string | null; startsAt: string; endsAt: string; timezone: string;
  status: CalendarEventStatus; priority: CalendarEventPriority; color: string; isAllDay: boolean;
  recurrenceRule: string | null; category: string; createdAt: string; updatedAt: string;
};
export type CalendarMeeting = {
  id: string; workspaceId: string; eventId: string; createdBy: string; notes: string | null;
  recordingUrl: string | null; summary: string | null; actionItems: Array<Record<string, unknown>>;
  followUpTaskIds: string[]; createdAt: string; updatedAt: string;
};
export type CalendarParticipant = {
  id: string; workspaceId: string; eventId: string; userId: string | null; email: string | null;
  name: string | null; responseStatus: "pending" | "accepted" | "declined" | "tentative";
  isRequired: boolean; createdAt: string;
};
export type CalendarReminder = {
  id: string; workspaceId: string; createdBy: string; eventId: string | null; title: string;
  remindAt: string; channel: "email" | "push" | "in_app"; recurrenceRule: string | null;
  sentAt: string | null; createdAt: string; updatedAt: string;
};
export type CalendarIntegration = {
  id: string; workspaceId: string; createdBy: string; provider: CalendarIntegrationProvider;
  accountEmail: string | null; externalAccountId: string | null; status: string;
  lastSyncedAt: string | null; syncError: string | null; createdAt: string; updatedAt: string;
};
export type CalendarWorkingAvailability = {
  id: string; workspaceId: string; createdBy: string; name: string; timezone: string;
  workingDays: Record<string, boolean>; hours: Record<string, string>; vacationDates: string[];
  createdAt: string; updatedAt: string;
};
export type CalendarSettings = {
  workspaceId: string; defaultTimezone: string; weekStartsOn: number; defaultEventDuration: number;
  workingHours: Record<string, string>; colorCategories: Record<string, string>;
  notifications: Record<string, boolean>; createdAt: string; updatedAt: string;
};
export type CalendarOverview = {
  events: CalendarEvent[]; today: CalendarEvent[]; upcoming: CalendarEvent[];
  reminders: CalendarReminder[]; meetings: CalendarMeeting[]; availability: CalendarWorkingAvailability | null;
  settings: CalendarSettings;
};

export const createCalendarEventSchema = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().trim().max(8000).optional().nullable(),
  location: z.string().trim().max(500).optional().nullable(), videoUrl: z.string().url().optional().nullable(),
  startsAt: z.string(), endsAt: z.string(), timezone: z.string().default("UTC"),
  status: calendarEventStatusSchema.optional(), priority: calendarEventPrioritySchema.optional(),
  color: z.string().max(20).optional(), isAllDay: z.boolean().optional(), recurrenceRule: z.string().max(500).optional().nullable(), category: z.string().max(80).optional(),
});
export const updateCalendarEventSchema = createCalendarEventSchema.partial().extend({ id: z.string().uuid() });
export const createCalendarReminderSchema = z.object({ eventId: z.string().uuid().optional().nullable(), title: z.string().trim().min(1).max(200), remindAt: z.string(), channel: z.enum(["email", "push", "in_app"]).optional(), recurrenceRule: z.string().max(500).optional().nullable() });
export const createCalendarMeetingSchema = z.object({ eventId: z.string().uuid(), notes: z.string().max(10000).optional().nullable(), recordingUrl: z.string().url().optional().nullable(), summary: z.string().max(5000).optional().nullable() });
export const updateCalendarAvailabilitySchema = z.object({ name: z.string().min(1).max(120), timezone: z.string().min(1), workingDays: z.record(z.string(), z.boolean()), hours: z.record(z.string(), z.string()), vacationDates: z.array(z.string()).optional() });

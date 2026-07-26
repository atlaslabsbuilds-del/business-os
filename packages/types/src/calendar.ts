import { z } from "zod";

export type CalendarBookingLink = {
  id: string; workspaceId: string; name: string; slug: string;
  durationMinutes: number; bufferMinutes: number; timezone: string;
  workingHours: Record<string, unknown>; active: boolean; bookingCount: number;
};
export type CalendarAvailability = {
  id: string; workspaceId: string; name: string; timezone: string;
  workingDays: Record<string, unknown>; hours: Record<string, unknown>; holidays: unknown[];
};
export type CalendarMeetingNote = {
  id: string; eventId: string | null; summary: string; actionItems: unknown[]; crmSynced: boolean;
};
export type CalendarDashboardStats = {
  upcoming: number; completed: number; cancelled: number; today: number;
  bookings: number; noShowRate: number; meetingMinutes: number; conversionRate: number;
};

export const createBookingLinkSchema = z.object({
  name: z.string().trim().min(1).max(120),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  timezone: z.string().min(1).default("UTC"),
});
export const updateAvailabilitySchema = z.object({
  name: z.string().trim().min(1).max(120),
  timezone: z.string().min(1),
  workingDays: z.record(z.string(), z.boolean()),
  hours: z.object({ start: z.string(), end: z.string() }),
  holidays: z.array(z.string()).default([]),
});
export const meetingSummarySchema = z.object({
  eventId: z.string().uuid(),
  transcript: z.string().trim().min(1).max(30000),
});
export type CreateBookingLinkInput = z.infer<typeof createBookingLinkSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

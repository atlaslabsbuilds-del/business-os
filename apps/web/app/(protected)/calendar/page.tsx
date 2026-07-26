import { redirect } from "next/navigation";
import { listInboxCalendarEvents } from "@repo/database/inbox";
import { getAvailability, getCalendarDashboardStats, listBookingLinks, listMeetingNotes } from "@repo/database/calendar";
import { CalendarShell } from "../../../components/calendar/calendar-shell";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const context = await resolveActiveWorkspace();
  if (!context) redirect("/onboarding");
  const workspaceId = context.active.workspace.id;
  const [stats, events, links, availability, notes] = await Promise.all([
    getCalendarDashboardStats({ workspaceId }),
    listInboxCalendarEvents({ workspaceId }),
    listBookingLinks({ workspaceId }),
    getAvailability({ workspaceId }),
    listMeetingNotes({ workspaceId }),
  ]);
  return <CalendarShell stats={stats} events={events} links={links} availability={availability} notes={notes} />;
}

import { redirect } from "next/navigation";
import { resolveActiveWorkspace } from "../../../lib/workspace-context";
import { getCalendarModuleData } from "../actions/calendar-module";
import { CalendarModuleShell } from "../../../components/calendar/calendar-module-shell";
import { CalendarAvailabilityPanel, CalendarEventsPanel, CalendarIntegrationsPanel, CalendarMeetingsPanel, CalendarOverviewPanel, CalendarRemindersPanel, CalendarSettingsPanel } from "../../../components/calendar/calendar-module-extra";

export const dynamic = "force-dynamic";
type Props={searchParams:Promise<{view?:string}>};
export default async function CalendarPage({searchParams}:Props){const context=await resolveActiveWorkspace();if(!context)redirect("/onboarding");const data=await getCalendarModuleData();const view=(await searchParams).view??"overview";const content=view==="calendar"||view==="events"?<CalendarEventsPanel data={data}/>:view==="meetings"?<CalendarMeetingsPanel data={data}/>:view==="reminders"?<CalendarRemindersPanel data={data}/>:view==="availability"?<CalendarAvailabilityPanel data={data}/>:view==="integrations"?<CalendarIntegrationsPanel data={data}/>:view==="settings"?<CalendarSettingsPanel data={data}/>:<CalendarOverviewPanel data={data}/>;return <CalendarModuleShell title={view==="overview"?"Calendar Overview":view.charAt(0).toUpperCase()+view.slice(1)} description="Schedule meaningful work with events, meetings, reminders, availability, and AI recommendations.">{content}</CalendarModuleShell>}

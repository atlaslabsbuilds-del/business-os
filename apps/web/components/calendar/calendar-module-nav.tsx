"use client";
import { ModuleNav } from "../app/module-nav";
const items=[{href:"/calendar",label:"Overview",exact:true},{href:"/calendar?view=calendar",label:"My Calendar"},{href:"/calendar?view=team",label:"Team Calendar"},{href:"/calendar?view=meetings",label:"Meetings"},{href:"/calendar?view=events",label:"Events"},{href:"/calendar?view=reminders",label:"Reminders"},{href:"/calendar?view=availability",label:"Availability"},{href:"/calendar?view=integrations",label:"Integrations"},{href:"/calendar?view=settings",label:"Settings"}];
export function CalendarModuleNav(){return <ModuleNav items={items}/>}

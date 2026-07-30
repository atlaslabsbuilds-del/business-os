import type { ReactNode } from "react";
import { ModulePageShell } from "../app/module-page-shell";
import { CalendarModuleNav } from "./calendar-module-nav";
export function CalendarModuleShell({title,description,children,actions}:{title:string;description?:string;children:ReactNode;actions?:ReactNode}){return <ModulePageShell badge="Calendar" title={title} description={description} actions={actions}><CalendarModuleNav />{children}</ModulePageShell>}

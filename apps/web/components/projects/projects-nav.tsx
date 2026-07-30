"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/projects", label: "Overview", exact: true },
  { href: "/projects/list", label: "Projects" },
  { href: "/projects/tasks", label: "Tasks" },
  { href: "/projects/kanban", label: "Kanban" },
  { href: "/projects/timeline", label: "Timeline" },
  { href: "/projects/calendar", label: "Calendar" },
  { href: "/projects/teams", label: "Teams" },
  { href: "/projects/reports", label: "Reports" },
  { href: "/projects/settings", label: "Settings" },
];

export function ProjectsNav() {
  return <ModuleNav items={items} />;
}

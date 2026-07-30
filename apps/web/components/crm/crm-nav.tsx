"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/crm", label: "Overview", exact: true },
  { href: "/crm/leads", label: "Leads" },
  { href: "/crm/contacts", label: "Contacts" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/deals", label: "Deals" },
  { href: "/crm/pipeline", label: "Pipeline" },
  { href: "/crm/activities", label: "Activities" },
  { href: "/crm/tasks", label: "Tasks" },
  { href: "/crm/reports", label: "Reports" },
  { href: "/crm/settings", label: "Settings" },
];

export function CrmNav() {
  return <ModuleNav items={items} />;
}

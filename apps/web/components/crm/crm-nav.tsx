"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/crm", label: "Dashboard", exact: true },
  { href: "/crm/contacts", label: "Contacts" },
  { href: "/crm/companies", label: "Companies" },
  { href: "/crm/leads", label: "Leads" },
  { href: "/crm/deals", label: "Deals" },
  { href: "/crm/activities", label: "Activities" },
  { href: "/crm/notes", label: "Notes" },
  { href: "/crm/tags", label: "Tags" },
];

export function CrmNav() {
  return <ModuleNav items={items} />;
}

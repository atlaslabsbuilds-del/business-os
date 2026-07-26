"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/inbox", label: "Unified", exact: true },
  { href: "/inbox/accounts", label: "Accounts" },
  { href: "/inbox/labels", label: "Labels" },
  { href: "/inbox/tasks", label: "Tasks" },
  { href: "/inbox/calendar", label: "Calendar" },
];

export function InboxNav() {
  return <ModuleNav items={items} />;
}

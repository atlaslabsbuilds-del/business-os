"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/notifications", label: "All", exact: true },
  { href: "/notifications?section=unread", label: "Unread" },
  { href: "/notifications?section=mentions", label: "Mentions" },
  { href: "/notifications?section=tasks", label: "Tasks" },
  { href: "/notifications?section=projects", label: "Projects" },
  { href: "/notifications?section=finance", label: "Finance" },
  { href: "/notifications?section=crm", label: "CRM" },
  { href: "/notifications?section=calendar", label: "Calendar" },
  { href: "/notifications?section=system", label: "System" },
  { href: "/notifications/activity", label: "Activity" },
  { href: "/notifications/preferences", label: "Settings" },
];

export function NotificationsNav() {
  return <ModuleNav items={items} />;
}

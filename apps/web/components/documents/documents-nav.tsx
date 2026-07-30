"use client";

import { ModuleNav } from "../app/module-nav";

const items = [
  { href: "/documents", label: "All Documents", exact: true },
  { href: "/documents/shared", label: "Shared" },
  { href: "/documents/recent", label: "Recent" },
  { href: "/documents/templates", label: "Templates" },
  { href: "/documents/knowledge", label: "Knowledge Base" },
  { href: "/documents/folders", label: "Folders" },
  { href: "/documents/trash", label: "Trash" },
  { href: "/documents/settings", label: "Settings" },
];

export function DocumentsNav() {
  return <ModuleNav items={items} />;
}

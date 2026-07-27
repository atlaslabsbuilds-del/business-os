import type { KairosWorkspaceContext, KairosWorkspaceModule } from "./types";

export function moduleFromPathname(pathname: string): KairosWorkspaceModule {
  if (pathname.startsWith("/crm") || pathname.startsWith("/deals")) return "crm";
  if (pathname.startsWith("/customers")) return "customers";
  if (pathname.startsWith("/inbox")) return "inbox";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/marketing")) return "marketing";
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/calendar")) return "calendar";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/ai") || pathname.startsWith("/command")) return "ai";
  if (pathname.startsWith("/dashboard") || pathname === "/") return "dashboard";
  return "other";
}

export function buildWorkspaceContext(
  pathname: string,
  context: Partial<Omit<KairosWorkspaceContext, "pathname" | "module">> = {},
): KairosWorkspaceContext {
  const ids = pathname.match(
    /\/(customers?|deals?|tasks?|threads?)\/([0-9a-f-]{16,})/i,
  );
  const inferred = ids
    ? ids[1]!.toLowerCase().startsWith("customer")
      ? { customerId: ids[2] }
      : ids[1]!.toLowerCase().startsWith("deal")
        ? { dealId: ids[2] }
        : ids[1]!.toLowerCase().startsWith("thread")
          ? { threadId: ids[2] }
          : { taskId: ids[2] }
    : {};
  return {
    pathname,
    module: moduleFromPathname(pathname),
    ...inferred,
    ...context,
  };
}

/** Context-aware suggested action ids when palette is empty. */
export function contextSuggestedActionIds(
  module: KairosWorkspaceModule,
): string[] {
  switch (module) {
    case "crm":
    case "deals":
      return [
        "create-deal",
        "open-customers",
        "create-customer",
        "today-revenue",
        "workflow-onboard-lead",
      ];
    case "customers":
      return [
        "create-customer",
        "create-deal",
        "search-customer",
        "open-deals",
        "today-signups",
      ];
    case "inbox":
      return [
        "create-task",
        "create-reminder",
        "open-calendar",
        "ask-kairos",
        "open-crm",
      ];
    case "analytics":
    case "dashboard":
      return [
        "today-revenue",
        "today-signups",
        "open-inbox",
        "workflow-daily-pulse",
        "open-marketing",
      ];
    case "marketing":
      return [
        "open-campaigns",
        "open-marketing",
        "open-analytics",
        "ask-kairos",
      ];
    case "calendar":
      return ["create-reminder", "create-task", "open-inbox", "open-crm"];
    default:
      return [
        "open-crm",
        "open-inbox",
        "create-customer",
        "create-deal",
        "today-revenue",
      ];
  }
}

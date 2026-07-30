"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  CornerDownLeft,
  LayoutDashboard,
  Mail,
  Megaphone,
  MessageSquare,
  PenLine,
  Plus,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@repo/ui/command";
import {
  globalSearchAction,
  rememberWorkspaceFactAction,
} from "../../app/(protected)/actions/platform";
import type { GlobalSearchResult } from "../../lib/global-search";
import {
  buildWorkspaceContext,
  detectKairosIntent,
  KAIROS_ACTION_CATALOG,
  matchKairosActions,
  PLUS_COMMAND_HINTS,
  runKairosHandler,
  SLASH_COMMAND_HINTS,
  type KairosAction,
} from "../../lib/kairos-agent";
import { useAppChrome } from "./app-chrome-provider";
import { KairosAvatar } from "../kairos/kairos-avatar";

const RECENT_KEY = "bos_kairos_actions_recent_v2";

function iconForAction(action: KairosAction) {
  switch (action.id) {
    case "open-crm":
    case "create-deal":
    case "open-deals":
      return Briefcase;
    case "open-inbox":
    case "create-task":
      return Mail;
    case "create-reminder":
      return Bell;
    case "open-customers":
    case "create-customer":
    case "search-customer":
      return Users;
    case "open-analytics":
    case "today-revenue":
    case "today-signups":
      return BarChart3;
    case "open-marketing":
      return Megaphone;
    case "open-settings":
      return Settings;
    case "open-calendar":
      return CalendarDays;
    case "open-dashboard":
      return LayoutDashboard;
    case "ask-kairos":
    case "ask-prompt":
      return Sparkles;
    case "workflow-onboard-lead":
    case "workflow-daily-pulse":
      return Workflow;
    default:
      if (action.kind === "search") return Search;
      if (action.kind === "create") return Plus;
      if (action.kind === "workflow") return Workflow;
      return Terminal;
  }
}

function iconForModule(module: string) {
  switch (module) {
    case "crm":
      return Briefcase;
    case "inbox":
    case "tasks":
      return Mail;
    case "chat":
    case "agents":
    case "command":
      return Sparkles;
    case "content":
    case "social":
      return PenLine;
    case "calendar":
      return CalendarDays;
    case "projects":
      return Workflow;
    case "documents":
      return PenLine;
    case "finance":
    case "analytics":
      return BarChart3;
    case "notifications":
      return Bell;
    case "settings":
      return Settings;
    default:
      return Search;
  }
}

export function CommandPaletteTrigger() {
  const { openCommand } = useAppChrome();

  return (
    <button
      type="button"
      onClick={() => openCommand()}
      className="bos-glass hidden min-w-[200px] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted transition hover:text-secondary sm:flex lg:min-w-[260px]"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="flex-1 truncate">Ask Kairos · /slash · +create</span>
      <kbd className="rounded-md border border-border/60 bg-elevated/60 px-1.5 py-0.5 font-mono text-[10px] text-secondary">
        ⌘K
      </kbd>
    </button>
  );
}

export function AppCommandPalette() {
  const {
    commandOpen,
    closeCommand,
    toggleCommand,
    openCommand,
    commandPrefill,
    clearCommandPrefill,
    showActionStatus,
    openQuickCreate,
    requestConfirm,
    startWorkflow,
    pushToast,
    workspaceContext,
  } = useAppChrome();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspace = useMemo(
    () =>
      buildWorkspaceContext(pathname, {
        ...workspaceContext,
        customerId: searchParams.get("customerId") ?? undefined,
        dealId: searchParams.get("dealId") ?? undefined,
        taskId: searchParams.get("taskId") ?? undefined,
        threadId: searchParams.get("threadId") ?? undefined,
      }),
    [pathname, searchParams, workspaceContext],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [pending, startTransition] = useTransition();
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecentIds(JSON.parse(raw) as string[]);
      const history = window.localStorage.getItem(`${RECENT_KEY}_history`);
      if (history) setCommandHistory(JSON.parse(history) as string[]);
    } catch {
      setRecentIds([]);
    }
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        toggleCommand();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleCommand]);

  useEffect(() => {
    if (commandOpen && commandPrefill !== null) {
      setQuery(commandPrefill);
      clearCommandPrefill();
    }
  }, [commandOpen, commandPrefill, clearCommandPrefill]);

  useEffect(() => {
    if (!commandOpen) {
      setQuery("");
      setResults([]);
      setExecuting(false);
    }
  }, [commandOpen]);

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < 1 || trimmed.startsWith("/") || trimmed.startsWith("+")) {
        setResults([]);
        return;
      }
      const intent = detectKairosIntent(trimmed, workspace);
      if (
        intent &&
        (intent.kind === "navigate" ||
          intent.kind === "external" ||
          intent.kind === "create" ||
          intent.kind === "insight" ||
          intent.kind === "workflow")
      ) {
        setResults([]);
        return;
      }
      startTransition(async () => {
        const response = await globalSearchAction({ query: trimmed, limit: 14 });
        if (response.ok) setResults(response.data.results);
        else setResults([]);
      });
    },
    [workspace],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), 140);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const remember = useCallback((actionId?: string) => {
    if (!actionId) return;
    setRecentIds((current) => {
      const next = [actionId, ...current.filter((id) => id !== actionId)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const rememberCommand = useCallback(
    (command: string) => {
      const normalized = command.trim().replace(/\s+/g, " ");
      if (!normalized) return;
      setCommandHistory((current) => {
        const next = [
          normalized,
          ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
        ].slice(0, 20);
        try {
          window.localStorage.setItem(`${RECENT_KEY}_history`, JSON.stringify(next));
        } catch {
          // History is a convenience; persistence is best effort.
        }
        return next;
      });
      setHistoryIndex(-1);
      void rememberWorkspaceFactAction({
        fact: `Kairos command: ${normalized}`,
        summary: "Recent command used in the workspace.",
        sourceModule: workspace.module,
        scope: "recent_commands",
        importance: 1,
        metadata: {
          command: normalized,
          pathname: workspace.pathname,
          customerId: workspace.customerId ?? null,
          dealId: workspace.dealId ?? null,
          taskId: workspace.taskId ?? null,
        },
      }).then((response) => {
        if (response.ok) {
          pushToast({
            title: "Memory Updated",
            description: "Kairos remembered your recent command.",
            variant: "info",
          });
        }
      });
    },
    [pushToast, workspace],
  );

  const executeAction = useCallback(
    async (action: KairosAction) => {
      if (executing) return;
      setExecuting(true);
      rememberCommand(query);
      remember(action.id.startsWith("search-") ? "search-customer" : action.id);
      const contextualDraft = {
        ...action.draft,
        ...(workspace.customerId ? { customerId: workspace.customerId } : {}),
        ...(workspace.dealId ? { dealId: workspace.dealId } : {}),
        ...(workspace.taskId ? { taskId: workspace.taskId } : {}),
        ...(workspace.threadId ? { threadId: workspace.threadId } : {}),
      };

      const result = await runKairosHandler({
        action,
        workspace,
        navigate: (href) => {
          closeCommand();
          router.push(href);
        },
        openExternal: (url) => {
          closeCommand();
          window.location.assign(url);
        },
        showStatus: async (message, durationMs) => {
          if (action.kind !== "search") closeCommand();
          await showActionStatus(message, durationMs);
        },
        openQuickCreate: (entity, draft) => {
          closeCommand();
          openQuickCreate(entity, { ...contextualDraft, ...draft });
        },
        requestConfirm: async (actionToConfirm) => {
          closeCommand();
          return requestConfirm(actionToConfirm);
        },
        startWorkflow: (workflowId, draft) => {
          closeCommand();
          startWorkflow(workflowId, draft);
        },
      });

      if (result.status === "cancelled") {
        setExecuting(false);
        return;
      }

      if (result.status === "search") {
        if (result.query) {
          setQuery(result.query);
          startTransition(async () => {
            const response = await globalSearchAction({
              query: result.query,
              limit: 16,
            });
            if (response.ok) setResults(response.data.results);
          });
        } else {
          setQuery("");
          setResults([]);
        }
        setExecuting(false);
        return;
      }

      if (result.status === "create") {
        closeCommand();
        openQuickCreate(result.entity, { ...contextualDraft, ...result.draft });
        setExecuting(false);
        return;
      }

      if (result.status === "workflow") {
        closeCommand();
        startWorkflow(result.workflowId, result.draft);
        setExecuting(false);
        return;
      }

      setExecuting(false);
    },
    [
      closeCommand,
      executing,
      openQuickCreate,
      query,
      remember,
      rememberCommand,
      requestConfirm,
      router,
      showActionStatus,
      startWorkflow,
      workspace,
    ],
  );

  const detected = useMemo(
    () => detectKairosIntent(query, workspace),
    [query, workspace],
  );
  const matchedActions = useMemo(
    () => matchKairosActions(query, 8, workspace),
    [query, workspace],
  );

  const recentActions = useMemo(
    () =>
      recentIds
        .map((id) => KAIROS_ACTION_CATALOG.find((action) => action.id === id))
        .filter(Boolean)
        .slice(0, 5) as KairosAction[],
    [recentIds],
  );

  const slashMode = query.trim().startsWith("/");
  const plusMode = query.trim().startsWith("+");

  function onOpenChange(open: boolean) {
    if (open) openCommand();
    else closeCommand();
  }

  return (
    <CommandDialog open={commandOpen} onOpenChange={onOpenChange} label="Kairos Actions">
      <Command shouldFilter={false} loop>
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <KairosAvatar
            size="xs"
            state={pending || executing ? "thinking" : "listening"}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Kairos V2
              <span className="ml-2 font-medium normal-case tracking-normal text-muted">
                · {workspace.module}
              </span>
            </p>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp" && commandHistory.length > 0) {
                  event.preventDefault();
                  const nextIndex = Math.min(
                    historyIndex + 1,
                    commandHistory.length - 1,
                  );
                  setHistoryIndex(nextIndex);
                  setQuery(commandHistory[nextIndex] ?? "");
                }
                if (event.key === "ArrowDown" && historyIndex >= 0) {
                  event.preventDefault();
                  const nextIndex = historyIndex - 1;
                  setHistoryIndex(nextIndex);
                  setQuery(nextIndex >= 0 ? commandHistory[nextIndex] ?? "" : "");
                }
              }}
              placeholder='Try “Create deal”, /customer, or +reminder'
              className="h-9 px-0"
            />
          </div>
          <kbd className="hidden rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted sm:inline">
            ESC
          </kbd>
        </div>

        <CommandList>
          <CommandEmpty>
            <div className="space-y-3">
              <p>No matches for “{query}”.</p>
              <button
                type="button"
                onClick={() =>
                  void executeAction({
                    id: "ask-fallback",
                    kind: "ask",
                    label: "Ask Kairos",
                    description: query,
                    confirmation: "Opening Kairos...",
                    href: `/chat?prompt=${encodeURIComponent(query.trim())}`,
                    keywords: [],
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-sm text-primary transition hover:bg-primary/25"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Ask Kairos instead
              </button>
            </div>
          </CommandEmpty>

          {detected ? (
            <CommandGroup heading="Intent">
              <CommandItem
                value={`intent-${detected.id}`}
                onSelect={() => void executeAction(detected)}
              >
                <CornerDownLeft className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{detected.label}</span>
                  <span className="block text-xs text-muted">
                    {detected.requiresConfirmation
                      ? "Needs confirmation · "
                      : ""}
                    {detected.confirmation}
                  </span>
                </span>
                <CommandShortcut>{detected.kind}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {slashMode && !query.trim().slice(1) ? (
            <CommandGroup heading="Slash commands">
              {SLASH_COMMAND_HINTS.map((hint) => (
                <CommandItem
                  key={hint.cmd}
                  value={`slash-${hint.cmd}`}
                  onSelect={() => setQuery(`${hint.cmd} `)}
                >
                  <Terminal className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium font-mono">{hint.cmd}</span>
                    <span className="block text-xs text-muted">{hint.label}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {plusMode && !query.trim().slice(1) ? (
            <CommandGroup heading="Quick create">
              {PLUS_COMMAND_HINTS.map((hint) => (
                <CommandItem
                  key={hint.cmd}
                  value={`plus-${hint.cmd}`}
                  onSelect={() => setQuery(`${hint.cmd} `)}
                >
                  <Plus className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium font-mono">{hint.cmd}</span>
                    <span className="block text-xs text-muted">{hint.label}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!query.trim() && recentActions.length > 0 ? (
            <CommandGroup heading="Recent">
              {recentActions.map((action) => {
                const Icon = iconForAction(action);
                return (
                  <CommandItem
                    key={`recent-${action.id}`}
                    value={`recent-${action.id}`}
                    onSelect={() => void executeAction(action)}
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{action.label}</span>
                      <span className="block text-xs text-muted">
                        {action.description}
                      </span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          <CommandGroup
            heading={
              query.trim()
                ? slashMode
                  ? "Slash"
                  : plusMode
                    ? "Create"
                    : "Actions"
                : "Suggested for this page"
            }
          >
            {matchedActions.map((action) => {
              const Icon = iconForAction(action);
              return (
                <CommandItem
                  key={`action-${action.id}-${action.label}`}
                  value={`action-${action.id}-${action.label}`}
                  onSelect={() => void executeAction(action)}
                >
                  <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{action.label}</span>
                    <span className="block text-xs text-muted">
                      {action.description}
                    </span>
                  </span>
                  <CommandShortcut>
                    {action.slash
                      ? `/${action.slash}`
                      : action.kind === "external"
                        ? "Confirm"
                        : action.href ?? action.kind}
                  </CommandShortcut>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {results.length > 0 ? (
            <CommandGroup heading="Workspace search">
              {results.map((result) => {
                const Icon = iconForModule(result.module);
                return (
                  <CommandItem
                    key={`${result.module}-${result.id}`}
                    value={`search-${result.module}-${result.id}-${result.title}`}
                    onSelect={() =>
                      void executeAction({
                        id: `nav-result-${result.id}`,
                        kind: "navigate",
                        label: result.title,
                        description: result.subtitle,
                        confirmation: `Opening ${result.title}...`,
                        href: result.href,
                        keywords: [],
                      })
                    }
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{result.title}</span>
                      <span className="block truncate text-xs text-muted">
                        {result.subtitle}
                      </span>
                    </span>
                    <CommandShortcut>{result.module}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          {query.trim() && !detected && !slashMode && !plusMode ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="AI">
                <CommandItem
                  value={`ask-freeform-${query}`}
                  onSelect={() =>
                    void executeAction({
                      id: "ask-freeform",
                      kind: "ask",
                      label: "Ask Kairos",
                      description: query,
                      confirmation: "Opening Kairos...",
                      href: `/chat?prompt=${encodeURIComponent(query.trim())}`,
                      keywords: [],
                    })
                  }
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">Ask Kairos</span>
                    <span className="block truncate text-xs text-muted">
                      Send “{query.trim()}” to chat
                    </span>
                  </span>
                  <CommandShortcut>↵</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </>
          ) : null}
        </CommandList>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-2.5 text-[11px] text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px]">
              ↑↓
            </span>
            Navigate
            <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px]">
              ↵
            </span>
            Run
          </span>
          <span className="hidden sm:inline">
            {pending
              ? "Searching…"
              : "/customer · +deal · workflows · Advora"}
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

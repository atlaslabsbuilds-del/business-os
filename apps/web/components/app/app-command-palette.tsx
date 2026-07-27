"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  BarChart3,
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
import { globalSearchAction } from "../../app/(protected)/actions/platform";
import type { GlobalSearchResult } from "../../lib/global-search";
import {
  detectKairosIntent,
  KAIROS_ACTION_CATALOG,
  KAIROS_SUGGESTED_ACTIONS,
  matchKairosActions,
  type KairosAction,
} from "../../lib/kairos-actions";
import { useAppChrome } from "./app-chrome-provider";
import { KairosAvatar } from "../kairos/kairos-avatar";

const RECENT_KEY = "bos_kairos_actions_recent";

function iconForAction(action: KairosAction) {
  switch (action.id) {
    case "open-crm":
    case "create-deal":
    case "open-deals":
      return Briefcase;
    case "open-inbox":
    case "create-task":
      return Mail;
    case "open-customers":
    case "create-customer":
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
    default:
      if (action.kind === "search") return Search;
      if (action.kind === "create") return Plus;
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
      onClick={openCommand}
      className="bos-glass hidden min-w-[200px] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted transition hover:text-secondary sm:flex lg:min-w-[260px]"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="flex-1 truncate">Ask Kairos or run an action…</span>
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
    showActionStatus,
    openQuickCreate,
  } = useAppChrome();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecentIds(JSON.parse(raw) as string[]);
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
    if (!commandOpen) {
      setQuery("");
      setResults([]);
      setExecuting(false);
    }
  }, [commandOpen]);

  const runSearch = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }
    // Skip remote search while intent is clearly a navigation/create command
    const intent = detectKairosIntent(trimmed);
    if (
      intent &&
      (intent.kind === "navigate" ||
        intent.kind === "external" ||
        intent.kind === "create" ||
        intent.kind === "insight")
    ) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const response = await globalSearchAction({ query: trimmed, limit: 14 });
      if (response.ok) setResults(response.data.results);
      else setResults([]);
    });
  }, []);

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

  const executeAction = useCallback(
    async (action: KairosAction) => {
      if (executing) return;
      setExecuting(true);
      remember(action.id);

      // Search stays in-palette: confirm, then show live results.
      if (action.kind === "search" && action.searchQuery) {
        await showActionStatus(action.confirmation, 700);
        setQuery(action.searchQuery);
        startTransition(async () => {
          const response = await globalSearchAction({
            query: action.searchQuery!,
            limit: 16,
          });
          if (response.ok) setResults(response.data.results);
        });
        setExecuting(false);
        return;
      }

      closeCommand();
      await showActionStatus(
        action.confirmation,
        action.kind === "external" ? 1000 : 850,
      );

      if (action.kind === "external" && action.externalUrl) {
        window.location.assign(action.externalUrl);
        return;
      }

      if (action.kind === "create" && action.createEntity) {
        openQuickCreate(action.createEntity, action.draft ?? {});
        setExecuting(false);
        return;
      }

      if (action.href) {
        router.push(action.href);
      }
      setExecuting(false);
    },
    [
      closeCommand,
      executing,
      openQuickCreate,
      remember,
      router,
      showActionStatus,
    ],
  );

  const detected = useMemo(() => detectKairosIntent(query), [query]);
  const matchedActions = useMemo(() => matchKairosActions(query, 8), [query]);

  const recentActions = useMemo(
    () =>
      recentIds
        .map((id) => KAIROS_ACTION_CATALOG.find((action) => action.id === id))
        .filter(Boolean)
        .slice(0, 5) as KairosAction[],
    [recentIds],
  );

  const suggested = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return KAIROS_SUGGESTED_ACTIONS;
    return KAIROS_SUGGESTED_ACTIONS.filter((action) =>
      action.label.toLowerCase().includes(q),
    );
  }, [query]);

  function onOpenChange(open: boolean) {
    if (open) openCommand();
    else closeCommand();
  }

  return (
    <CommandDialog open={commandOpen} onOpenChange={onOpenChange} label="Kairos Actions">
      <Command shouldFilter={false} loop>
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <KairosAvatar size="xs" state={pending || executing ? "thinking" : "listening"} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Kairos Actions
            </p>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder='Try “Open CRM”, “Search Nike”, or “Create Deal”'
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
                  executeAction({
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
                    {detected.confirmation}
                  </span>
                </span>
                <CommandShortcut>{detected.kind}</CommandShortcut>
              </CommandItem>
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

          <CommandGroup heading={query.trim() ? "Actions" : "Suggested"}>
            {(query.trim() ? matchedActions : suggested).map((action) => {
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
                    {action.kind === "external"
                      ? "Advora"
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

          {query.trim() && !detected ? (
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

        <div className="flex items-center justify-between gap-3 border-t border-border/50 px-4 py-2.5 text-[11px] text-muted">
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
            {pending ? "Searching…" : "Navigate · Search · Create · Advora"}
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

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
  MessageSquare,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Terminal,
  Users,
  Megaphone,
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
import { KAIROS_COMMANDS } from "../../lib/kairos-commands";
import {
  KAIROS_NAV_TARGETS,
  matchNaturalLanguageNav,
  resolveAskKairosPrompt,
  resolveNaturalLanguageNav,
} from "../../lib/kairos-nl";
import { useAppChrome } from "./app-chrome-provider";
import { KairosAvatar } from "../kairos/kairos-avatar";

const RECENT_KEY = "bos_spotlight_recent";
const RECENT_NAV_KEY = "bos_spotlight_recent_nav";

const SUGGESTED = [
  { label: "Open Marketing", href: "/marketing", icon: Megaphone },
  { label: "Open Customers", href: "/customers", icon: Users },
  { label: "Open Inbox", href: "/inbox", icon: Mail },
  { label: "Open Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Ask Kairos", href: "/chat", icon: Sparkles },
  { label: "Command Center", href: "/ai", icon: Terminal },
];

const PINNED = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Briefcase },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Content OS", href: "/content", icon: PenLine },
  { label: "Settings", href: "/settings", icon: Settings },
];

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
    case "nav":
      return LayoutDashboard;
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
      <span className="flex-1 truncate">Ask Kairos or search…</span>
      <kbd className="rounded-md border border-border/60 bg-elevated/60 px-1.5 py-0.5 font-mono text-[10px] text-secondary">
        ⌘K
      </kbd>
    </button>
  );
}

export function AppCommandPalette() {
  const { commandOpen, closeCommand, toggleCommand, openCommand } = useAppChrome();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [recentCommandIds, setRecentCommandIds] = useState<string[]>([]);
  const [recentNavIds, setRecentNavIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const commands = window.localStorage.getItem(RECENT_KEY);
      const nav = window.localStorage.getItem(RECENT_NAV_KEY);
      if (commands) setRecentCommandIds(JSON.parse(commands) as string[]);
      if (nav) setRecentNavIds(JSON.parse(nav) as string[]);
    } catch {
      setRecentCommandIds([]);
      setRecentNavIds([]);
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
    }
  }, [commandOpen]);

  const runSearch = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
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
    const timer = window.setTimeout(() => runSearch(query), 160);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const rememberCommand = useCallback((commandId?: string) => {
    if (!commandId) return;
    setRecentCommandIds((current) => {
      const next = [commandId, ...current.filter((id) => id !== commandId)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const rememberNav = useCallback((navId?: string) => {
    if (!navId) return;
    setRecentNavIds((current) => {
      const next = [navId, ...current.filter((id) => id !== navId)].slice(0, 8);
      try {
        window.localStorage.setItem(RECENT_NAV_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const navigate = useCallback(
    (href: string, meta?: { commandId?: string; navId?: string }) => {
      rememberCommand(meta?.commandId);
      rememberNav(meta?.navId);
      closeCommand();
      router.push(href);
    },
    [closeCommand, rememberCommand, rememberNav, router],
  );

  const askKairos = useCallback(
    (prompt?: string) => {
      closeCommand();
      if (prompt?.trim()) {
        router.push(`/chat?prompt=${encodeURIComponent(prompt.trim())}`);
        return;
      }
      router.push("/chat");
    },
    [closeCommand, router],
  );

  const nlExact = useMemo(() => resolveNaturalLanguageNav(query), [query]);
  const nlMatches = useMemo(() => matchNaturalLanguageNav(query, 6), [query]);
  const askPrompt = useMemo(() => resolveAskKairosPrompt(query), [query]);

  const recentCommands = useMemo(
    () =>
      recentCommandIds
        .map((id) => KAIROS_COMMANDS.find((command) => command.id === id))
        .filter(Boolean)
        .slice(0, 4),
    [recentCommandIds],
  );

  const recentNav = useMemo(
    () =>
      recentNavIds
        .map((id) => KAIROS_NAV_TARGETS.find((target) => target.id === id))
        .filter(Boolean)
        .slice(0, 4),
    [recentNavIds],
  );

  const suggestedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTED;
    return SUGGESTED.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const pinnedFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PINNED;
    return PINNED.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  function onOpenChange(open: boolean) {
    if (open) openCommand();
    else closeCommand();
  }

  function runQueryAction() {
    if (nlExact) {
      navigate(nlExact.href, { navId: nlExact.id });
      return;
    }
    if (askPrompt) {
      askKairos(askPrompt);
      return;
    }
    if (query.trim()) {
      askKairos(query.trim());
    }
  }

  return (
    <CommandDialog open={commandOpen} onOpenChange={onOpenChange} label="Kairos Command Center">
      <Command
        shouldFilter={false}
        loop
        className="[&_[cmdk-group-heading]]:text-muted"
      >
        <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
          <KairosAvatar size="xs" state={pending ? "thinking" : "idle"} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              Kairos Command Center
            </p>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder='Try “Open Marketing” or ask Kairos anything…'
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
                onClick={() => askKairos(query)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-sm text-primary transition hover:bg-primary/25"
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Ask Kairos instead
              </button>
            </div>
          </CommandEmpty>

          {nlExact ? (
            <CommandGroup heading="Natural language">
              <CommandItem
                value={`nl-${nlExact.id}`}
                onSelect={() => navigate(nlExact.href, { navId: nlExact.id })}
              >
                <CornerDownLeft className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{nlExact.label}</span>
                  <span className="block text-xs text-muted">{nlExact.description}</span>
                </span>
                <CommandShortcut>{nlExact.href}</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {askPrompt ? (
            <CommandGroup heading="Ask Kairos">
              <CommandItem value="ask-prompt" onSelect={() => askKairos(askPrompt)}>
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">Ask Kairos</span>
                  <span className="block truncate text-xs text-muted">{askPrompt}</span>
                </span>
                <CommandShortcut>Chat</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {!query.trim() && (recentNav.length > 0 || recentCommands.length > 0) ? (
            <CommandGroup heading="Recent">
              {recentNav.map((target) => (
                <CommandItem
                  key={`recent-nav-${target!.id}`}
                  value={`recent-nav-${target!.id}`}
                  onSelect={() => navigate(target!.href, { navId: target!.id })}
                >
                  <Search className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{target!.label}</span>
                    <span className="block text-xs text-muted">{target!.href}</span>
                  </span>
                </CommandItem>
              ))}
              {recentCommands.map((command) => (
                <CommandItem
                  key={`recent-cmd-${command!.id}`}
                  value={`recent-cmd-${command!.id}`}
                  onSelect={() =>
                    navigate(command!.href, { commandId: command!.id })
                  }
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{command!.label}</span>
                    <span className="block text-xs text-muted">
                      {command!.description}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {!query.trim() || suggestedFiltered.length > 0 ? (
            <CommandGroup heading="Suggested">
              {suggestedFiltered.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={`suggested-${item.href}`}
                    value={`suggested-${item.label}`}
                    onSelect={() => navigate(item.href)}
                  >
                    <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                    <span className="font-medium">{item.label}</span>
                    <CommandShortcut>{item.href}</CommandShortcut>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          {query.trim() && nlMatches.length > 0 && !nlExact ? (
            <CommandGroup heading="Navigate">
              {nlMatches.map((target) => (
                <CommandItem
                  key={`nav-${target.id}`}
                  value={`nav-${target.id}-${target.label}`}
                  onSelect={() => navigate(target.href, { navId: target.id })}
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{target.label}</span>
                    <span className="block text-xs text-muted">{target.description}</span>
                  </span>
                  <CommandShortcut>{target.href}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {results.length > 0 ? (
            <CommandGroup heading="Workspace search">
              {results.map((result) => {
                const Icon = iconForModule(result.module);
                return (
                  <CommandItem
                    key={`${result.module}-${result.id}`}
                    value={`search-${result.module}-${result.id}-${result.title}`}
                    onSelect={() =>
                      navigate(result.href, {
                        commandId:
                          result.module === "command" ? result.id : undefined,
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

          {!query.trim() ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Pinned">
                {pinnedFiltered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={`pinned-${item.href}`}
                      value={`pinned-${item.label}`}
                      onSelect={() => navigate(item.href)}
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                      <span className="font-medium">{item.label}</span>
                      <CommandShortcut>{item.href}</CommandShortcut>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          ) : null}

          {query.trim() ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="AI">
                <CommandItem
                  value={`ask-freeform-${query}`}
                  onSelect={runQueryAction}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {nlExact ? nlExact.label : "Ask Kairos"}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {nlExact
                        ? `Navigate to ${nlExact.href}`
                        : `Send “${query.trim()}” to chat`}
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
            Open
          </span>
          <span className="hidden sm:inline">
            {pending ? "Searching…" : "Workspace · Kairos · Pages"}
          </span>
        </div>
      </Command>
    </CommandDialog>
  );
}

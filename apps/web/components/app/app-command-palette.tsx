"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  Briefcase,
  CalendarDays,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PenLine,
  Pin,
  Search,
  Settings,
  Sparkles,
  Terminal,
} from "lucide-react";
import { globalSearchAction } from "../../app/(protected)/actions/platform";
import type { GlobalSearchResult } from "../../lib/global-search";
import { KAIROS_COMMANDS } from "../../lib/kairos-commands";
import { useAppChrome } from "./app-chrome-provider";

const PINNED = [
  { label: "Ask Kairos", href: "/chat", icon: Sparkles },
  { label: "Command Center", href: "/ai", icon: Terminal },
  { label: "Agents", href: "/ai/agents", icon: Sparkles },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "CRM", href: "/crm", icon: Briefcase },
  { label: "Inbox", href: "/inbox", icon: Mail },
  { label: "Content OS", href: "/content", icon: PenLine },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

const RECENT_KEY = "bos_spotlight_recent";

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
      className="bos-glass hidden min-w-[200px] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted transition hover:text-secondary sm:flex lg:min-w-[240px]"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="flex-1">Search everything…</span>
      <kbd className="rounded-md border border-border/60 bg-elevated/60 px-1.5 py-0.5 font-mono text-[10px] text-secondary">
        ⌘K
      </kbd>
    </button>
  );
}

export function AppCommandPalette() {
  const { commandOpen, closeCommand, toggleCommand } = useAppChrome();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as string[]);
    } catch {
      setRecent([]);
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
      setActiveIndex(0);
    }
  }, [commandOpen]);

  useEffect(() => {
    if (!commandOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCommand();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [commandOpen, closeCommand]);

  const runSearch = useCallback((value: string) => {
    const trimmed = value.trim();
    if (trimmed.length < 1) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const response = await globalSearchAction({ query: trimmed, limit: 16 });
      if (response.ok) setResults(response.data.results);
      else setResults([]);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), 180);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const pinned = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PINNED;
    return PINNED.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const recentCommands = useMemo(
    () =>
      recent
        .map((id) => KAIROS_COMMANDS.find((command) => command.id === id))
        .filter(Boolean)
        .slice(0, 5),
    [recent],
  );

  const flatItems = useMemo(() => {
    if (results.length > 0) {
      return results.map((result) => ({
        key: `${result.module}-${result.id}`,
        label: result.title,
        subtitle: result.subtitle,
        href: result.href,
        module: result.module,
        commandId:
          result.module === "command" ? result.id : undefined,
      }));
    }
    return [
      ...recentCommands.map((command) => ({
        key: `recent-${command!.id}`,
        label: command!.label,
        subtitle: command!.description,
        href: command!.href,
        module: "command",
        commandId: command!.id,
      })),
      ...pinned.map((item) => ({
        key: item.href,
        label: item.label,
        subtitle: "Pinned",
        href: item.href,
        module: "nav",
        commandId: undefined as string | undefined,
      })),
    ];
  }, [results, pinned, recentCommands]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length]);

  const remember = useCallback((commandId?: string) => {
    if (!commandId) return;
    setRecent((current) => {
      const next = [commandId, ...current.filter((id) => id !== commandId)].slice(
        0,
        8,
      );
      try {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  }, []);

  function navigate(href: string, commandId?: string) {
    remember(commandId);
    closeCommand();
    router.push(href);
  }

  useEffect(() => {
    if (!commandOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((value) =>
          flatItems.length === 0 ? 0 : (value + 1) % flatItems.length,
        );
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((value) =>
          flatItems.length === 0
            ? 0
            : (value - 1 + flatItems.length) % flatItems.length,
        );
      }
      if (event.key === "Enter") {
        const item = flatItems[activeIndex];
        if (item) {
          event.preventDefault();
          remember(item.commandId);
          closeCommand();
          router.push(item.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, flatItems, activeIndex, closeCommand, router, remember]);

  return (
    <AnimatePresence>
      {commandOpen ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 px-4 pt-[10vh] backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCommand}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="bos-glass-strong bos-noise w-full max-w-2xl overflow-hidden rounded-[22px]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Global Spotlight"
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search CRM, emails, content, agents… or ask Kairos"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
                aria-label="Spotlight search"
              />
              {pending ? (
                <span className="text-[10px] text-muted">Searching…</span>
              ) : (
                <kbd className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted">
                  ESC
                </kbd>
              )}
            </div>
            <ul className="max-h-[420px] overflow-auto p-2">
              {results.length === 0 && recentCommands.length > 0 && !query ? (
                <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Recent
                </li>
              ) : null}
              {results.length > 0 ? (
                <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Instant results
                </li>
              ) : (
                <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Pin className="h-3 w-3" aria-hidden />
                    Pinned actions
                  </span>
                </li>
              )}
              {flatItems.map((item, index) => {
                const Icon = iconForModule(item.module);
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => navigate(item.href, item.commandId)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        index === activeIndex
                          ? "bg-primary/15 text-foreground"
                          : "hover:bg-elevated/70"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                        <span>
                          <span className="block font-medium">{item.label}</span>
                          <span className="block text-xs text-muted">
                            {item.subtitle}
                          </span>
                        </span>
                      </span>
                      <span className="text-[10px] uppercase text-muted">
                        {item.module}
                      </span>
                    </button>
                  </li>
                );
              })}
              {flatItems.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-secondary">
                  No matches. Try a command like “Show overdue deals”.
                </li>
              ) : null}
              <li className="mt-1 border-t border-border/50 px-3 py-2 text-[11px] text-muted">
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" aria-hidden />
                  Tip: type to search everything, or press Enter to run the
                  highlighted action.
                </span>
              </li>
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

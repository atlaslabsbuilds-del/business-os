"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Briefcase,
  LayoutDashboard,
  Mail,
  MessageSquare,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { globalSearchAction } from "../../app/(protected)/actions/platform";
import type { GlobalSearchResult } from "../../lib/global-search";
import { useAppChrome } from "./app-chrome-provider";

const QUICK_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: Sparkles },
  { label: "CRM", href: "/crm", icon: Briefcase },
  { label: "Inbox", href: "/inbox", icon: Mail },
  { label: "Content OS", href: "/content", icon: PenLine },
  { label: "Team", href: "/team", icon: Users },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function CommandPaletteTrigger() {
  const { openCommand } = useAppChrome();

  return (
    <button
      type="button"
      onClick={openCommand}
      className="bos-glass hidden min-w-[200px] items-center gap-2 rounded-xl px-3 py-2 text-left text-xs text-muted transition hover:text-secondary sm:flex lg:min-w-[240px]"
    >
      <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="flex-1">Search workspace…</span>
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
  const [pending, startTransition] = useTransition();

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
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const response = await globalSearchAction({ query: trimmed, limit: 12 });
      if (response.ok) setResults(response.data.results);
      else setResults([]);
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => runSearch(query), 220);
    return () => window.clearTimeout(timer);
  }, [query, runSearch]);

  const staticResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_LINKS;
    return QUICK_LINKS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  function navigate(href: string) {
    closeCommand();
    router.push(href);
  }

  return (
    <AnimatePresence>
      {commandOpen ? (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-md"
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
            className="bos-glass-strong bos-noise w-full max-w-xl overflow-hidden rounded-[20px]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search CRM, inbox, chat, or jump to a page…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
              {pending ? (
                <span className="text-[10px] text-muted">Searching…</span>
              ) : (
                <kbd className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted">
                  ESC
                </kbd>
              )}
            </div>
            <ul className="max-h-80 overflow-auto p-2">
              {results.length > 0 ? (
                <>
                  <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Results
                  </li>
                  {results.map((result) => (
                    <li key={`${result.module}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => navigate(result.href)}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-elevated/70"
                      >
                        <span className="flex items-center gap-2.5">
                          {result.module === "crm" ? (
                            <Briefcase className="h-3.5 w-3.5 text-primary" aria-hidden />
                          ) : result.module === "inbox" ? (
                            <Mail className="h-3.5 w-3.5 text-primary" aria-hidden />
                          ) : (
                            <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden />
                          )}
                          <span>
                            <span className="block font-medium">{result.title}</span>
                            <span className="block text-xs text-muted">{result.subtitle}</span>
                          </span>
                        </span>
                        <span className="text-[10px] uppercase text-muted">{result.module}</span>
                      </button>
                    </li>
                  ))}
                </>
              ) : null}
              <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Quick navigation
              </li>
              {staticResults.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => navigate(item.href)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition hover:bg-elevated/70"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

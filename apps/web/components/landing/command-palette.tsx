"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Calculator, Calendar, Play, Search, Sparkles } from "lucide-react";
import { useLandingInteractions } from "./landing-interactions";

const items = [
  { label: "Start Free", href: "/signup", group: "Actions", action: "start-free" as const },
  { label: "Book Demo", href: "#book-demo", group: "Actions", action: "book-demo" as const },
  { label: "Watch Live Demo", href: "#demo", group: "Actions", action: "demo" as const },
  { label: "ROI Calculator", href: "#roi", group: "Actions", action: "roi" as const },
  { label: "AI Credits Explainer", href: "#credits", group: "Actions", action: "credits" as const },
  { label: "Interactive Sandbox", href: "#sandbox", group: "Navigate", action: "link" as const },
  { label: "Pricing", href: "/pricing", group: "Navigate", action: "link" as const },
  { label: "Features", href: "#features", group: "Navigate", action: "link" as const },
  { label: "Integrations", href: "#integrations", group: "Navigate", action: "link" as const },
  { label: "Login", href: "/signin", group: "Account", action: "link" as const },
  { label: "Dashboard", href: "/dashboard", group: "Product", action: "link" as const },
  { label: "CRM", href: "/crm", group: "Product", action: "link" as const },
  { label: "Inbox", href: "/inbox", group: "Product", action: "link" as const },
  { label: "Ask Kairos", href: "#ai-assist", group: "Tools", action: "assistant" as const },
  { label: "Toggle Accent Theme", href: "#theme", group: "Easter egg", action: "theme" as const },
];

export function CommandPalette({
  onToggleTheme,
}: {
  onToggleTheme: () => void;
}) {
  const { overlay, closeOverlay, openOverlay, toggleAssistant, fireStartFreeConfetti } =
    useLandingInteractions();
  const open = overlay.id === "command-palette";
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  function runAction(action: (typeof items)[number]["action"], href: string) {
    closeOverlay();
    if (action === "demo") openOverlay("demo");
    else if (action === "book-demo") openOverlay("book-demo");
    else if (action === "roi") openOverlay("roi-calculator");
    else if (action === "credits") openOverlay("credits-explainer");
    else if (action === "assistant") toggleAssistant();
    else if (action === "theme") onToggleTheme();
    else if (action === "start-free") {
      fireStartFreeConfetti();
      window.location.assign("/signup");
    }
    else if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeOverlay}
        >
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="landing-glass-strong w-full max-w-xl overflow-hidden rounded-3xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
              <Search className="h-4 w-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages, actions, modules…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-muted sm:inline">
                ⌘K
              </kbd>
            </div>
            <ul className="max-h-80 overflow-auto p-2">
              {results.map((item) => (
                <li key={item.label}>
                  {item.action === "link" ? (
                    <Link
                      href={item.href}
                      onClick={() => closeOverlay()}
                      className="flex items-center justify-between rounded-2xl px-3 py-2.5 text-sm transition hover:bg-white/[0.04]"
                    >
                      <span>{item.label}</span>
                      <span className="text-[11px] text-muted">{item.group}</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => runAction(item.action, item.href)}
                      className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition hover:bg-white/[0.04]"
                    >
                      <span className="flex items-center gap-2">
                        {item.action === "assistant" || item.action === "credits" ? (
                          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                        ) : item.action === "demo" ? (
                          <Play className="h-3.5 w-3.5 text-primary" aria-hidden />
                        ) : item.action === "book-demo" ? (
                          <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden />
                        ) : item.action === "roi" ? (
                          <Calculator className="h-3.5 w-3.5 text-primary" aria-hidden />
                        ) : null}
                        {item.label}
                      </span>
                      <span className="text-[11px] text-muted">{item.group}</span>
                    </button>
                  )}
                </li>
              ))}
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>
              ) : null}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { useKonami } from "./command-palette-konami";

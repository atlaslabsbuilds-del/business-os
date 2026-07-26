"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Mail,
  PenLine,
  Plus,
  Sparkles,
  UserPlus,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { useAppChrome } from "./app-chrome-provider";

const ACTIONS = [
  { label: "New chat", href: "/chat", icon: Sparkles },
  { label: "Compose email", href: "/inbox", icon: Mail },
  { label: "Create content", href: "/content", icon: PenLine },
  { label: "Schedule meeting", href: "/calendar", icon: CalendarDays },
  { label: "Invite teammate", href: "/team", icon: UserPlus },
];

export function AppQuickActionsPanel() {
  const { quickActionsOpen, setQuickActionsOpen } = useAppChrome();

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="px-2.5"
        aria-label="Quick actions"
        onClick={() => setQuickActionsOpen(true)}
      >
        <Plus className="h-4 w-4" aria-hidden />
      </Button>

      <AnimatePresence>
        {quickActionsOpen ? (
          <motion.div
            className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setQuickActionsOpen(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 32 }}
              className="bos-glass-strong bos-noise absolute inset-y-0 right-0 flex w-[min(360px,100vw)] flex-col border-l border-border/60 shadow-elevated"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Quick actions"
            >
              <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="h-4 w-4 text-primary" aria-hidden />
                    Quick actions
                  </p>
                  <p className="text-xs text-muted">Jump into common workflows</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickActionsOpen(false)}
                  className="rounded-xl border border-border/60 p-2 text-muted hover:text-foreground"
                  aria-label="Close quick actions"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.href + action.label}
                      href={action.href}
                      onClick={() => setQuickActionsOpen(false)}
                      className="bos-float flex items-center gap-3 rounded-2xl border border-border/60 bg-elevated/40 px-4 py-3 transition hover:border-primary/30"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <span className="text-sm font-medium">{action.label}</span>
                    </Link>
                  );
                })}
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

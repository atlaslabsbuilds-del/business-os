"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  CalendarDays,
  Mail,
  PenLine,
  Plus,
  Sparkles,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { useAppChrome } from "./app-chrome-provider";
import type { KairosCreateEntity } from "../../lib/kairos-agent";

const CREATE_ACTIONS: {
  label: string;
  entity: KairosCreateEntity;
  hint: string;
  icon: typeof Users;
}[] = [
  { label: "Customer", entity: "customer", hint: "+customer", icon: Users },
  { label: "Deal", entity: "deal", hint: "+deal", icon: Briefcase },
  { label: "Task", entity: "task", hint: "+task", icon: Mail },
  { label: "Reminder", entity: "reminder", hint: "+reminder", icon: Bell },
];

const LINK_ACTIONS = [
  { label: "New chat", href: "/chat", icon: Sparkles },
  { label: "Compose email", href: "/inbox", icon: Mail },
  { label: "Create content", href: "/content", icon: PenLine },
  { label: "Schedule meeting", href: "/calendar", icon: CalendarDays },
  { label: "Invite teammate", href: "/team", icon: UserPlus },
];

export function AppQuickActionsPanel() {
  const {
    quickActionsOpen,
    setQuickActionsOpen,
    openQuickCreate,
    openCommand,
    showActionStatus,
  } = useAppChrome();

  async function create(entity: KairosCreateEntity, label: string) {
    setQuickActionsOpen(false);
    await showActionStatus(`Creating ${label.toLowerCase()}...`, 550);
    openQuickCreate(entity);
  }

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
                  <p className="text-xs text-muted">
                    +create with Kairos · or jump to a workflow
                  </p>
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

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Create with Kairos
                  </p>
                  <div className="space-y-2">
                    {CREATE_ACTIONS.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.entity}
                          type="button"
                          onClick={() => void create(action.entity, action.label)}
                          className="bos-float flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-elevated/40 px-4 py-3 text-left transition hover:border-primary/30"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-muted text-primary">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">
                              {action.label}
                            </span>
                            <span className="block font-mono text-[10px] text-muted">
                              {action.hint}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                    Jump to
                  </p>
                  <div className="space-y-2">
                    {LINK_ACTIONS.map((action) => {
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
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuickActionsOpen(false);
                    openCommand();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/15"
                >
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Open Kairos Actions
                  <kbd className="rounded border border-primary/30 px-1.5 py-0.5 font-mono text-[10px]">
                    ⌘K
                  </kbd>
                </button>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

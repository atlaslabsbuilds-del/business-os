"use client";

import { motion } from "framer-motion";
import { GripVertical, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@repo/ui/button";
import { Reveal } from "./atmosphere";
import { useLandingInteractions } from "./landing-interactions";

const SANDBOX_CARDS = [
  { id: "lead", label: "New lead", column: "inbox" as const },
  { id: "reply", label: "AI draft reply", column: "inbox" as const },
  { id: "deal", label: "Move to CRM", column: "crm" as const },
  { id: "meeting", label: "Book meeting", column: "calendar" as const },
];

const COLUMNS = [
  { id: "inbox" as const, title: "Inbox" },
  { id: "crm" as const, title: "CRM" },
  { id: "calendar" as const, title: "Calendar" },
];

export function InteractiveSandbox() {
  const [cards, setCards] = useState(SANDBOX_CARDS);
  const [dragging, setDragging] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  const { openOverlay } = useLandingInteractions();

  function moveCard(cardId: string, column: (typeof COLUMNS)[number]["id"]) {
    setCards((prev) => prev.map((card) => (card.id === cardId ? { ...card, column } : card)));
  }

  return (
    <section id="sandbox" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Interactive sandbox</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Drag a workflow. Feel the OS connect.
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            Move cards between modules to simulate how Business OS routes work—no signup required.
          </p>
        </Reveal>

        <Reveal delay={0.08} className="mt-10">
          <div className="landing-glass-strong landing-gradient-border rounded-[28px] p-5 sm:p-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((column) => (
                <div
                  key={column.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragging) moveCard(dragging, column.id);
                    setDragging(null);
                  }}
                  className="min-h-[220px] rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-3"
                >
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {column.title}
                  </p>
                  <div className="space-y-2">
                    {cards
                      .filter((card) => card.column === column.id)
                      .map((card) => (
                        <motion.div
                          key={card.id}
                          layout
                          draggable
                          onDragStart={() => setDragging(card.id)}
                          onDragEnd={() => setDragging(null)}
                          whileHover={{ scale: 1.02 }}
                          whileDrag={{ scale: 1.04, rotate: 1 }}
                          className="flex cursor-grab items-center gap-2 rounded-xl border border-white/10 bg-[#12121a] px-3 py-2.5 text-sm active:cursor-grabbing"
                        >
                          <GripVertical className="h-4 w-4 text-muted" aria-hidden />
                          {card.label}
                        </motion.div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted">Demo sandbox · drag cards between columns</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setCards(SANDBOX_CARDS);
                    setRan(false);
                  }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setRan(true);
                    setCards([
                      { id: "lead", label: "New lead", column: "crm" },
                      { id: "reply", label: "AI draft reply", column: "crm" },
                      { id: "deal", label: "Move to CRM", column: "calendar" },
                      { id: "meeting", label: "Book meeting", column: "calendar" },
                    ]);
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Run AI workflow
                </Button>
              </div>
            </div>
            {ran ? (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-secondary"
              >
                Demo: AI routed lead → CRM, drafted reply, and booked a follow-up on Calendar.
                <button
                  type="button"
                  onClick={() => openOverlay("demo")}
                  className="ml-2 font-medium text-primary underline-offset-2 hover:underline"
                >
                  Watch full demo
                </button>
              </motion.p>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

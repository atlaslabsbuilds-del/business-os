"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import { X } from "lucide-react";
import { useLandingInteractions } from "./landing-interactions";
import { ProductMockup } from "./product-mockup";

const scenes = [
  { id: "dashboard", title: "Dashboard", line: "Your entire business, one command center." },
  { id: "crm", title: "CRM", line: "Leads, deals, and pipeline move with context." },
  { id: "inbox", title: "Inbox", line: "AI summarizes threads and drafts replies." },
  { id: "content", title: "Content", line: "Ideas become publish-ready drafts." },
  { id: "social", title: "Social", line: "Channels stay scheduled and on-brand." },
  { id: "website", title: "Website", line: "Landing pages ship without leaving the workspace." },
  { id: "calendar", title: "Calendar", line: "Meetings sync, reminders stay ahead." },
  { id: "leads", title: "Lead Generation", line: "Capture, score, and route automatically." },
  { id: "finance", title: "Finance", line: "Revenue, invoices, and cash flow in one view." },
  { id: "analytics", title: "Analytics", line: "Trends surface before decisions wait." },
  { id: "ai", title: "AI Studio", line: "Agents plan, act, and report across modules." },
] as const;

export function LiveDemo() {
  const { overlay, closeOverlay } = useLandingInteractions();
  const open = overlay.id === "demo";
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const scene = scenes[index]!;
  const durationMs = 52000;

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setProgress(0);
    const started = performance.now();
    const sceneMs = durationMs / scenes.length;

    let frame = 0;
    const tick = () => {
      const elapsed = performance.now() - started;
      const nextIndex = Math.min(scenes.length - 1, Math.floor(elapsed / sceneMs));
      setIndex(nextIndex);
      setProgress(Math.min(1, elapsed / durationMs));
      if (elapsed < durationMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".live-demo-stage",
        { opacity: 0.7, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" },
      );
    });

    return () => {
      cancelAnimationFrame(frame);
      ctx.revert();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeOverlay();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, closeOverlay]);

  const caption = useMemo(() => scene.line, [scene.line]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050507]/92 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Live product demo"
        >
          <button
            type="button"
            onClick={closeOverlay}
            className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-secondary transition hover:text-foreground"
            aria-label="Close demo"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="live-demo-stage mx-auto w-full max-w-6xl">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  Live demo · {scene.title}
                </p>
                <h2 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight sm:text-4xl">
                  {caption}
                </h2>
              </div>
              <p className="text-xs text-muted">{Math.round(progress * 100)}%</p>
            </div>
            <div className="mb-5 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <ProductMockup module={scene.id} />
            <div className="mt-5 flex flex-wrap gap-2">
              {scenes.map((item, itemIndex) => (
                <span
                  key={item.id}
                  className={`rounded-full px-2.5 py-1 text-[11px] ${
                    itemIndex === index
                      ? "bg-primary text-white"
                      : itemIndex < index
                        ? "bg-white/10 text-secondary"
                        : "bg-white/[0.03] text-muted"
                  }`}
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

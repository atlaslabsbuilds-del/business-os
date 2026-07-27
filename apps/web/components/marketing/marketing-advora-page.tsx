"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  ExternalLink,
  LayoutTemplate,
  Megaphone,
  Palette,
  Radar,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@repo/ui/card";

const ADVORA_URL = "https://useadvora.com";

const FEATURES = [
  {
    title: "AI Ad Generator",
    description: "Create high-converting ads from a brief in seconds.",
    icon: Wand2,
  },
  {
    title: "Social Scheduler",
    description: "Plan, queue, and publish across every channel.",
    icon: Megaphone,
  },
  {
    title: "Competitor Analyzer",
    description: "See what rivals ship — and where you can win.",
    icon: Radar,
  },
  {
    title: "Landing Page Analyzer",
    description: "Score pages for clarity, conversion, and brand fit.",
    icon: LayoutTemplate,
  },
  {
    title: "Brand Kit",
    description: "Keep voice, colors, and assets consistent everywhere.",
    icon: Palette,
  },
  {
    title: "Campaign Analytics",
    description: "Track performance and optimize spend with Kairos.",
    icon: BarChart3,
  },
] as const;

export function MarketingAdvoraPage() {
  const [opening, setOpening] = useState(false);

  function openAdvora() {
    if (opening) return;
    setOpening(true);
    window.setTimeout(() => {
      window.location.assign(ADVORA_URL);
    }, 1000);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[24px] p-6 sm:p-8 pbos-animate-rise">
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,122,0,0.16),transparent_52%)]"
          aria-hidden
        />
        <div
          className="absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge variant="accent" className="gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden />
              Advora
            </Badge>
            <div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Marketing powered by{" "}
                <span className="bg-gradient-to-r from-primary via-[#FFB15C] to-primary bg-clip-text text-transparent">
                  Advora
                </span>
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-secondary sm:text-base">
                Advora is VanderBase&apos;s dedicated AI marketing platform.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2 self-start lg:self-auto"
            loading={opening}
            disabled={opening}
            onClick={openAdvora}
          >
            Open Advora
            <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="h-full transition hover:border-primary/35 hover:bg-elevated/50">
                <CardHeader className="mb-0">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-1.5 leading-6">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <AnimatePresence>
        {opening ? (
          <motion.div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 px-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="status"
            aria-live="polite"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              className="bos-glass-strong bos-noise w-full max-w-sm rounded-[22px] p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                <Sparkles className="h-5 w-5 animate-pulse" aria-hidden />
              </div>
              <p className="text-sm font-semibold tracking-tight text-white">
                Opening Advora...
              </p>
              <p className="mt-2 text-xs text-muted">Launching useadvora.com</p>
              <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-elevated">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

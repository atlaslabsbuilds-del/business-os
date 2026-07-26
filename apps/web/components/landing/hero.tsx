"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@repo/ui/button";
import { MagneticButton, Reveal } from "./atmosphere";
import { StartFreeLink } from "./ai-assistant-widget";
import { ProductMockup } from "./product-mockup";

export function LandingHero({
  onOpenDemo,
  onBookDemo,
}: {
  onOpenDemo: () => void;
  onBookDemo: () => void;
}) {
  return (
    <section className="relative px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-sm font-semibold tracking-[0.28em] text-primary"
          >
            BUSINESS OS
          </motion.p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Run Your Entire Business
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              With One AI Operating System.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            One workspace. One AI. One subscription. Everything your business needs.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <MagneticButton>
              <StartFreeLink>
                <Button size="lg" className="gap-2">
                  Start Free
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </StartFreeLink>
            </MagneticButton>
            <MagneticButton>
              <Button size="lg" variant="secondary" onClick={onBookDemo}>
                Book Demo
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button size="lg" variant="ghost" className="gap-2" onClick={onOpenDemo}>
                <Play className="h-4 w-4" aria-hidden />
                Watch Live Demo
              </Button>
            </MagneticButton>
          </div>
          <p className="mt-4 text-xs text-muted">
            Press <kbd className="rounded border border-white/10 px-1.5 py-0.5">⌘K</kbd> to explore
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-14 sm:mt-16">
          <ProductMockup />
        </Reveal>
      </div>
    </section>
  );
}

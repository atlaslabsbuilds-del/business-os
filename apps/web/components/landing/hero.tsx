"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@repo/ui/button";
import { MagneticButton, Reveal } from "./atmosphere";
import { JoinWaitlistButton } from "./ai-assistant-widget";
import { ProductMockup } from "./product-mockup";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function LandingHero({
  onOpenDemo,
  onBookDemo,
}: {
  onOpenDemo: () => void;
  onBookDemo: () => void;
}) {
  return (
    <section className="relative px-5 pb-20 pt-32 sm:px-8 sm:pb-24 sm:pt-36 lg:pt-44">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            {...fadeUp(0)}
            className="text-balance text-[2.75rem] font-extrabold leading-[1.02] tracking-[-0.025em] text-white sm:text-6xl lg:text-[4.75rem] xl:text-[5.25rem]"
          >
            <span className="block">The AI-Native</span>
            <span className="block">Business OS</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.1)}
            className="mt-5 sm:mt-6"
            aria-label="Powered by Kairos"
          >
            <motion.span
              animate={{ opacity: [0.86, 1, 0.86] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block bg-gradient-to-r from-primary via-[#FFB15C] to-primary bg-clip-text text-2xl font-semibold tracking-tight text-transparent sm:text-3xl lg:text-4xl [filter:drop-shadow(0_0_20px_rgba(255,122,0,0.16))]"
            >
              Powered by Kairos.
            </motion.span>
          </motion.p>

          <motion.p
            {...fadeUp(0.18)}
            className="mx-auto mt-8 max-w-[700px] text-pretty text-base leading-7 text-secondary sm:mt-10 sm:text-lg sm:leading-8"
          >
            One intelligent workspace to manage CRM, Marketing, AI Inbox, Analytics,
            Calendar and Automations — powered by one AI.
          </motion.p>

          <motion.div
            {...fadeUp(0.26)}
            className="mt-10 flex flex-wrap items-center justify-center gap-3.5 sm:mt-12 sm:gap-4"
          >
            <MagneticButton>
              <JoinWaitlistButton>
                <Button size="lg" className="gap-2">
                  Join the Waitlist
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </JoinWaitlistButton>
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
          </motion.div>

          <motion.p
            {...fadeUp(0.34)}
            className="mt-6 text-[11px] tracking-wide text-muted/75 sm:mt-7"
          >
            Press{" "}
            <kbd className="rounded border border-white/8 bg-white/[0.03] px-1 py-px text-[10px] font-medium text-muted">
              ⌘K
            </kbd>{" "}
            to explore
          </motion.p>
        </div>

        <Reveal delay={0.15} className="mt-16 sm:mt-20 lg:mt-24">
          <ProductMockup />
        </Reveal>
      </div>
    </section>
  );
}

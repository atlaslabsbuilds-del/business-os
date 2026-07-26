"use client";

import { useCallback, useState } from "react";
import { AnimatedGlobe } from "./animated-globe";
import { LandingAtmosphere, ScrollProgress } from "./atmosphere";
import { AiAssistantWidget } from "./ai-assistant-widget";
import { CommandPalette, useKonami } from "./command-palette";
import { ConfettiBurst } from "./confetti-burst";
import { LandingHero } from "./hero";
import { InteractiveSandbox } from "./interactive-sandbox";
import { LandingInteractionsProvider, useLandingInteractions } from "./landing-interactions";
import { LandingModals } from "./landing-modals";
import { LiveActivityFeed } from "./live-activity-feed";
import { LiveDemo } from "./live-demo";
import { LandingNavbar } from "./navbar";
import { ScrollCta } from "./scroll-cta";
import {
  AiCommandCenter,
  AiShowcase,
  FaqSection,
  FeatureGrid,
  FinalCta,
  Integrations,
  LandingFooter,
  OneBusinessOs,
  PricingSection,
  ProductTour,
  SocialProof,
  Testimonials,
  WorkflowAutomation,
} from "./sections";
import { TestimonialToasts } from "./testimonial-toasts";

function LandingPageContent() {
  const { openOverlay, toggleAssistant, confettiNonce } = useLandingInteractions();
  const [accent, setAccent] = useState<"default" | "ember">("default");

  const unlockAssistant = useCallback(() => toggleAssistant(), [toggleAssistant]);
  useKonami(unlockAssistant);

  return (
    <div className="landing-root" data-accent={accent}>
      <LandingAtmosphere />
      <AnimatedGlobe />
      <ScrollProgress />
      <LandingNavbar
        onOpenDemo={() => openOverlay("demo")}
        onBookDemo={() => openOverlay("book-demo")}
      />
      <main className="relative z-10">
        <LandingHero
          onOpenDemo={() => openOverlay("demo")}
          onBookDemo={() => openOverlay("book-demo")}
        />
        <SocialProof />
        <OneBusinessOs />
        <FeatureGrid />
        <AiCommandCenter />
        <WorkflowAutomation />
        <InteractiveSandbox />
        <ProductTour />
        <Integrations />
        <AiShowcase />
        <PricingSection />
        <Testimonials />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
      <LiveDemo />
      <LandingModals />
      <CommandPalette onToggleTheme={() => setAccent((value) => (value === "default" ? "ember" : "default"))} />
      <AiAssistantWidget />
      <ScrollCta />
      <TestimonialToasts />
      <LiveActivityFeed />
      <ConfettiBurst nonce={confettiNonce} />
      <p className="sr-only">
        Press Cmd+K or slash to open command palette. Enter the Konami code for a hidden assistant easter egg.
      </p>
    </div>
  );
}

export function LandingPage() {
  return (
    <LandingInteractionsProvider>
      <LandingPageContent />
    </LandingInteractionsProvider>
  );
}

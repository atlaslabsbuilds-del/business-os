"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Fragment, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Bot,
  Briefcase,
  CalendarDays,
  Check,
  ChevronDown,
  Globe,
  Mail,
  MessageSquare,
  PenLine,
  Share2,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";
import { Button } from "@repo/ui/button";
import { COMPARISON_ROWS, PRICING_PLANS } from "../../lib/pricing";
import { PlanCreditsBlock } from "../pricing/plan-credits-block";
import { KairosAvatar } from "../kairos/kairos-avatar";
import { StartFreeLink } from "./ai-assistant-widget";
import { Reveal } from "./atmosphere";
import { useLandingInteractions } from "./landing-interactions";
import { IntegrationsShowcase } from "./integrations-showcase";
import { ProductMockup } from "./product-mockup";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

const features = [
  { id: "crm", title: "CRM", body: "Contacts, deals, tags, and pipeline in one VanderBase-ready system.", icon: Briefcase },
  { id: "inbox", title: "AI Inbox", body: "Summaries, smart replies, and meeting detection that stay in context.", icon: Mail },
  { id: "chat", title: "AI Chat", body: "A workspace-aware assistant with tools, memory, and credits.", icon: MessageSquare },
  { id: "content", title: "Content OS", body: "Draft, plan, and publish from a single content system.", icon: PenLine },
  { id: "social", title: "Social OS", body: "Schedule and analyze across the channels that matter.", icon: Share2 },
  { id: "website", title: "Website Builder", body: "Landing pages, forms, and link surfaces without leaving the OS.", icon: Globe },
  { id: "calendar", title: "Calendar", body: "Availability, bookings, meetings, and reminders in sync.", icon: CalendarDays },
  { id: "leads", title: "Lead Generation", body: "Capture, score, enrich, and route leads into CRM.", icon: Star },
  { id: "finance", title: "Finance", body: "Revenue, invoices, and cash-flow visibility for operators.", icon: Wallet },
  { id: "analytics", title: "Analytics", body: "Cross-module KPIs, comparisons, and AI insights.", icon: BarChart3 },
  { id: "studio", title: "AI Studio", body: "Agents, workflows, prompts, and automations with approval gates.", icon: Bot },
];

const prompts = [
  "Plan product launch",
  "Generate LinkedIn content",
  "Summarize inbox",
  "Forecast revenue",
  "Create landing page",
  "Analyze pipeline",
];

const responses: Record<string, string> = {
  "Plan product launch": "Launch plan ready: positioning, content calendar, outreach sequence, and launch-day checklist across CRM, Content, and Social.",
  "Generate LinkedIn content": "Drafted a founder update with a hook, proof point, CTA, and suggested publish window for Thursday 9:15 AM.",
  "Summarize inbox": "12 threads reviewed. 3 need replies, 2 contain invoices, 1 meeting request was synced to Calendar.",
  "Forecast revenue": "Based on open pipeline and win rates, next 30 days projects $86k–$104k with two deals at risk.",
  "Create landing page": "Generated a Builder-ready landing outline: hero, proof, offer, form, FAQ, and CRM capture fields.",
  "Analyze pipeline": "Negotiation stage is congested. Recommend follow-ups on Acme and Northwind before Friday.",
};

const testimonials = [
  ["The first tool that feels like it understands the whole business.", "Maya Chen", "Founder, Northstar Studio"],
  ["Our team stopped asking where things live. It is all in the workspace.", "Rafael Ortiz", "COO, Signal Works"],
  ["The AI is useful because it has context—and because it can act.", "Aisha Patel", "Founder, Kindred Labs"],
  ["We replaced a stack of tools with one operating rhythm.", "Jonah Lee", "Agency Owner, Frame & Co"],
];

const faqs: [string, string][] = [
  ["What is VanderBase?", "VanderBase is one AI-native platform with CRM, Inbox, Content, Calendar, Analytics, and Kairos in the same workspace."],
  ["What can I do on the Free plan?", "Start with one workspace, 25 AI credits/month, and the essentials across CRM, Inbox, and Content OS."],
  ["How do AI credits work?", "Credits are shared across the workspace for AI features like chat, summaries, drafts, forecasting, and agents."],
  ["Can teams collaborate?", "Yes. Higher plans unlock team collaboration, roles, unlimited workspaces, and enterprise controls."],
  ["Do you support Stripe and Razorpay?", "The billing boundary is provider-ready for Stripe and Razorpay while staying workspace-aware."],
];

export function SocialProof() {
  const [users, setUsers] = useState(1200);
  const [gens, setGens] = useState(84000);
  const [content, setContent] = useState(12600);
  const [revenue, setRevenue] = useState(4.2);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setUsers((v) => v + 1);
      setGens((v) => v + 17);
      setContent((v) => v + 3);
      setRevenue((v) => Number((v + 0.01).toFixed(2)));
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted">
            Growing with founders worldwide
          </p>
          <div className="mt-8 overflow-hidden">
            <div className="landing-marquee-track flex gap-4">
              {[...Array(2)].flatMap((_, copy) =>
                ["Northstar", "Signal Works", "Kindred", "Frame & Co", "Orbit Labs", "Lumen Agency", "Harbor"].map(
                  (name) => (
                    <div
                      key={`${name}-${copy}`}
                      className="landing-glass flex h-14 min-w-36 items-center justify-center rounded-2xl px-5 text-sm text-secondary"
                    >
                      {name}
                    </div>
                  ),
                ),
              )}
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Counter label="Beta operators" value={`${users.toLocaleString()}+`} />
            <Counter label="AI generations" value={`${gens.toLocaleString()}+`} />
            <Counter label="Content created" value={`${content.toLocaleString()}+`} />
            <Counter label="Revenue managed" value={`$${revenue}M+`} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function OneBusinessOs() {
  const apps = ["CRM", "Calendar", "Email", "Finance", "Analytics", "Marketing", "Website", "Social", "AI"];
  return (
    <section className="relative px-5 py-20 sm:px-8" id="about">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">One VanderBase</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop stitching tools. Start running the company.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <Reveal>
            <div className="landing-glass rounded-3xl p-6">
              <p className="text-sm font-semibold text-secondary">Old way</p>
              <p className="mt-2 text-2xl font-semibold">10 different apps</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {apps.map((app, index) => (
                  <motion.span
                    key={app}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-secondary"
                  >
                    {app}
                  </motion.span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1} className="flex justify-center">
            <div className="flex flex-col items-center gap-2 text-primary">
              <ArrowDown className="h-5 w-5" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Becomes</span>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="landing-glass-strong landing-gradient-border rounded-3xl p-6">
              <p className="text-sm font-semibold text-primary">VanderBase</p>
              <div className="mt-5 space-y-3">
                {["One Login", "One Workspace", "One Subscription", "One AI"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.08 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3"
                  >
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-sm font-medium">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export function FeatureGrid() {
  const { openOverlay } = useLandingInteractions();
  return (
    <section id="features" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Feature grid</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Every system your business needs, already connected.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.id} delay={index * 0.03}>
                <motion.button
                  type="button"
                  whileHover={{ y: -4 }}
                  onClick={() =>
                    openOverlay("module-preview", {
                      id: feature.id,
                      title: feature.title,
                      body: feature.body,
                    })
                  }
                  className="landing-glass group w-full rounded-3xl p-5 text-left transition hover:border-primary/25"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-primary/15 p-2.5 text-primary">
                      <Icon className="h-5 w-5" aria-hidden />
                    </div>
                    <span className="text-xs text-primary opacity-0 transition group-hover:opacity-100">
                      Open preview →
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-secondary">{feature.body}</p>
                </motion.button>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function AiCommandCenter() {
  const [prompt, setPrompt] = useState(prompts[0]!);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    let i = 0;
    setTyped("");
    const response = responses[prompt] ?? "";
    const timer = window.setInterval(() => {
      i += 1;
      setTyped(response.slice(0, i));
      if (i >= response.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [prompt]);

  const kairosState =
    typed.length === 0
      ? "thinking"
      : typed.length < (responses[prompt] ?? "").length
        ? "speaking"
        : "idle";

  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Meet Kairos</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Ask once. Act across the business.
          </h2>
          <p className="mt-4 text-sm leading-6 text-secondary">
            Kairos is not a chatbot bolted on the side. Your AI Business Copilot has workspace memory, module tools, and the ability to move work forward.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {prompts.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className={`rounded-full px-3 py-1.5 text-xs transition ${
                  prompt === item ? "bg-primary text-white" : "landing-glass text-secondary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="landing-glass-strong landing-gradient-border rounded-[28px] p-5">
            <div className="flex items-center gap-3 text-sm font-medium">
              <KairosAvatar size="sm" state={kairosState} interactive aria-label="Kairos" />
              <span>Kairos · AI Business Copilot</span>
            </div>
            <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-sm text-foreground">
              {prompt}
            </div>
            <div className="mt-3 min-h-28 rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-secondary">
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function WorkflowStep({
  label,
  index,
  className = "",
}: {
  label: string;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      className={`landing-glass-strong rounded-2xl px-3 py-3 text-center text-xs font-semibold sm:text-sm ${className}`}
    >
      {label}
    </motion.div>
  );
}

function WorkflowConnector({
  index,
  direction = "horizontal",
}: {
  index: number;
  direction?: "horizontal" | "vertical";
}) {
  if (direction === "vertical") {
    return (
      <div className="flex h-7 flex-col items-center justify-center">
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.07 + 0.04, duration: 0.45 }}
          className="h-full w-px origin-top bg-gradient-to-b from-primary/40 via-primary to-accent/40"
        />
        <motion.span
          animate={{ y: [0, 3, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ repeat: Infinity, duration: 1.8, delay: index * 0.12 }}
          className="mt-0.5 text-primary"
          aria-hidden
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </motion.span>
      </div>
    );
  }

  return (
    <div className="relative flex min-w-[10px] flex-1 items-center">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.07 + 0.04, duration: 0.5 }}
        className="h-px w-full origin-left bg-gradient-to-r from-primary/35 via-primary to-accent/35"
      />
      <motion.span
        className="absolute -right-0.5"
        animate={{ x: [0, 3, 0], opacity: [0.45, 1, 0.45] }}
        transition={{ repeat: Infinity, duration: 1.6, delay: index * 0.1 }}
        aria-hidden
      >
        <ArrowRight className="h-3 w-3 text-primary" />
      </motion.span>
    </div>
  );
}

export function WorkflowAutomation() {
  const steps = ["Lead", "CRM", "Email", "Calendar", "Invoice", "Analytics", "AI Follow-up"];
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Workflow automation</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            From first lead to follow-up, without the handoff tax.
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-12">
          <div className="mx-auto hidden w-full items-center md:flex">
            {steps.map((step, index) => (
              <Fragment key={step}>
                <WorkflowStep label={step} index={index} className="shrink-0" />
                {index < steps.length - 1 ? <WorkflowConnector index={index} /> : null}
              </Fragment>
            ))}
          </div>
          <div className="mx-auto flex w-full max-w-xs flex-col items-stretch md:hidden">
            {steps.map((step, index) => (
              <Fragment key={step}>
                <WorkflowStep label={step} index={index} className="w-full" />
                {index < steps.length - 1 ? (
                  <WorkflowConnector index={index} direction="vertical" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function ProductTour() {
  const tabs = ["Dashboard", "CRM", "Inbox", "Content", "Social", "Website", "Calendar", "Finance", "Analytics", "AI Studio"];
  const [tab, setTab] = useState("Dashboard");
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Product tour</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Switch modules. Keep the same operating rhythm.
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="mt-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition ${
                  tab === item ? "bg-primary text-white" : "landing-glass text-secondary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <ProductMockup module={tab.toLowerCase()} />
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Integrations() {
  return <IntegrationsShowcase />;
}

export function AiShowcase() {
  const cards = [
    ["AI writing", "Draft posts, pages, and sequences in your brand voice."],
    ["AI replying", "Smart replies that understand thread and CRM context."],
    ["AI analyzing", "Surface pipeline risk, inbox priority, and growth signals."],
    ["AI forecasting", "Project revenue and capacity from live workspace data."],
    ["AI planning", "Turn goals into calendars, content, and follow-ups."],
    ["AI automations", "Agents that act across modules with approval controls."],
  ];
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">AI showcase</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Intelligence that writes, replies, analyzes, and ships.
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(([title, body], index) => (
            <Reveal key={title} delay={index * 0.04}>
              <motion.div
                whileHover={{ y: -4 }}
                className="landing-glass-strong rounded-3xl p-6"
              >
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const [cycle, setCycle] = useState<"monthly" | "annual">("annual");
  const { openOverlay } = useLandingInteractions();
  return (
    <section id="pricing" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            One subscription for the whole operating system.
          </h2>
          <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => openOverlay("credits-explainer")}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              How AI credits work
            </button>
            <span className="text-muted">·</span>
            <button
              type="button"
              onClick={() => openOverlay("roi-calculator")}
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              ROI calculator
            </button>
          </div>
          <div className="mx-auto mt-8 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`rounded-xl px-4 py-2 text-sm ${cycle === "monthly" ? "bg-elevated text-foreground" : "text-secondary"}`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("annual")}
              className={`rounded-xl px-4 py-2 text-sm ${cycle === "annual" ? "bg-primary text-white" : "text-secondary"}`}
            >
              Yearly · 20% off
            </button>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PRICING_PLANS.map((plan) => {
            const price =
              plan.monthly === null
                ? null
                : cycle === "annual" && plan.monthly > 0
                  ? Math.round(plan.monthly * 0.8)
                  : plan.monthly;
            return (
              <Reveal key={plan.id}>
                <div
                  className={`landing-glass relative flex h-full flex-col rounded-3xl p-5 ${
                    plan.popular
                      ? "landing-gradient-border border-primary/50 shadow-[0_0_40px_rgba(249,115,22,0.1)]"
                      : ""
                  }`}
                >
                  {plan.popular ? (
                    <span className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <Star className="h-3 w-3 fill-current" aria-hidden />
                      Most popular
                    </span>
                  ) : null}
                  <div className="flex flex-1 flex-col">
                    <p className="text-lg font-semibold">{plan.name}</p>
                    <p className="mt-1.5 text-xs leading-5 text-secondary">{plan.description}</p>
                    <div className="mt-5 flex items-baseline gap-1">
                      {price === null ? (
                        <span className="text-2xl font-semibold tracking-tight">Custom</span>
                      ) : (
                        <>
                          <span className="text-3xl font-semibold tracking-tight">${price}</span>
                          <span className="text-xs text-muted">/mo</span>
                        </>
                      )}
                    </div>
                    {cycle === "annual" && plan.monthly ? (
                      <p className="mt-1 text-[11px] text-muted">${plan.monthly}/mo billed annually</p>
                    ) : null}
                    <PlanCreditsBlock plan={plan} highlighted={plan.popular} />
                  </div>
                  {plan.id === "enterprise" ? (
                    <Link href="mailto:sales@vanderbase.example" className="mt-5 block">
                      <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
                        Contact sales
                      </Button>
                    </Link>
                  ) : (
                    <StartFreeLink href={`/signup?plan=${plan.id}&cycle=${cycle}`} className="mt-5 block">
                      <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
                        {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
                      </Button>
                    </StartFreeLink>
                  )}
                  <ul className="mt-5 space-y-2 border-t border-white/5 pt-5">
                    {plan.features.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex gap-2 text-xs leading-5 text-secondary">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
        <Reveal className="mt-10 overflow-x-auto rounded-3xl border border-white/10">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-secondary">
                <th className="p-4 font-medium">Capability</th>
                {PRICING_PLANS.map((plan) => (
                  <th key={plan.id} className="p-4 font-semibold text-foreground">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map(([label, ...values]) => (
                <tr key={label} className="border-b border-white/5 last:border-0">
                  <th className="p-4 font-medium text-foreground">{label}</th>
                  {values.map((value, index) => (
                    <td key={`${label}-${index}`} className="p-4 text-secondary">
                      {value ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Testimonials</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Beta feedback from operators shipping every week.
          </h2>
        </Reveal>
        <div className="mt-10 overflow-hidden">
          <div className="landing-marquee-track flex gap-4">
            {[...testimonials, ...testimonials].map(([quote, name, role], index) => (
              <div
                key={`${name}-${index}`}
                className="landing-glass w-[320px] shrink-0 rounded-3xl p-6 sm:w-[380px]"
              >
                <p className="text-sm leading-6 text-foreground">“{quote}”</p>
                <div className="mt-6 border-t border-white/5 pt-4">
                  <p className="text-xs font-semibold">{name}</p>
                  <p className="mt-1 text-xs text-muted">{role}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.16em] text-primary">
                    Video testimonial ready
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  return (
    <section id="docs" className="relative px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Clear answers before you commit.
          </h2>
        </Reveal>
        <div className="space-y-2">
          {faqs.map(([question, answer], index) => (
            <Reveal key={question} delay={index * 0.04}>
              <FaqItem question={question} answer={answer} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="landing-glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium"
      >
        <span>{question}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 pb-4 text-sm leading-6 text-secondary"
          >
            {answer}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function FinalCta() {
  const { openOverlay } = useLandingInteractions();
  return (
    <section className="relative px-5 py-20 sm:px-8">
      <Reveal>
        <div className="landing-glass-strong landing-gradient-border mx-auto max-w-5xl rounded-[32px] px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop Managing Tools.
            <span className="block text-primary">Start Running Your Business.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <StartFreeLink>
              <Button size="lg" className="gap-2">
                Start Free
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </StartFreeLink>
            <Button size="lg" variant="secondary" onClick={() => openOverlay("book-demo")}>
              Book Demo
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingFooter() {
  const columns = [
    {
      title: "Resources",
      links: [
        ["Pricing", "/pricing"],
        ["Docs", "#docs"],
        ["Roadmap", "#about"],
        ["Status", "#about"],
        ["Blog", "#blog"],
      ],
    },
    {
      title: "Company",
      links: [
        ["About", "#about"],
        ["Privacy", "#docs"],
        ["Terms", "#docs"],
      ],
    },
    {
      title: "Social",
      links: [
        ["Twitter", "https://x.com"],
        ["LinkedIn", "https://linkedin.com"],
        ["GitHub", "https://github.com"],
        ["Discord", "https://discord.com"],
      ],
    },
  ] as const;

  return (
    <footer id="blog" className="relative border-t border-white/5 px-5 py-16 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <VanderBaseLogo compact />
            <span className="text-sm font-semibold uppercase tracking-[0.18em]">
              <span className="text-white">VANDER</span>
              <span className="text-primary">BASE</span>
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-secondary">
            The AI-native operating system for founders, operators, and modern teams.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{column.title}</p>
            <ul className="mt-4 space-y-2">
              {column.links.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-secondary transition hover:text-foreground">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-xs text-muted">
        ©️ 2026 VanderBase. All rights reserved.
      </p>
    </footer>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="landing-glass rounded-3xl p-5 text-center">
      <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}

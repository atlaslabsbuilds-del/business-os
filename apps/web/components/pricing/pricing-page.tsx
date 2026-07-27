"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, CreditCard, Gauge, LockKeyhole, Sparkles, Star, Zap } from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMPARISON_ROWS, PRICING_PLANS, type PricingPlan } from "../../lib/pricing";
import { PlanCreditsBlock } from "./plan-credits-block";
import { VanderBaseLogo } from "../branding/vanderbase-logo";

type BillingCycle = "monthly" | "annual";

const faqs: [string, string][] = [
  ["Can I change plans later?", "Yes. Your workspace plan can be upgraded or downgraded as your needs change. Billing providers will prorate changes once connected."],
  ["What are AI credits?", "AI credits are the shared workspace allowance used by AI features across Inbox, CRM, Content, Social, Calendar, and AI Studio. Usage is visible from your workspace."],
  ["Do you support teams and multiple workspaces?", "Team and workspace limits depend on the plan. Elite includes up to 10 members and unlimited workspaces; Enterprise supports custom policies."],
  ["Are Stripe and Razorpay supported?", "The pricing and upgrade boundary is provider-neutral and ready for Stripe or Razorpay checkout, webhooks, invoices, and workspace entitlements."],
  ["Is there a free trial?", "The Free plan is available without a time limit. You can upgrade when you need more credits or capabilities."],
];

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  return (
    <div className="bos-atmosphere min-h-screen overflow-hidden">
      <PricingHeader />
      <main className="relative mx-auto max-w-7xl px-5 pb-24 pt-14 sm:px-8 lg:pt-20">
        <section className="mx-auto max-w-3xl text-center">
          <Badge variant="accent" className="gap-1.5"><Sparkles className="h-3 w-3" aria-hidden /> One workspace. Every growth system.</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">The operating system for <span className="text-primary">ambitious work.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">Bring your CRM, inbox, content, marketing, finances, and AI workflows into one calm, intelligent workspace.</p>
          <BillingToggle cycle={cycle} onChange={setCycle} />
        </section>
        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{PRICING_PLANS.map((plan) => <PricingCard key={plan.id} plan={plan} cycle={cycle} />)}</section>
        <div className="mx-auto mt-6 flex max-w-4xl items-center justify-center gap-6 text-xs text-muted"><span className="flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5 text-primary" aria-hidden /> Workspace-aware access</span><span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-primary" aria-hidden /> Secure billing-ready architecture</span><span className="hidden items-center gap-1.5 sm:flex"><Zap className="h-3.5 w-3.5 text-primary" aria-hidden /> Cancel anytime</span></div>
        <RoiSection />
        <section className="mt-24"><SectionIntro eyebrow="Compare plans" title="Choose the operating layer you need." body="Every plan keeps your work in one workspace. Move up when you need more AI capacity, automation, and collaboration." /><ComparisonTable cycle={cycle} /></section>
        <CreditsSection />
        <Testimonials />
        <section className="mt-24 grid gap-4 lg:grid-cols-[1fr_1.1fr]"><SectionIntro eyebrow="Questions" title="Clear answers before you commit." body="No hidden complexity. Just a workspace that grows with the way you work." /><div className="space-y-2">{faqs.map(([question,answer]) => <Faq key={question} question={question} answer={answer} />)}</div></section>
        <SalesCta />
      </main>
    </div>
  );
}

function PricingHeader() { return <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8"><Link href="/" className="flex items-center gap-2.5"><VanderBaseLogo compact priority /><span className="text-sm font-semibold uppercase tracking-[0.18em]"><span className="text-white">VANDER</span><span className="text-primary">BASE</span></span></Link><div className="flex items-center gap-2"><Link href="/signin"><Button size="sm" variant="ghost">Sign in</Button></Link><Link href="/signup"><Button size="sm">Get started</Button></Link></div></header>; }
function BillingToggle({ cycle, onChange }: { cycle: BillingCycle; onChange: (cycle: BillingCycle) => void }) { return <div className="mx-auto mt-9 inline-flex rounded-2xl border border-border bg-surface p-1 shadow-soft"><button type="button" onClick={() => onChange("monthly")} className={`rounded-xl px-4 py-2 text-sm transition ${cycle === "monthly" ? "bg-elevated text-foreground shadow-soft" : "text-secondary"}`}>Monthly</button><button type="button" onClick={() => onChange("annual")} className={`rounded-xl px-4 py-2 text-sm transition ${cycle === "annual" ? "bg-primary text-white shadow-soft" : "text-secondary"}`}>Annual <span className="ml-1 text-xs opacity-80">20% off</span></button></div>; }
function PricingCard({ plan, cycle }: { plan: PricingPlan; cycle: BillingCycle }) {
  const price =
    plan.monthly === null
      ? null
      : cycle === "annual" && plan.monthly > 0
        ? Math.round(plan.monthly * 0.8)
        : plan.monthly;

  return (
    <Card
      elevated={plan.popular}
      className={`relative flex h-full flex-col p-5 ${
        plan.popular ? "border-primary/70 shadow-[0_0_40px_rgba(249,115,22,0.12)]" : ""
      }`}
    >
      {plan.popular ? (
        <div className="absolute -top-3 left-5 flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
          <Star className="h-3 w-3 fill-current" aria-hidden />
          Most popular
        </div>
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
      <Link
        href={plan.id === "enterprise" ? "#contact-sales" : `/signup?plan=${plan.id}&cycle=${cycle}`}
        className="mt-5"
      >
        <Button variant={plan.popular ? "primary" : "secondary"} className="w-full">
          {plan.id === "enterprise"
            ? "Contact sales"
            : plan.id === "free"
              ? "Start free"
              : `Choose ${plan.name}`}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </Link>
      <ul className="mt-5 space-y-2.5 border-t border-border pt-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-xs leading-5 text-secondary">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>
    </Card>
  );
}
function SectionIntro({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) { return <div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-3 text-sm leading-6 text-secondary">{body}</p></div>; }
function RoiSection() { return <section className="mt-24 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]"><Card elevated className="relative overflow-hidden"><div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" /><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">ROI, without the spreadsheet theater</p><h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight">One intelligent workspace can replace a stack of disconnected tools.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-secondary">Spend less time moving context between inboxes, CRMs, calendars, and content tools—and more time turning attention into revenue.</p><Link href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">See your workspace in action <ArrowRight className="h-4 w-4" aria-hidden /></Link></Card><div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">{[["Context", "One shared memory across every module."], ["Leverage", "AI that can take the next step, not just answer."], ["Clarity", "A single view of the work that matters now."]].map(([title,body]) => <Card key={title}><Gauge className="h-5 w-5 text-primary" aria-hidden /><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-secondary">{body}</p></Card>)}</div></section>; }
function ComparisonTable({ cycle }: { cycle: BillingCycle }) { return <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface shadow-soft"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr className="border-b border-border text-secondary"><th className="p-4 font-medium">Capability</th>{PRICING_PLANS.map((plan) => <th key={plan.id} className={`p-4 font-semibold ${plan.popular ? "text-primary" : "text-foreground"}`}>{plan.name}<span className="mt-1 block font-normal text-muted">{plan.monthly === null ? "Custom" : `$${cycle === "annual" ? Math.round(plan.monthly * 0.8) : plan.monthly}/mo`}</span></th>)}</tr></thead><tbody>{COMPARISON_ROWS.map(([label, ...values]) => <tr key={label} className="border-b border-border last:border-0"><th className="p-4 font-medium text-foreground">{label}</th>{values.map((value, index) => { const displayValue = value ?? "—"; return <td key={`${label}-${index}`} className={`p-4 ${displayValue === "—" ? "text-muted" : "text-secondary"}`}>{displayValue}</td>; })}</tr>)}</tbody></table></div>; }
function CreditsSection() { return <section className="mt-24 grid gap-4 lg:grid-cols-2"><Card className="bg-primary text-white"><Sparkles className="h-6 w-6" aria-hidden /><h2 className="mt-5 text-3xl font-semibold tracking-tight">AI credits are shared across your workspace.</h2><p className="mt-4 text-sm leading-6 text-orange-100">Use credits wherever the work happens: summarize an email, qualify a lead, draft content, analyze revenue, or run an agent workflow.</p></Card><Card><p className="text-sm font-semibold">How credits work</p><div className="mt-5 space-y-4">{[["01", "One pool", "Credits belong to the workspace, not a single app."], ["02", "Visible usage", "See balance and transaction history from your workspace dashboard."], ["03", "Room to scale", "Upgrade for a larger monthly allowance or ask Enterprise for custom capacity."]].map(([number,title,body]) => <div key={number} className="flex gap-3"><span className="font-mono text-xs text-primary">{number}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-5 text-secondary">{body}</p></div></div>)}</div></Card></section>; }
function Testimonials() { return <section className="mt-24"><SectionIntro eyebrow="Built for momentum" title="A calmer way to run the business." body="The best operating systems reduce noise without reducing ambition." /><div className="mt-8 grid gap-4 md:grid-cols-3">{[["“The first tool that feels like it understands the whole business.”", "Maya Chen", "Founder, Northstar Studio"], ["“Our team stopped asking where things live. It is all in the workspace.”", "Rafael Ortiz", "COO, Signal Works"], ["“The AI is useful because it has context—and because it can act.”", "Aisha Patel", "Founder, Kindred Labs"]].map(([quote,name,role]) => <Card key={name}><p className="text-sm leading-6 text-foreground">{quote}</p><div className="mt-6 border-t border-border pt-4"><p className="text-xs font-semibold">{name}</p><p className="mt-1 text-xs text-muted">{role}</p></div></Card>)}</div></section>; }
function Faq({ question, answer }: { question: string; answer: string }) { const [open,setOpen]=useState(false); return <div className="rounded-2xl border border-border bg-surface"><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-4 text-left text-sm font-medium"><span>{question}</span><ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden /></button>{open ? <p className="px-4 pb-4 text-sm leading-6 text-secondary">{answer}</p> : null}</div>; }
function SalesCta() { return <section id="contact-sales" className="mt-24 overflow-hidden rounded-3xl border border-primary/30 bg-primary/10 p-8 text-center sm:p-14"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Ready when you are</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Give your business one intelligent home.</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-secondary">Start free today, or talk with us about a secure workspace built around your team.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Link href="/signup"><Button size="lg" className="gap-2">Start free <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link><a href="mailto:sales@vanderbase.example"><Button size="lg" variant="secondary">Contact sales</Button></a></div></section>; }

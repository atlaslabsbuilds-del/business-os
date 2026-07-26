"use client";

import { useState, useTransition } from "react";
import {
  Blocks,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  Link2,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type { WebsiteDashboardStats, WebsiteDomain, WebsiteForm, WebsiteLink, WebsitePage, WebsiteProject } from "@repo/types";
import { generateWebsiteAction } from "../../app/(protected)/actions/website";
import { TabNav } from "../app/tab-nav";
import { EmptyState, SectionShell } from "../dashboard/section-shell";

type Tab = "overview" | "builder" | "links" | "media" | "portfolio" | "forms" | "domains";
const templates = ["creator", "agency", "saas", "freelancer", "coach", "startup"];

export function WebsiteShell({
  stats,
  projects,
  pages,
  links,
  forms,
  domains,
}: {
  stats: WebsiteDashboardStats;
  projects: WebsiteProject[];
  pages: WebsitePage[];
  links: WebsiteLink[];
  forms: WebsiteForm[];
  domains: WebsiteDomain[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[24px] p-6 pbos-animate-rise">
        <header className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="accent" className="gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden /> Website & Landing Pages OS
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Make your best work easy to find.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Build a polished website, landing page, link in bio, media kit, or portfolio from one responsive workspace.
            </p>
          </div>
          <Button onClick={() => setTab("builder")} className="gap-2">
            <Sparkles className="h-4 w-4" aria-hidden /> Generate website
          </Button>
        </header>
      </div>
      <TabNav
        label="Website OS"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        items={[
          { id: "overview", label: "Dashboard" },
          { id: "builder", label: "AI Builder" },
          { id: "links", label: "Link in Bio" },
          { id: "media", label: "Media Kit" },
          { id: "portfolio", label: "Portfolio" },
          { id: "forms", label: "Forms" },
          { id: "domains", label: "Domains" },
        ]}
      />
      {tab === "overview" ? <Overview stats={stats} projects={projects} onTab={setTab} /> : null}
      {tab === "builder" ? <Builder onCreated={() => setTab("overview")} /> : null}
      {tab === "links" ? <Links links={links} /> : null}
      {tab === "media" ? <MediaKit /> : null}
      {tab === "portfolio" ? <Portfolio pages={pages} /> : null}
      {tab === "forms" ? <Forms forms={forms} /> : null}
      {tab === "domains" ? <Domains domains={domains} /> : null}
    </div>
  );
}

function Overview({ stats, projects, onTab }: { stats: WebsiteDashboardStats; projects: WebsiteProject[]; onTab: (tab: Tab) => void }) {
  const cards = [["Projects", stats.projects, Globe2], ["Published", stats.published, CheckCircle2], ["Pages", stats.pages, FileText], ["Link clicks", stats.clicks, Link2], ["Submissions", stats.submissions, Mail]] as const;
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,value,Icon]) => <Card key={label} className="transition hover:border-primary/40 hover:bg-elevated"><div className="flex justify-between"><p className="text-sm text-secondary">{label}</p><Icon className="h-4 w-4 text-primary" aria-hidden /></div><p className="mt-4 text-3xl font-semibold">{value}</p></Card>)}</div><div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><SectionShell title="Your sites" description="Websites, landing pages, portfolios, and media kits." actionLabel="AI Builder" actionHref="#"><div className="space-y-2">{projects.length === 0 ? <EmptyState title="No projects yet" body="Generate a site from a prompt and preview the blueprint." href="#" cta="Create your first site" /> : projects.slice(0,6).map((project) => <div key={project.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated p-3"><span className="min-w-0"><p className="truncate text-sm font-medium">{project.name}</p><p className="mt-1 text-xs capitalize text-muted">{project.projectType.replace("_"," ")} · {project.template}</p></span><Badge variant={project.status === "published" ? "success" : "default"}>{project.status}</Badge></div>)}</div></SectionShell><SectionShell title="Performance snapshot" description="Real project, link, and form activity." elevated><div className="grid grid-cols-2 gap-3"><Metric label="Views" value={stats.views} /><Metric label="Clicks" value={stats.clicks} /><Metric label="Submissions" value={stats.submissions} /><Metric label="Domains" value={stats.domains} /></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => onTab("links")} className="gap-1.5"><Link2 className="h-3.5 w-3.5" aria-hidden /> Manage links</Button><Button size="sm" variant="secondary" onClick={() => onTab("forms")}>Build a form</Button></div></SectionShell></div><div className="grid gap-4 lg:grid-cols-3"><SectionShell title="Live preview" description="Select a project to preview its responsive page."><div className="flex min-h-40 items-center justify-center rounded-2xl border border-border bg-elevated text-center text-sm text-muted"><Globe2 className="mr-2 h-5 w-5 text-primary" aria-hidden />Live preview is ready for your next project.</div></SectionShell><SectionShell title="Page blocks" description="Hero, features, testimonials, pricing, FAQ, and CTA blocks."><div className="flex flex-wrap gap-2">{["Hero","Features","Testimonials","Pricing","FAQ","CTA"].map((item) => <Badge key={item} variant="default">{item}</Badge>)}</div></SectionShell><SectionShell title="Templates" description="Start from a proven structure."><div className="flex flex-wrap gap-2">{templates.map((item) => <Badge key={item} variant="accent" className="capitalize">{item}</Badge>)}</div></SectionShell></div></div>;
}

function Builder({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState(""); const [prompt, setPrompt] = useState(""); const [type, setType] = useState("website"); const [template, setTemplate] = useState("creator"); const [preview, setPreview] = useState<{ headline?: string; description?: string; pages?: unknown[] } | null>(null); const [error, setError] = useState<string | null>(null); const [pending, startTransition] = useTransition();
  function generate() { startTransition(async () => { setError(null); const result = await generateWebsiteAction({ name, prompt, projectType: type, template }); if (!result.ok) setError(result.error); else setPreview(result.data.blueprint); }); }
  return <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><SectionShell title="AI Website Builder" description="Describe your business, audience, offer, and style. The AI creates a multi-page blueprint." elevated><div className="space-y-4"><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Project name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Morgan — Coach" className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Project type</span><select value={type} onChange={(e) => setType(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary">{["website","landing_page","link_in_bio","media_kit","portfolio"].map((item) => <option key={item} value={item}>{item.replace("_"," ")}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Template</span><select value={template} onChange={(e) => setTemplate(e.target.value)} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary">{templates.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Brief</span><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} placeholder="I help startup founders turn complex ideas into clear, high-converting positioning." className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" /></label><Button onClick={generate} loading={pending} disabled={!name.trim() || !prompt.trim()} className="w-full gap-2"><Sparkles className="h-4 w-4" aria-hidden /> Generate blueprint</Button>{error ? <p className="text-sm text-error">{error}</p> : null}</div></SectionShell><SectionShell title="Live preview" description="Review the generated structure before adding visual editor capabilities."><div className="min-h-[520px] rounded-2xl border border-border bg-elevated p-6">{preview ? <><Badge variant="accent">Generated preview</Badge><h2 className="mt-6 text-3xl font-semibold">{preview.headline}</h2><p className="mt-3 max-w-xl text-secondary">{preview.description}</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{preview.pages?.map((page, index) => <Card key={index}><p className="font-medium">{String((page as { title?: string }).title ?? `Page ${index + 1}`)}</p><p className="mt-1 text-xs text-muted">{Array.isArray((page as { blocks?: unknown[] }).blocks) ? `${(page as { blocks: unknown[] }).blocks.length} sections` : "Page blueprint"}</p></Card>)}</div><Button className="mt-6" onClick={onCreated}>View project</Button></> : <div className="flex min-h-[460px] items-center justify-center text-center text-sm text-muted"><Sparkles className="mr-2 h-5 w-5 text-primary" aria-hidden />Your multi-page preview will appear here.</div>}</div></SectionShell></div>;
}

function Links({ links }: { links: WebsiteLink[] }) { return <SectionShell title="Link in Bio" description="Multiple links, social icons, branding, and click analytics." elevated><div className="mb-4 flex justify-between"><Badge variant="accent">{links.length} links</Badge><Button size="sm" disabled><Plus className="mr-1 h-3.5 w-3.5" aria-hidden /> Add link</Button></div>{links.length === 0 ? <EmptyState title="No links yet" body="Create a link-in-bio project to organize your best destinations." /> : <div className="space-y-2">{links.map((link) => <div key={link.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3"><span><p className="font-medium">{link.label}</p><p className="text-xs text-muted">{link.url} · {link.clicks} clicks</p></span><Badge variant={link.active ? "success" : "default"}>{link.active ? "active" : "hidden"}</Badge></div>)}</div>}</SectionShell>; }
function MediaKit() { return <SectionShell title="Media Kit" description="About, statistics, collaborations, contact, and downloadable PDF." elevated><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{["About", "Statistics", "Collaborations", "Contact form"].map((item) => <Card key={item}><Image className="h-5 w-5 text-primary" aria-hidden /><p className="mt-3 font-medium">{item}</p><p className="mt-1 text-xs text-muted">Ready to configure</p></Card>)}</div><Button className="mt-4" disabled>Download PDF</Button></SectionShell>; }
function Portfolio({ pages }: { pages: WebsitePage[] }) { return <SectionShell title="Portfolio" description="Projects, case studies, galleries, services, and testimonials." elevated>{pages.length === 0 ? <EmptyState title="Your portfolio is waiting" body="Generate a portfolio project to showcase your work." /> : <div className="grid gap-3 sm:grid-cols-2">{pages.map((page) => <Card key={page.id}><Blocks className="h-5 w-5 text-primary" aria-hidden /><p className="mt-3 font-medium">{page.title}</p><p className="mt-1 text-xs text-muted">{page.blocks.length} content blocks</p></Card>)}</div>}</SectionShell>; }
function Forms({ forms }: { forms: WebsiteForm[] }) { return <SectionShell title="Forms" description="Contact, lead capture, and newsletter signup forms." elevated><div className="grid gap-3 sm:grid-cols-3">{["contact", "lead_capture", "newsletter"].map((type) => { const form = forms.find((item) => item.formType === type); return <Card key={type}><Mail className="h-5 w-5 text-primary" aria-hidden /><p className="mt-3 capitalize font-medium">{type.replace("_"," ")}</p><p className="mt-1 text-xs text-muted">{form ? `${form.submissions} submissions` : "Not configured"}</p><Button className="mt-4 w-full" size="sm" variant="secondary" disabled>{form ? "Manage" : "Create form"}</Button></Card>; })}</div></SectionShell>; }
function Domains({ domains }: { domains: WebsiteDomain[] }) { return <SectionShell title="Domains" description="Custom domains, SSL status, and DNS instructions." elevated>{domains.length === 0 ? <EmptyState title="No custom domain" body="Connect a domain after publishing your first site." /> : <div className="space-y-2">{domains.map((domain) => <div key={domain.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3"><span><p className="font-medium">{domain.domain}</p><p className="text-xs text-muted">SSL: {domain.sslStatus}</p></span><Badge variant={domain.status === "verified" ? "success" : "warning"}>{domain.status}</Badge></div>)}</div>}<p className="mt-4 flex items-center gap-2 text-xs text-muted"><ExternalLink className="h-3.5 w-3.5" aria-hidden /> DNS verification and SSL provider adapters are ready for integration.</p></SectionShell>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-elevated px-3 py-3"><p className="text-lg font-semibold">{value.toLocaleString()}</p><p className="text-xs text-muted">{label}</p></div>; }

"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarDays,
  FileText,
  Image,
  Library,
  PenLine,
  Plus,
  Save,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type {
  ContentAsset,
  ContentBrandVoice,
  ContentDashboardStats,
  ContentItem,
  ContentTemplate,
  ContentType,
} from "@repo/types";
import {
  createContentAction,
  generateContentAction,
  saveBrandVoiceAction,
} from "../../app/(protected)/actions/content";
import { formatRelative } from "../dashboard/format";
import { EmptyState, SectionShell } from "../dashboard/section-shell";

type Tab = "overview" | "generator" | "calendar" | "drafts" | "voice" | "library" | "templates";

const CONTENT_TYPES: Array<{ id: ContentType; label: string }> = [
  { id: "linkedin", label: "LinkedIn post" },
  { id: "instagram", label: "Instagram caption" },
  { id: "twitter", label: "X post" },
  { id: "threads", label: "Threads post" },
  { id: "blog", label: "Blog" },
  { id: "email", label: "Email" },
  { id: "carousel", label: "Carousel" },
];

export function ContentShell({
  stats,
  items,
  voice,
  assets,
  templates,
}: {
  stats: ContentDashboardStats;
  items: ContentItem[];
  voice: ContentBrandVoice | null;
  assets: ContentAsset[];
  templates: ContentTemplate[];
}) {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <Badge variant="accent" className="gap-1.5">
            <Sparkles className="h-3 w-3" aria-hidden />
            Content OS
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Content that sounds like you.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
            Plan, write, schedule, and learn from your content in one workspace.
            Your brand voice keeps every AI draft consistent.
          </p>
        </div>
        <Button className="gap-2" onClick={() => setTab("generator")}>
          <WandSparkles className="h-4 w-4" aria-hidden />
          Generate content
        </Button>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px" aria-label="Content OS">
        {[
          ["overview", "Dashboard"],
          ["generator", "AI Generator"],
          ["calendar", "Calendar"],
          ["drafts", "Drafts"],
          ["voice", "Brand voice"],
          ["library", "Library"],
          ["templates", "Templates"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as Tab)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition ${
              tab === id
                ? "border-primary text-foreground"
                : "border-transparent text-secondary hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? <Overview stats={stats} items={items} onTab={setTab} /> : null}
      {tab === "generator" ? <Generator voiceConfigured={Boolean(voice)} /> : null}
      {tab === "calendar" ? <Calendar items={items} /> : null}
      {tab === "drafts" ? <Drafts items={items} onTab={setTab} /> : null}
      {tab === "voice" ? <BrandVoice voice={voice} /> : null}
      {tab === "library" ? <LibraryPanel assets={assets} /> : null}
      {tab === "templates" ? <Templates templates={templates} /> : null}
    </div>
  );
}

function Overview({
  stats,
  items,
  onTab,
}: {
  stats: ContentDashboardStats;
  items: ContentItem[];
  onTab: (tab: Tab) => void;
}) {
  const cards = [
    ["Total posts", stats.total, FileText],
    ["Drafts", stats.drafts, PenLine],
    ["Scheduled", stats.scheduled, CalendarDays],
    ["Published", stats.published, Library],
    ["AI suggestions", stats.aiSuggestions, WandSparkles],
  ] as const;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="transition duration-200 hover:border-primary/40 hover:bg-elevated">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary">{label}</p>
              <Icon className="h-4 w-4 text-primary" aria-hidden />
            </div>
            <p className="mt-4 text-3xl font-semibold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionShell title="Content momentum" description="Performance data from published content.">
          {stats.total === 0 ? (
            <EmptyState title="Start with one idea" body="Generate your first post and build your content library." href="#" cta="Generate content" />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Views" value={stats.views} />
              <Metric label="Engagement" value={stats.engagement} />
              <Metric label="Reach" value={stats.reach} />
              <Metric label="Clicks" value={stats.clicks} />
            </div>
          )}
        </SectionShell>
        <SectionShell title="Latest drafts" description="Pick up where you left off." actionLabel="View all" actionHref="#">
          {items.filter((item) => item.status === "draft").slice(0, 3).length === 0 ? (
            <EmptyState title="No drafts yet" body="AI-generated and manually created drafts appear here." href="#" cta="Create a draft" />
          ) : (
            <ul className="space-y-2">
              {items.filter((item) => item.status === "draft").slice(0, 3).map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-elevated px-3 py-2.5">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">{item.contentType} · {formatRelative(item.updatedAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionShell>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => onTab("generator")} className="gap-1.5"><WandSparkles className="h-3.5 w-3.5" aria-hidden /> AI generate</Button>
        <Button size="sm" variant="secondary" onClick={() => onTab("calendar")} className="gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden /> Open calendar</Button>
        <Button size="sm" variant="ghost" onClick={() => onTab("voice")}>Configure brand voice</Button>
      </div>
    </div>
  );
}

function Generator({ voiceConfigured }: { voiceConfigured: boolean }) {
  const [contentType, setContentType] = useState<ContentType>("linkedin");
  const [prompt, setPrompt] = useState("");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      setError(null); setSuccess(null);
      const result = await generateContentAction({ contentType, prompt });
      if (!result.ok) { setError(result.error); return; }
      setContent(result.data.content);
      setSuccess("Draft generated. Edit it before saving.");
    });
  }

  function save() {
    startTransition(async () => {
      setError(null);
      const result = await createContentAction({
        title: title || `${CONTENT_TYPES.find((item) => item.id === contentType)?.label ?? "Content"} draft`,
        body: content,
        contentType,
        aiGenerated: true,
      });
      if (!result.ok) { setError(result.error); return; }
      setSuccess("Draft saved to Content OS.");
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <SectionShell title="AI Content Generator" description="Give the assistant a direction. Your brand voice will be applied automatically." elevated>
        <div className="space-y-4">
          {!voiceConfigured ? <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Configure Brand Voice for more consistent output.</div> : null}
          <label className="block space-y-1.5"><span className="text-xs font-medium uppercase tracking-wide text-muted">Format</span><select value={contentType} onChange={(event) => setContentType(event.target.value as ContentType)} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary">{CONTENT_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="block space-y-1.5"><span className="text-xs font-medium uppercase tracking-wide text-muted">Brief</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={8} placeholder="Example: Share three practical lessons from building a calm, sustainable business." className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" /></label>
          <Button onClick={generate} loading={pending} disabled={!prompt.trim()} className="w-full gap-2"><Sparkles className="h-4 w-4" aria-hidden /> Generate</Button>
        </div>
      </SectionShell>
      <SectionShell title="Draft preview" description="Edit the output before saving.">
        <div className="space-y-3">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Draft title" className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
          <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={16} placeholder="Your generated content will appear here." className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" />
          <div className="flex flex-wrap items-center gap-2"><Button onClick={save} loading={pending} disabled={!content.trim()} className="gap-1.5"><Save className="h-4 w-4" aria-hidden /> Save draft</Button>{success ? <span className="text-sm text-success">{success}</span> : null}{error ? <span className="text-sm text-error">{error}</span> : null}</div>
        </div>
      </SectionShell>
    </div>
  );
}

function Drafts({ items, onTab }: { items: ContentItem[]; onTab: (tab: Tab) => void }) {
  const drafts = items.filter((item) => item.status === "draft");
  return <SectionShell title="Drafts" description="Auto-saved workspace drafts. AI rewrite, expand, and shorten are available from the editor." actionLabel="AI Generator" actionHref="#"><div className="flex justify-end"><Button size="sm" onClick={() => onTab("generator")} className="gap-1.5"><Plus className="h-3.5 w-3.5" aria-hidden /> New draft</Button></div>{drafts.length === 0 ? <EmptyState title="Your draft desk is clear" body="Generate or create a draft to start writing." /> : <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{drafts.map((item) => <Card key={item.id} className="transition hover:border-primary/40"><p className="font-medium">{item.title}</p><p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-secondary">{item.body || "Empty draft"}</p><div className="mt-4 flex items-center justify-between text-xs text-muted"><span>{item.contentType}</span><span>{formatRelative(item.updatedAt)}</span></div></Card>)}</div>}</SectionShell>;
}

function Calendar({ items }: { items: ContentItem[] }) {
  const days = useMemo(() => Array.from({ length: 35 }, (_, index) => index - 2), []);
  const scheduled = items.filter((item) => item.status === "scheduled" && item.scheduledAt);
  return <SectionShell title="Content Calendar" description="Monthly planning view. Scheduling actions are persisted to Content OS." actionLabel="Drafts" actionHref="#"><div className="mb-4 flex flex-wrap gap-2"><Badge variant="accent">{scheduled.length} scheduled</Badge><Badge variant="default">Monthly view</Badge><Badge variant="default">All channels</Badge></div><div className="grid grid-cols-7 gap-1.5">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="px-2 py-1 text-center text-[11px] uppercase tracking-wide text-muted">{day}</div>)}{days.map((day, index) => { const date = new Date(); date.setDate(1); date.setDate(day + 1); const dateKey = date.toISOString().slice(0, 10); const dayItems = scheduled.filter((item) => item.scheduledAt?.slice(0, 10) === dateKey); return <div key={index} className={`min-h-24 rounded-xl border p-2 ${day < 1 || day > new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ? "border-transparent bg-background/40" : "border-border bg-elevated"}`}><p className="text-xs text-muted">{day > 0 ? day : ""}</p>{dayItems.map((item) => <div key={item.id} className="mt-1 truncate rounded-lg bg-primary-muted px-1.5 py-1 text-[11px] text-primary">{item.title}</div>)}</div>})}</div>{scheduled.length === 0 ? <div className="mt-4"><EmptyState title="No scheduled content" body="Create a draft and choose a publish time to fill your calendar." /></div> : null}</SectionShell>;
}

function BrandVoice({ voice }: { voice: ContentBrandVoice | null }) {
  const [form, setForm] = useState({
    tone: voice?.tone ?? "",
    writingStyle: voice?.writingStyle ?? "",
    ctaPreferences: voice?.ctaPreferences ?? "",
    keywords: voice?.keywords.join(", ") ?? "",
    audienceProfile: voice?.audienceProfile ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const fields: Array<{
    key: "tone" | "writingStyle" | "ctaPreferences" | "audienceProfile";
    label: string;
    placeholder: string;
    rows: number;
  }> = [
    { key: "tone", label: "Tone", placeholder: "Warm, direct, confident", rows: 3 },
    {
      key: "writingStyle",
      label: "Writing style",
      placeholder: "Short paragraphs, concrete examples",
      rows: 3,
    },
    {
      key: "ctaPreferences",
      label: "CTA preferences",
      placeholder: "Invite conversation, never pressure",
      rows: 3,
    },
    {
      key: "audienceProfile",
      label: "Audience profile",
      placeholder: "Who you help and what they care about",
      rows: 4,
    },
  ];

  function save() {
    startTransition(async () => {
      const result = await saveBrandVoiceAction({
        ...form,
        keywords: form.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setMessage(result.ok ? "Brand voice saved." : result.error);
    });
  }

  return (
    <SectionShell
      title="Brand Voice"
      description="The shared writing context used by every Content OS AI generation."
      elevated
    >
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              {field.label}
            </span>
            <textarea
              value={form[field.key]}
              onChange={(event) =>
                setForm({ ...form, [field.key]: event.target.value })
              }
              rows={field.rows}
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary"
            />
          </label>
        ))}
        <label className="block space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Keywords
          </span>
          <input
            value={form.keywords}
            onChange={(event) => setForm({ ...form, keywords: event.target.value })}
            placeholder="calm growth, leverage, clarity"
            className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary"
          />
        </label>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} loading={pending} className="gap-1.5">
          <Save className="h-4 w-4" aria-hidden />
          Save voice
        </Button>
        {message ? <span className="text-sm text-success">{message}</span> : null}
      </div>
    </SectionShell>
  );
}

function LibraryPanel({ assets }: { assets: ContentAsset[] }) {
  return <SectionShell title="Content Library" description="Images, videos, documents, and AI-generated assets for your workspace." actionLabel="Templates" actionHref="#"><div className="mb-4 flex gap-2"><Badge variant="default">{assets.length} assets</Badge><Badge variant="default">All types</Badge></div>{assets.length === 0 ? <EmptyState title="Your library is empty" body="Uploaded and AI-generated assets will appear here." /> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{assets.map((asset) => <Card key={asset.id}><Image className="h-5 w-5 text-primary" aria-hidden /><p className="mt-3 truncate text-sm font-medium">{asset.name}</p><p className="mt-1 text-xs capitalize text-muted">{asset.assetType}</p></Card>)}</div>}</SectionShell>;
}

function Templates({ templates }: { templates: ContentTemplate[] }) {
  return <SectionShell title="Templates" description="Reusable hooks, CTAs, and channel-specific formats." actionLabel="AI Generator" actionHref="#"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{templates.length === 0 ? <div className="sm:col-span-2 lg:col-span-3"><EmptyState title="No templates yet" body="Your saved templates will appear here." /></div> : templates.map((template) => <Card key={template.id} className="transition hover:border-primary/40"><div className="flex items-center justify-between gap-2"><p className="font-medium">{template.name}</p><Badge variant={template.isSystem ? "accent" : "default"}>{template.templateType}</Badge></div><p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm text-secondary">{template.body}</p></Card>)}</div></SectionShell>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-elevated px-3 py-3"><p className="text-lg font-semibold">{value.toLocaleString()}</p><p className="text-xs text-muted">{label}</p></div>;
}

"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Link2,
  MessageCircle,
  Plus,
  RotateCcw,
  Send,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type {
  SocialAccount,
  SocialDashboardStats,
  SocialEngagement,
  SocialPlatform,
  SocialPost,
} from "@repo/types";
import {
  createSocialPostAction,
  generateSocialAction,
} from "../../app/(protected)/actions/social";
import { formatDateTime, formatRelative } from "../dashboard/format";
import { TabNav } from "../app/tab-nav";
import { EmptyState, SectionShell } from "../dashboard/section-shell";

type Tab = "overview" | "accounts" | "composer" | "queue" | "engagement" | "analytics" | "team";
const platforms: Array<{ id: SocialPlatform; label: string }> = [
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
];

export function SocialShell({
  stats,
  accounts,
  posts,
  engagement,
}: {
  stats: SocialDashboardStats;
  accounts: SocialAccount[];
  posts: SocialPost[];
  engagement: SocialEngagement[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[24px] p-6 pbos-animate-rise">
        <header className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="accent" className="gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden /> Social Media OS
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your voice, everywhere.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              Connect your channels, turn ideas into posts, and keep your publishing queue moving.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setTab("composer")}>
            <Plus className="h-4 w-4" aria-hidden /> Create post
          </Button>
        </header>
      </div>
      <TabNav
        label="Social Media OS"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        items={[
          { id: "overview", label: "Dashboard" },
          { id: "accounts", label: "Accounts" },
          { id: "composer", label: "Create post" },
          { id: "queue", label: "Queue & Calendar" },
          { id: "engagement", label: "Engagement" },
          { id: "analytics", label: "Analytics" },
          { id: "team", label: "Team" },
        ]}
      />
      {tab === "overview" ? <Overview stats={stats} posts={posts} engagement={engagement} onTab={setTab} /> : null}
      {tab === "accounts" ? <Accounts accounts={accounts} /> : null}
      {tab === "composer" ? <Composer onSaved={() => setTab("queue")} /> : null}
      {tab === "queue" ? <Queue posts={posts} /> : null}
      {tab === "engagement" ? <Engagement items={engagement} /> : null}
      {tab === "analytics" ? <Analytics stats={stats} posts={posts} /> : null}
      {tab === "team" ? <Team posts={posts} /> : null}
    </div>
  );
}

function Overview({ stats, posts, engagement, onTab }: { stats: SocialDashboardStats; posts: SocialPost[]; engagement: SocialEngagement[]; onTab: (tab: Tab) => void }) {
  const cards = [
    ["Connected accounts", `${stats.connectedAccounts}/${stats.accounts}`, Link2],
    ["Total posts", stats.totalPosts, Send],
    ["Scheduled", stats.scheduled, CalendarDays],
    ["Published", stats.published, CheckCircle2],
    ["Open engagement", stats.openEngagement, MessageCircle],
  ] as const;
  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label, value, Icon]) => <Card key={label} className="transition hover:border-primary/40 hover:bg-elevated"><div className="flex items-center justify-between"><p className="text-sm text-secondary">{label}</p><Icon className="h-4 w-4 text-primary" aria-hidden /></div><p className="mt-4 text-3xl font-semibold">{value}</p></Card>)}</div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <SectionShell title="Publishing queue" description="Upcoming, failed, and published posts." actionHref="#" actionLabel="Open queue"><QueueList posts={posts} /></SectionShell>
      <SectionShell title="Engagement hub" description="Comments and mentions waiting for a response." actionHref="#" actionLabel="Open hub"><EngagementList items={engagement.slice(0, 4)} /></SectionShell>
    </div>
    <div className="grid gap-4 lg:grid-cols-3">
      <SectionShell title="AI assistant" description="Generate captions, hashtags, rewrites, or repurpose content." elevated><div className="space-y-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-muted text-primary"><WandSparkles className="h-6 w-6" aria-hidden /></div><p className="text-sm text-secondary">Use your Content OS voice and a platform-specific prompt to draft your next post.</p><Button size="sm" onClick={() => onTab("composer")} className="gap-1.5">Open AI composer</Button></div></SectionShell>
      <SectionShell title="Analytics preview" description="Latest available performance signals." actionHref="#" actionLabel="View analytics"><AnalyticsStats stats={stats} /></SectionShell>
      <SectionShell title="Team collaboration" description="Approvals and assignments stay with every post." actionHref="#" actionLabel="Manage team"><div className="space-y-3"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-primary" aria-hidden /><span className="text-sm text-secondary">{posts.filter((post) => post.assignedTo).length} assigned posts</span></div><div className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-primary" aria-hidden /><span className="text-sm text-secondary">{posts.filter((post) => post.approvalStatus === "pending").length} approvals pending</span></div></div></SectionShell>
    </div>
  </div>;
}

function Accounts({ accounts }: { accounts: SocialAccount[] }) {
  return <SectionShell title="Connected Accounts" description="Provider-neutral account records are ready for OAuth adapters." elevated><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{platforms.map((platform) => { const account = accounts.find((item) => item.platform === platform.id); return <Card key={platform.id} className="transition hover:border-primary/40"><div className="flex items-center justify-between"><p className="font-medium">{platform.label}</p><Badge variant={account?.status === "connected" ? "success" : "default"}>{account?.status ?? "disconnected"}</Badge></div><p className="mt-3 text-sm text-secondary">{account ? account.handle : "No account connected"}</p><Button size="sm" variant="secondary" className="mt-4 w-full" disabled>{account ? "Manage account" : "Connect soon"}</Button></Card>; })}</div><p className="mt-4 text-xs text-muted">OAuth publishing adapters can be added per provider without changing post, queue, or analytics contracts.</p></SectionShell>;
}

function Composer({ onSaved }: { onSaved: () => void }) {
  const [platform, setPlatform] = useState<SocialPlatform>("linkedin");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [schedule, setSchedule] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function generate() { startTransition(async () => { setError(null); const result = await generateSocialAction({ platform, prompt }); if (!result.ok) setError(result.error); else { setBody(result.data.content); setMessage("AI draft ready. Edit before saving."); } }); }
  function save(status: "draft" | "scheduled") { startTransition(async () => { setError(null); const result = await createSocialPostAction({ title: title || `${platform} post`, body, platforms: [platform], status, scheduledAt: status === "scheduled" && schedule ? new Date(schedule).toISOString() : null }); if (!result.ok) setError(result.error); else { setMessage(status === "scheduled" ? "Post scheduled." : "Draft saved."); if (status === "scheduled") onSaved(); } }); }
  return <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><SectionShell title="Kairos" description="Your AI copilot for captions, hashtags, rewrites, and repurposed posts." elevated><div className="space-y-4"><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Platform</span><select value={platform} onChange={(event) => setPlatform(event.target.value as SocialPlatform)} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary">{platforms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Brief</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={9} placeholder="Share an idea, source content, or goal for this post." className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" /></label><Button onClick={generate} loading={pending} disabled={!prompt.trim()} className="w-full gap-1.5"><Sparkles className="h-4 w-4" aria-hidden /> Generate with Kairos</Button></div></SectionShell><SectionShell title="Post editor" description="Edit, save as draft, or schedule."><div className="space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Post title" className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={14} placeholder="Generated copy will appear here." className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted focus:ring-2 focus:ring-primary" /><label className="block space-y-1.5"><span className="text-xs uppercase tracking-wide text-muted">Schedule time</span><input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /></label><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => save("draft")} loading={pending} disabled={!body.trim()}>Save draft</Button><Button size="sm" onClick={() => save("scheduled")} loading={pending} disabled={!body.trim() || !schedule} className="gap-1.5"><CalendarDays className="h-4 w-4" aria-hidden /> Schedule</Button></div>{message ? <p className="text-sm text-success">{message}</p> : null}{error ? <p className="text-sm text-error">{error}</p> : null}</div></SectionShell></div>;
}

function Queue({ posts }: { posts: SocialPost[] }) {
  return <SectionShell title="Content Queue" description="Upcoming, failed, draft, and published social posts." actionHref="#" actionLabel="Create post"><div className="mb-4 flex flex-wrap gap-2"><Badge variant="accent">{posts.filter((post) => post.status === "scheduled").length} scheduled</Badge><Badge variant="warning">{posts.filter((post) => post.status === "failed").length} failed</Badge><Badge variant="success">{posts.filter((post) => post.status === "published").length} published</Badge></div><QueueList posts={posts} /></SectionShell>;
}

function QueueList({ posts }: { posts: SocialPost[] }) {
  if (posts.length === 0) return <EmptyState title="Your queue is empty" body="Create a post to start building your publishing rhythm." />;
  return <ul className="space-y-2">{posts.slice(0, 8).map((post) => <li key={post.id} className="flex items-start gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">{post.status === "published" ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : post.status === "failed" ? <RotateCcw className="h-4 w-4" aria-hidden /> : <Clock3 className="h-4 w-4" aria-hidden />}</span><span className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{post.title}</p><p className="mt-1 line-clamp-2 text-xs text-secondary">{post.body || "Empty post"}</p><p className="mt-1 text-[11px] capitalize text-muted">{post.platforms.join(", ")} · {post.scheduledAt ? formatDateTime(post.scheduledAt) : post.status}</p></span><Badge variant={post.status === "failed" ? "warning" : post.status === "published" ? "success" : "default"}>{post.status}</Badge></li>)}</ul>;
}

function Engagement({ items }: { items: SocialEngagement[] }) {
  return <SectionShell title="Engagement Hub" description="Comments, mentions, and future-ready messages with reply suggestions." actionHref="#" actionLabel="Refresh"><EngagementList items={items} /></SectionShell>;
}

function EngagementList({ items }: { items: SocialEngagement[] }) {
  if (items.length === 0) return <EmptyState title="No engagement waiting" body="Provider engagement adapters will populate comments and mentions here." />;
  return <ul className="space-y-2">{items.map((item) => <li key={item.id} className="rounded-xl border border-border bg-elevated p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium">{item.authorName ?? "Community member"}</p><Badge variant="accent">{item.engagementType}</Badge></div><p className="mt-2 text-sm text-secondary">{item.body}</p>{item.replySuggestion ? <p className="mt-2 rounded-lg bg-surface p-2 text-xs text-primary">Suggested reply: {item.replySuggestion}</p> : null}<p className="mt-2 text-[11px] text-muted">{formatRelative(item.createdAt)}</p></li>)}</ul>;
}

function Analytics({ stats, posts }: { stats: SocialDashboardStats; posts: SocialPost[] }) {
  return <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]"><SectionShell title="Analytics" description="Provider analytics snapshots will aggregate here." elevated><AnalyticsStats stats={stats} /></SectionShell><SectionShell title="Top performing posts" description="Published posts ranked by available reach and engagement."><div className="space-y-2">{posts.filter((post) => post.status === "published").sort((a, b) => b.analytics.reach - a.analytics.reach).slice(0, 8).map((post) => <div key={post.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated px-3 py-2.5"><span className="min-w-0"><p className="truncate text-sm font-medium">{post.title}</p><p className="text-xs text-muted">{post.platforms.join(", ")} · {post.analytics.engagementRate}% engagement</p></span><span className="text-sm font-medium text-primary">{post.analytics.reach.toLocaleString()} reach</span></div>)}{posts.filter((post) => post.status === "published").length === 0 ? <EmptyState title="No published posts yet" body="Publish content to start collecting analytics." /> : null}</div></SectionShell></div>;
}

function AnalyticsStats({ stats }: { stats: SocialDashboardStats }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Followers" value={stats.followers} /><Metric label="Reach" value={stats.reach} /><Metric label="Impressions" value={stats.impressions} /><Metric label="Engagement rate" value={stats.engagementRate} suffix="%" /><Metric label="Clicks" value={stats.clicks} /><Metric label="Failed posts" value={stats.failed} /></div>;
}

function Team({ posts }: { posts: SocialPost[] }) {
  return <SectionShell title="Team Collaboration" description="Assignments, approvals, notes, and activity are attached to every post." elevated><div className="grid gap-3 sm:grid-cols-3"><Metric label="Assigned posts" value={posts.filter((post) => post.assignedTo).length} /><Metric label="Pending approvals" value={posts.filter((post) => post.approvalStatus === "pending").length} /><Metric label="Rejected posts" value={posts.filter((post) => post.approvalStatus === "rejected").length} /></div><div className="mt-4 rounded-xl border border-dashed border-border bg-elevated p-4 text-sm text-secondary">Team assignment and approval actions are ready in the post contract. Connect workspace members to enable the collaboration workflow.</div></SectionShell>;
}

function Metric({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  return <div className="rounded-xl border border-border bg-elevated px-3 py-3"><p className="text-lg font-semibold">{value.toLocaleString()}{suffix}</p><p className="text-xs text-muted">{label}</p></div>;
}

"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Link2,
  Mail,
  Plus,
  Sparkles,
} from "lucide-react";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import type { CalendarAvailability, CalendarBookingLink, CalendarDashboardStats, CalendarMeetingNote, InboxCalendarEvent } from "@repo/types";
import { createBookingLinkAction } from "../../app/(protected)/actions/calendar";
import { formatDateTime } from "../dashboard/format";
import { TabNav } from "../app/tab-nav";
import { EmptyState, SectionShell } from "../dashboard/section-shell";

type Tab = "overview" | "calendar" | "booking" | "availability" | "meetings" | "notes";

export function CalendarShell({ stats, events, links, availability, notes }: { stats: CalendarDashboardStats; events: InboxCalendarEvent[]; links: CalendarBookingLink[]; availability: CalendarAvailability | null; notes: CalendarMeetingNote[] }) {
  const [tab, setTab] = useState<Tab>("overview");
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="bos-gradient-border bos-glass-strong bos-noise relative overflow-hidden rounded-[24px] p-6 pbos-animate-rise">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.08),transparent_55%)]" aria-hidden />
        <header className="relative flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge variant="accent" className="gap-1.5">
              <CalendarDays className="h-3 w-3" aria-hidden />
              Calendar & Booking OS
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Make time for meaningful work.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              One place for availability, booking links, meetings, reminders, notes, and follow-up.
            </p>
          </div>
          <Button onClick={() => setTab("booking")} className="gap-2">
            <Plus className="h-4 w-4" aria-hidden />
            Create booking link
          </Button>
        </header>
      </div>
      <TabNav
        label="Calendar OS"
        active={tab}
        onChange={(id) => setTab(id as Tab)}
        items={[
          { id: "overview", label: "Dashboard" },
          { id: "calendar", label: "Calendar" },
          { id: "booking", label: "Booking links" },
          { id: "availability", label: "Availability" },
          { id: "meetings", label: "Meetings" },
          { id: "notes", label: "Meeting notes" },
        ]}
      />
      {tab === "overview" ? <Overview stats={stats} events={events} links={links} notes={notes} onTab={setTab} /> : null}
      {tab === "calendar" ? <CalendarView events={events} /> : null}
      {tab === "booking" ? <Booking links={links} onCreated={() => setTab("overview")} /> : null}
      {tab === "availability" ? <Availability availability={availability} /> : null}
      {tab === "meetings" ? <Meetings events={events} /> : null}
      {tab === "notes" ? <Notes notes={notes} /> : null}
    </div>
  );
}

function Overview({ stats, events, links, notes, onTab }: { stats: CalendarDashboardStats; events: InboxCalendarEvent[]; links: CalendarBookingLink[]; notes: CalendarMeetingNote[]; onTab: (tab: Tab) => void }) {
  const cards = [["Upcoming", stats.upcoming, Clock3], ["Today", stats.today, CalendarDays], ["Bookings", stats.bookings, Link2], ["Completed", stats.completed, CheckCircle2], ["Notes", notes.length, Mail]] as const;
  return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([label,value,Icon]) => <Card key={label} className="transition hover:border-primary/40 hover:bg-elevated"><div className="flex justify-between"><p className="text-sm text-secondary">{label}</p><Icon className="h-4 w-4 text-primary" aria-hidden /></div><p className="mt-4 text-3xl font-semibold">{value}</p></Card>)}</div><div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><SectionShell title="Today's agenda" description="Events from VanderBase Inbox Calendar." actionLabel="Calendar" actionHref="#"><EventList events={events.filter((event) => new Date(event.startsAt).toDateString() === new Date().toDateString()).slice(0,6)} /></SectionShell><SectionShell title="Booking links" description="Shareable pages for your availability." actionLabel="Manage" actionHref="#"><BookingList links={links.slice(0,5)} /></SectionShell></div><div className="grid gap-4 lg:grid-cols-3"><SectionShell title="Google Calendar" description="Two-way sync adapter boundary." elevated><div className="flex items-center gap-3"><CalendarDays className="h-6 w-6 text-primary" aria-hidden /><span className="text-sm text-secondary">Connect Google Calendar to sync events and detect conflicts.</span></div><Button size="sm" variant="secondary" className="mt-4" disabled>Connect soon</Button></SectionShell><SectionShell title="Reminders" description="Email and in-app reminder foundation."><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" aria-hidden /><span className="text-sm text-secondary">Reminder scheduling is attached to booking and event contracts.</span></div></SectionShell><SectionShell title="AI meeting notes" description="Summaries, action items, and CRM sync."><div className="flex items-center gap-3"><Sparkles className="h-5 w-5 text-primary" aria-hidden /><span className="text-sm text-secondary">{notes.length} saved note{notes.length === 1 ? "" : "s"}</span></div><Button size="sm" className="mt-4" onClick={() => onTab("notes")}>Open notes</Button></SectionShell></div></div>;
}

function CalendarView({ events }: { events: InboxCalendarEvent[] }) { return <SectionShell title="Calendar" description="Daily, weekly, monthly, and agenda-ready event view." actionLabel="Agenda" actionHref="#"><div className="mb-4 flex gap-2"><Badge variant="accent">Monthly</Badge><Badge variant="default">Weekly</Badge><Badge variant="default">Agenda</Badge></div><div className="grid grid-cols-7 gap-1.5">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div key={day} className="py-2 text-center text-[11px] uppercase text-muted">{day}</div>)}{Array.from({ length: 35 }, (_, index) => { const date = new Date(); date.setDate(index - 2); const key = date.toISOString().slice(0,10); const dayEvents = events.filter((event) => event.startsAt.slice(0,10) === key); return <div key={index} className="min-h-24 rounded-xl border border-border bg-elevated p-2"><p className="text-xs text-muted">{date.getDate()}</p>{dayEvents.slice(0,2).map((event) => <div key={event.id} className="mt-1 truncate rounded-lg bg-primary-muted px-1.5 py-1 text-[11px] text-primary">{event.title}</div>)}</div>})}</div></SectionShell>; }
function Booking({ links, onCreated }: { links: CalendarBookingLink[]; onCreated: () => void }) { const [name,setName]=useState(""); const [duration,setDuration]=useState("30"); const [buffer,setBuffer]=useState("0"); const [timezone,setTimezone]=useState("UTC"); const [error,setError]=useState<string|null>(null); const [pending,startTransition]=useTransition(); function create(){startTransition(async()=>{const result=await createBookingLinkAction({name,durationMinutes:Number(duration),bufferMinutes:Number(buffer),timezone}); if(!result.ok)setError(result.error); else onCreated();});} return <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><SectionShell title="Create booking page" description="Customize duration, buffer time, working timezone, and availability." elevated><div className="space-y-4"><input value={name} onChange={(e)=>setName(e.target.value)} placeholder="30-minute strategy call" className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /><div className="grid grid-cols-2 gap-3"><label className="space-y-1.5 text-xs text-muted">Duration<select value={duration} onChange={(e)=>setDuration(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground"><option>15</option><option>30</option><option>45</option><option>60</option></select></label><label className="space-y-1.5 text-xs text-muted">Buffer<select value={buffer} onChange={(e)=>setBuffer(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm text-foreground"><option>0</option><option>10</option><option>15</option><option>30</option></select></label></div><input value={timezone} onChange={(e)=>setTimezone(e.target.value)} placeholder="Timezone e.g. America/New_York" className="h-10 w-full rounded-xl border border-border bg-elevated px-3 text-sm outline-none focus:ring-2 focus:ring-primary" /><Button onClick={create} loading={pending} disabled={!name.trim()} className="w-full">Create link</Button>{error?<p className="text-sm text-error">{error}</p>:null}</div></SectionShell><SectionShell title="Your booking links" description="Share these pages with clients and prospects."><BookingList links={links} /></SectionShell></div>; }
function Availability({ availability }: { availability: CalendarAvailability | null }) { return <SectionShell title="Availability" description="Working days, holidays, custom schedules, and timezone support." elevated><div className="grid gap-3 sm:grid-cols-3"><Metric label="Timezone" value={availability?.timezone ?? "UTC"} /><Metric label="Working days" value={availability ? Object.values(availability.workingDays).filter(Boolean).length : 0} /><Metric label="Holidays" value={availability?.holidays.length ?? 0} /></div><div className="mt-4 rounded-xl border border-dashed border-border bg-elevated p-4 text-sm text-secondary">{availability ? "Your default schedule is configured. Custom schedules and holiday overrides can be added here." : "Configure your working hours and holidays to enable accurate booking slots."}</div></SectionShell>; }
function Meetings({ events }: { events: InboxCalendarEvent[] }) { return <SectionShell title="Meetings" description="Upcoming, completed, cancelled, and reschedule-ready events from VanderBase Inbox."><EventList events={events} /></SectionShell>; }
function Notes({ notes }: { notes: CalendarMeetingNote[] }) { return <SectionShell title="Meeting Notes" description="AI summaries, action items, and CRM sync." elevated>{notes.length===0?<EmptyState title="No meeting notes yet" body="Summaries and action items will appear after meetings are processed." />:<div className="space-y-2">{notes.map((note)=><Card key={note.id}><p className="text-sm text-secondary">{note.summary}</p><div className="mt-3 flex gap-2"><Badge variant="accent">{note.actionItems.length} action items</Badge><Badge variant={note.crmSynced?"success":"default"}>{note.crmSynced?"CRM synced":"Not synced"}</Badge></div></Card>)}</div>}</SectionShell>; }
function EventList({ events }: { events: InboxCalendarEvent[] }) { if(events.length===0)return <EmptyState title="No events found" body="Scheduled meetings from Inbox and booking links appear here." />; return <ul className="space-y-2">{events.slice(0,10).map((event)=><div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-elevated p-3"><span><p className="font-medium">{event.title}</p><p className="mt-1 text-xs text-muted">{formatDateTime(event.startsAt)} → {formatDateTime(event.endsAt)}</p></span><Badge variant={event.status==="scheduled"?"accent":"default"}>{event.status}</Badge></div>)}</ul>; }
function BookingList({ links }: { links: CalendarBookingLink[] }) { if(links.length===0)return <EmptyState title="No booking links yet" body="Create a booking page to share your availability." />; return <ul className="space-y-2">{links.map((link)=><div key={link.id} className="flex items-center justify-between rounded-xl border border-border bg-elevated p-3"><span><p className="font-medium">{link.name}</p><p className="text-xs text-muted">{link.durationMinutes} min · {link.timezone} · {link.bookingCount} bookings</p></span><Badge variant={link.active?"success":"default"}>{link.active?"active":"paused"}</Badge></div>)}</ul>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-border bg-elevated px-3 py-3"><p className="text-lg font-semibold">{value}</p><p className="text-xs text-muted">{label}</p></div>; }

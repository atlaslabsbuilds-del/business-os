-- Personal Brand OS Calendar & Booking foundation.

create table if not exists public.calendar_booking_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  slug text not null,
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 480),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 120),
  timezone text not null default 'UTC',
  working_hours jsonb not null default '{"mon":{"start":"09:00","end":"17:00"},"tue":{"start":"09:00","end":"17:00"},"wed":{"start":"09:00","end":"17:00"},"thu":{"start":"09:00","end":"17:00"},"fri":{"start":"09:00","end":"17:00"}}'::jsonb,
  active boolean not null default true,
  booking_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);
create index if not exists calendar_booking_links_workspace_idx on public.calendar_booking_links (workspace_id, active);
drop trigger if exists calendar_booking_links_set_updated_at on public.calendar_booking_links;
create trigger calendar_booking_links_set_updated_at before update on public.calendar_booking_links for each row execute function public.set_updated_at();
alter table public.calendar_booking_links enable row level security;
drop policy if exists "Members can manage booking links" on public.calendar_booking_links;
create policy "Members can manage booking links" on public.calendar_booking_links for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.calendar_booking_links to authenticated;

create table if not exists public.calendar_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Default schedule',
  timezone text not null default 'UTC',
  working_days jsonb not null default '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}'::jsonb,
  hours jsonb not null default '{"start":"09:00","end":"17:00"}'::jsonb,
  holidays jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendar_availability enable row level security;
drop policy if exists "Members can manage calendar availability" on public.calendar_availability;
create policy "Members can manage calendar availability" on public.calendar_availability for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.calendar_availability to authenticated;

create table if not exists public.calendar_meeting_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event_id uuid references public.inbox_calendar_events (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  summary text not null default '',
  action_items jsonb not null default '[]'::jsonb,
  crm_synced boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id)
);
alter table public.calendar_meeting_notes enable row level security;
drop policy if exists "Members can manage meeting notes" on public.calendar_meeting_notes;
create policy "Members can manage meeting notes" on public.calendar_meeting_notes for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.calendar_meeting_notes to authenticated;

create table if not exists public.calendar_reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  event_id uuid references public.inbox_calendar_events (id) on delete cascade,
  booking_link_id uuid references public.calendar_booking_links (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('email','in_app')),
  minutes_before integer not null default 30 check (minutes_before between 0 and 10080),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.calendar_reminders enable row level security;
drop policy if exists "Members can manage calendar reminders" on public.calendar_reminders;
create policy "Members can manage calendar reminders" on public.calendar_reminders for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.calendar_reminders to authenticated;

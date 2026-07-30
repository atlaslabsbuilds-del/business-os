-- Calendar module expansion: first-class events, meetings, participants, reminders,
-- integrations, availability, and workspace settings.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'calendar_event_status') then
    create type public.calendar_event_status as enum ('scheduled','confirmed','completed','cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'calendar_event_priority') then
    create type public.calendar_event_priority as enum ('low','medium','high','urgent');
  end if;
  if not exists (select 1 from pg_type where typname = 'calendar_integration_provider') then
    create type public.calendar_integration_provider as enum ('google','outlook','apple');
  end if;
end
$$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  description text,
  location text,
  video_url text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  status public.calendar_event_status not null default 'scheduled',
  priority public.calendar_event_priority not null default 'medium',
  color text not null default '#f97316',
  is_all_day boolean not null default false,
  recurrence_rule text,
  category text not null default 'general',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  notes text,
  recording_url text,
  summary text,
  action_items jsonb not null default '[]'::jsonb,
  follow_up_task_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(event_id)
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  name text,
  response_status text not null default 'pending' check (response_status in ('pending','accepted','declined','tentative')),
  is_required boolean not null default true,
  created_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  event_id uuid references public.events(id) on delete cascade,
  title text not null,
  remind_at timestamptz not null,
  channel text not null default 'in_app' check (channel in ('email','push','in_app')),
  recurrence_rule text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  provider public.calendar_integration_provider not null,
  account_email text,
  external_account_id text,
  status text not null default 'connected' check (status in ('connected','syncing','error','disconnected')),
  last_synced_at timestamptz,
  sync_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workspace_id, provider, external_account_id)
);

create table if not exists public.calendar_working_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null default 'Default schedule',
  timezone text not null default 'UTC',
  working_days jsonb not null default '{"mon":true,"tue":true,"wed":true,"thu":true,"fri":true,"sat":false,"sun":false}'::jsonb,
  hours jsonb not null default '{"start":"09:00","end":"17:00"}'::jsonb,
  vacation_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_settings (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  default_timezone text not null default 'UTC',
  week_starts_on integer not null default 1 check (week_starts_on between 0 and 6),
  default_event_duration integer not null default 30 check (default_event_duration between 5 and 480),
  working_hours jsonb not null default '{"start":"09:00","end":"17:00"}'::jsonb,
  color_categories jsonb not null default '{"general":"#f97316","meeting":"#38bdf8","focus":"#a78bfa","personal":"#22c55e"}'::jsonb,
  notifications jsonb not null default '{"email":true,"push":true,"inApp":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_workspace_time_idx on public.events(workspace_id, starts_at);
create index if not exists events_status_idx on public.events(workspace_id, status);
create index if not exists meetings_event_idx on public.meetings(event_id);
create index if not exists participants_event_idx on public.participants(event_id);
create index if not exists reminders_due_idx on public.reminders(workspace_id, remind_at);
create index if not exists calendar_integrations_workspace_idx on public.calendar_integrations(workspace_id, provider);

do $$
declare table_name text;
begin
  foreach table_name in array array['events','meetings','reminders','calendar_integrations','calendar_working_availability','calendar_settings'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

do $$
declare table_name text;
begin
  foreach table_name in array array['events','meetings','participants','reminders','calendar_integrations','calendar_working_availability','calendar_settings'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "Members can manage %s" on public.%I', table_name, table_name);
    execute format('create policy "Members can manage %s" on public.%I for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', table_name, table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

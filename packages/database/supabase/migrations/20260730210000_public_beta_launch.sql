-- Milestone 15: Public beta launch readiness.
-- Tracks beta funnel analytics, workspace templates, and demo-data generation state.

create table if not exists public.workspace_beta_launch_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  template_key text not null default 'blank',
  launch_stage text not null default 'setup'
    check (launch_stage in ('setup', 'activated', 'ready', 'launched')),
  demo_data_seeded_at timestamptz,
  checklist jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_beta_launch_profiles_template_idx
  on public.workspace_beta_launch_profiles (template_key, launch_stage);

drop trigger if exists workspace_beta_launch_profiles_set_updated_at on public.workspace_beta_launch_profiles;
create trigger workspace_beta_launch_profiles_set_updated_at
before update on public.workspace_beta_launch_profiles
for each row execute function public.set_updated_at();

alter table public.workspace_beta_launch_profiles enable row level security;
alter table public.workspace_beta_launch_profiles force row level security;

drop policy if exists "Members can view beta launch profiles" on public.workspace_beta_launch_profiles;
create policy "Members can view beta launch profiles"
on public.workspace_beta_launch_profiles for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins manage beta launch profiles" on public.workspace_beta_launch_profiles;
create policy "Admins manage beta launch profiles"
on public.workspace_beta_launch_profiles for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

grant select, insert, update on public.workspace_beta_launch_profiles to authenticated;

create table if not exists public.beta_analytics_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null check (length(event_name) between 1 and 120),
  event_category text not null default 'feature_usage',
  source text not null default 'web',
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists beta_analytics_events_workspace_idx
  on public.beta_analytics_events (workspace_id, created_at desc);
create index if not exists beta_analytics_events_user_idx
  on public.beta_analytics_events (user_id, created_at desc);
create index if not exists beta_analytics_events_name_idx
  on public.beta_analytics_events (event_name, created_at desc);

alter table public.beta_analytics_events enable row level security;
alter table public.beta_analytics_events force row level security;

drop policy if exists "Members can view workspace beta analytics" on public.beta_analytics_events;
create policy "Members can view workspace beta analytics"
on public.beta_analytics_events for select
using (
  workspace_id is not null
  and public.is_workspace_member(workspace_id)
  and public.is_workspace_admin(workspace_id)
);

drop policy if exists "Members can insert beta analytics" on public.beta_analytics_events;
create policy "Members can insert beta analytics"
on public.beta_analytics_events for insert
with check (
  workspace_id is null
  or public.is_workspace_member(workspace_id)
);

grant select, insert on public.beta_analytics_events to authenticated;

create table if not exists public.beta_release_notes (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title text not null,
  summary text not null,
  highlights text[] not null default array[]::text[],
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.beta_release_notes enable row level security;
alter table public.beta_release_notes force row level security;

drop policy if exists "Public can view beta release notes" on public.beta_release_notes;
create policy "Public can view beta release notes"
on public.beta_release_notes for select
using (true);

grant select on public.beta_release_notes to anon, authenticated;

insert into public.beta_release_notes (version, title, summary, highlights, published_at)
values
  (
    'public-beta-1',
    'Public Beta Launch',
    'VanderBase is ready for early customers with CRM, Finance, Projects, Documents, Calendar, Analytics, Notifications, PWA, Security, and Kairos AI.',
    array['Public beta onboarding', 'Workspace templates', 'Demo data generator', 'Notification center', 'Security dashboard', 'PWA offline shell'],
    now()
  )
on conflict (version) do nothing;

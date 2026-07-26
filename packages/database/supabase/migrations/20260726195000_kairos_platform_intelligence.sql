-- Kairos platform intelligence: memory settings, agent runs, versions,
-- onboarding checklist, and proactive suggestions.

create table if not exists public.workspace_ai_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  memory_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_ai_settings_set_updated_at on public.workspace_ai_settings;
create trigger workspace_ai_settings_set_updated_at
before update on public.workspace_ai_settings
for each row execute function public.set_updated_at();

alter table public.workspace_ai_settings enable row level security;
alter table public.workspace_ai_settings force row level security;

drop policy if exists "Members can view ai settings" on public.workspace_ai_settings;
create policy "Members can view ai settings"
on public.workspace_ai_settings for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage ai settings" on public.workspace_ai_settings;
create policy "Members can manage ai settings"
on public.workspace_ai_settings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update on public.workspace_ai_settings to authenticated;

-- Allow members (not only admins) to delete their workspace memory entries.
drop policy if exists "Admins can delete workspace ai memory" on public.workspace_ai_memory;
drop policy if exists "Members can delete workspace ai memory" on public.workspace_ai_memory;
create policy "Members can delete workspace ai memory"
on public.workspace_ai_memory for delete
using (public.is_workspace_member(workspace_id));

create table if not exists public.kairos_agent_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  agent_id text not null,
  title text not null,
  prompt text not null default '',
  status text not null default 'completed'
    check (status in ('queued', 'running', 'completed', 'failed')),
  result_summary text,
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kairos_agent_runs_workspace_idx
  on public.kairos_agent_runs (workspace_id, created_at desc);
create index if not exists kairos_agent_runs_agent_idx
  on public.kairos_agent_runs (workspace_id, agent_id, created_at desc);

drop trigger if exists kairos_agent_runs_set_updated_at on public.kairos_agent_runs;
create trigger kairos_agent_runs_set_updated_at
before update on public.kairos_agent_runs
for each row execute function public.set_updated_at();

alter table public.kairos_agent_runs enable row level security;
alter table public.kairos_agent_runs force row level security;

drop policy if exists "Members can view agent runs" on public.kairos_agent_runs;
create policy "Members can view agent runs"
on public.kairos_agent_runs for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage agent runs" on public.kairos_agent_runs;
create policy "Members can manage agent runs"
on public.kairos_agent_runs for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.kairos_agent_runs to authenticated;

create table if not exists public.ai_output_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  title text not null default 'Untitled version',
  content text not null default '',
  version_number integer not null default 1 check (version_number >= 1),
  is_current boolean not null default false,
  created_by uuid references auth.users (id) on delete set null,
  parent_version_id uuid references public.ai_output_versions (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_output_versions_workspace_idx
  on public.ai_output_versions (workspace_id, entity_type, created_at desc);
create index if not exists ai_output_versions_entity_idx
  on public.ai_output_versions (workspace_id, entity_type, entity_id, version_number desc);

drop trigger if exists ai_output_versions_set_updated_at on public.ai_output_versions;
create trigger ai_output_versions_set_updated_at
before update on public.ai_output_versions
for each row execute function public.set_updated_at();

alter table public.ai_output_versions enable row level security;
alter table public.ai_output_versions force row level security;

drop policy if exists "Members can manage ai output versions" on public.ai_output_versions;
create policy "Members can manage ai output versions"
on public.ai_output_versions for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.ai_output_versions to authenticated;

create table if not exists public.workspace_onboarding_progress (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  completed_steps jsonb not null default '[]'::jsonb,
  celebrated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists workspace_onboarding_progress_set_updated_at
  on public.workspace_onboarding_progress;
create trigger workspace_onboarding_progress_set_updated_at
before update on public.workspace_onboarding_progress
for each row execute function public.set_updated_at();

alter table public.workspace_onboarding_progress enable row level security;
alter table public.workspace_onboarding_progress force row level security;

drop policy if exists "Members can manage onboarding progress"
  on public.workspace_onboarding_progress;
create policy "Members can manage onboarding progress"
on public.workspace_onboarding_progress for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update on public.workspace_onboarding_progress to authenticated;

create table if not exists public.workspace_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  module text not null default 'dashboard',
  title text not null,
  body text not null default '',
  action_label text,
  action_url text,
  severity text not null default 'info'
    check (severity in ('info', 'success', 'warning')),
  dismissed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_ai_suggestions_workspace_idx
  on public.workspace_ai_suggestions (workspace_id, dismissed_at, created_at desc);

drop trigger if exists workspace_ai_suggestions_set_updated_at
  on public.workspace_ai_suggestions;
create trigger workspace_ai_suggestions_set_updated_at
before update on public.workspace_ai_suggestions
for each row execute function public.set_updated_at();

alter table public.workspace_ai_suggestions enable row level security;
alter table public.workspace_ai_suggestions force row level security;

drop policy if exists "Members can manage ai suggestions"
  on public.workspace_ai_suggestions;
create policy "Members can manage ai suggestions"
on public.workspace_ai_suggestions for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.workspace_ai_suggestions to authenticated;

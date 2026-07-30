-- CRM module expansion: pipelines, stages, tasks, attachments, settings,
-- and enriched company profile fields.

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'crm_deal_stage' and e.enumlabel = 'lead'
  ) then
    alter type public.crm_deal_stage add value if not exists 'lead' before 'qualified';
  end if;
exception
  when others then
    -- Older Postgres may not support BEFORE; fall back to append.
    begin
      alter type public.crm_deal_stage add value if not exists 'lead';
    exception when others then null;
    end;
end
$$;

alter table public.crm_companies
  add column if not exists employee_count integer,
  add column if not exists annual_revenue numeric(14, 2),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.crm_contacts
  add column if not exists priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.crm_deals
  add column if not exists products jsonb not null default '[]'::jsonb,
  add column if not exists notes text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create table if not exists public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null,
  is_default boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null default 0,
  probability integer not null default 10 check (probability between 0 and 100),
  is_won boolean not null default false,
  is_lost boolean not null default false,
  color text not null default '#f97316',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pipeline_id, slug)
);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  description text,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  due_at timestamptz,
  reminder_at timestamptz,
  assignee_id uuid references auth.users (id) on delete set null,
  contact_id uuid references public.crm_contacts (id) on delete set null,
  company_id uuid references public.crm_companies (id) on delete set null,
  deal_id uuid references public.crm_deals (id) on delete set null,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  entity_type public.crm_entity_type not null,
  entity_id uuid not null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  lead_sources jsonb not null default '["Website","Referral","Outbound","Partner","Event"]'::jsonb,
  custom_fields jsonb not null default '[]'::jsonb,
  automation_rules jsonb not null default '[]'::jsonb,
  default_pipeline_id uuid references public.crm_pipelines (id) on delete set null,
  permissions jsonb not null default '{"canExport":true,"canImport":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_pipelines_workspace_idx on public.crm_pipelines (workspace_id, created_at desc);
create index if not exists crm_pipeline_stages_pipeline_idx on public.crm_pipeline_stages (pipeline_id, position);
create index if not exists crm_tasks_workspace_due_idx on public.crm_tasks (workspace_id, due_at);
create index if not exists crm_tasks_status_idx on public.crm_tasks (workspace_id, status);
create index if not exists crm_attachments_entity_idx on public.crm_attachments (workspace_id, entity_type, entity_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'crm_pipelines',
    'crm_pipeline_stages',
    'crm_tasks',
    'crm_attachments',
    'crm_settings'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

alter table public.crm_pipelines enable row level security;
alter table public.crm_pipeline_stages enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_attachments enable row level security;
alter table public.crm_settings enable row level security;

drop policy if exists "Members can manage crm pipelines" on public.crm_pipelines;
create policy "Members can manage crm pipelines" on public.crm_pipelines for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage crm pipeline stages" on public.crm_pipeline_stages;
create policy "Members can manage crm pipeline stages" on public.crm_pipeline_stages for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage crm tasks" on public.crm_tasks;
create policy "Members can manage crm tasks" on public.crm_tasks for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage crm attachments" on public.crm_attachments;
create policy "Members can manage crm attachments" on public.crm_attachments for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage crm settings" on public.crm_settings;
create policy "Members can manage crm settings" on public.crm_settings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.crm_pipelines to authenticated;
grant select, insert, update, delete on public.crm_pipeline_stages to authenticated;
grant select, insert, update, delete on public.crm_tasks to authenticated;
grant select, insert, update, delete on public.crm_attachments to authenticated;
grant select, insert, update, delete on public.crm_settings to authenticated;

insert into storage.buckets (id, name, public)
values ('crm-attachments', 'crm-attachments', false)
on conflict (id) do nothing;

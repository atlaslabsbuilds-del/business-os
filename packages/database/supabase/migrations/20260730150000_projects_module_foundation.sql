-- Projects module foundation: projects, tasks, subtasks, labels, members,
-- comments, attachments, time logs, and reports.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type public.project_status as enum (
      'planning',
      'active',
      'on_hold',
      'completed',
      'archived'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_priority') then
    create type public.project_priority as enum (
      'low',
      'medium',
      'high',
      'urgent'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'project_task_status') then
    create type public.project_task_status as enum (
      'backlog',
      'todo',
      'in_progress',
      'review',
      'completed'
    );
  end if;
end
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  description text,
  status public.project_status not null default 'planning',
  priority public.project_priority not null default 'medium',
  progress integer not null default 0 check (progress between 0 and 100),
  start_date date,
  due_date date,
  tags text[] not null default '{}',
  team_name text,
  is_archived boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member'
    check (role in ('owner', 'manager', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null,
  color text not null default '#f97316',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  assignee_id uuid references auth.users (id) on delete set null,
  title text not null,
  description text,
  status public.project_task_status not null default 'backlog',
  priority public.project_priority not null default 'medium',
  due_at timestamptz,
  start_at timestamptz,
  completed_at timestamptz,
  estimate_hours numeric(8, 2),
  progress integer not null default 0 check (progress between 0 and 100),
  position integer not null default 0,
  depends_on uuid[] not null default '{}',
  checklist jsonb not null default '[]'::jsonb,
  is_milestone boolean not null default false,
  is_recurring boolean not null default false,
  recurrence_rule text,
  labels text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  body text not null,
  mentions uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (project_id is not null or task_id is not null)
);

create table if not exists public.project_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  project_id uuid references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  hours numeric(8, 2) not null check (hours > 0),
  note text,
  logged_on date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  report_type text not null default 'health',
  title text not null,
  summary text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  custom_stages jsonb not null default '["backlog","todo","in_progress","review","completed"]'::jsonb,
  default_priority public.project_priority not null default 'medium',
  automation_rules jsonb not null default '[]'::jsonb,
  permissions jsonb not null default '{"canCreate":true,"canArchive":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_idx on public.projects (workspace_id, updated_at desc);
create index if not exists projects_status_idx on public.projects (workspace_id, status);
create index if not exists tasks_project_idx on public.tasks (project_id, status, position);
create index if not exists tasks_workspace_due_idx on public.tasks (workspace_id, due_at);
create index if not exists subtasks_task_idx on public.subtasks (task_id, position);
create index if not exists time_logs_project_idx on public.time_logs (project_id, logged_on desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'projects',
    'project_labels',
    'tasks',
    'subtasks',
    'project_comments',
    'project_attachments',
    'time_logs',
    'project_reports',
    'project_settings'
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

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_labels enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.project_comments enable row level security;
alter table public.project_attachments enable row level security;
alter table public.time_logs enable row level security;
alter table public.project_reports enable row level security;
alter table public.project_settings enable row level security;

drop policy if exists "Members can manage projects" on public.projects;
create policy "Members can manage projects" on public.projects for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage project members" on public.project_members;
create policy "Members can manage project members" on public.project_members for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage project labels" on public.project_labels;
create policy "Members can manage project labels" on public.project_labels for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage tasks" on public.tasks;
create policy "Members can manage tasks" on public.tasks for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage subtasks" on public.subtasks;
create policy "Members can manage subtasks" on public.subtasks for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage project comments" on public.project_comments;
create policy "Members can manage project comments" on public.project_comments for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage project attachments" on public.project_attachments;
create policy "Members can manage project attachments" on public.project_attachments for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage time logs" on public.time_logs;
create policy "Members can manage time logs" on public.time_logs for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and user_id = auth.uid());

drop policy if exists "Members can manage project reports" on public.project_reports;
create policy "Members can manage project reports" on public.project_reports for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage project settings" on public.project_settings;
create policy "Members can manage project settings" on public.project_settings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_members to authenticated;
grant select, insert, update, delete on public.project_labels to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.subtasks to authenticated;
grant select, insert, update, delete on public.project_comments to authenticated;
grant select, insert, update, delete on public.project_attachments to authenticated;
grant select, insert, update, delete on public.time_logs to authenticated;
grant select, insert, update, delete on public.project_reports to authenticated;
grant select, insert, update, delete on public.project_settings to authenticated;

insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

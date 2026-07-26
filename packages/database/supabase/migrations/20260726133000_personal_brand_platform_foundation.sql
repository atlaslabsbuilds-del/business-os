-- Personal Brand OS shared platform primitives.
-- Workspace-scoped notifications, activity, and persisted AI memory.

create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  module text not null,
  type text not null default 'info',
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_notifications_workspace_idx
  on public.workspace_notifications (workspace_id, created_at desc);

create index if not exists workspace_notifications_unread_idx
  on public.workspace_notifications (workspace_id, read_at)
  where read_at is null;

drop trigger if exists workspace_notifications_set_updated_at on public.workspace_notifications;
create trigger workspace_notifications_set_updated_at
before update on public.workspace_notifications
for each row execute function public.set_updated_at();

alter table public.workspace_notifications enable row level security;

drop policy if exists "Members can view workspace notifications" on public.workspace_notifications;
create policy "Members can view workspace notifications"
on public.workspace_notifications for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert workspace notifications" on public.workspace_notifications;
create policy "Members can insert workspace notifications"
on public.workspace_notifications for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update workspace notifications" on public.workspace_notifications;
create policy "Members can update workspace notifications"
on public.workspace_notifications for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can delete workspace notifications" on public.workspace_notifications;
create policy "Admins can delete workspace notifications"
on public.workspace_notifications for delete
using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspace_notifications to authenticated;

create table if not exists public.workspace_activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  module text not null,
  event_type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  actor_id uuid references auth.users (id) on delete set null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workspace_activity_events_workspace_idx
  on public.workspace_activity_events (workspace_id, created_at desc);

create index if not exists workspace_activity_events_entity_idx
  on public.workspace_activity_events (workspace_id, entity_type, entity_id);

alter table public.workspace_activity_events enable row level security;

drop policy if exists "Members can view workspace activity events" on public.workspace_activity_events;
create policy "Members can view workspace activity events"
on public.workspace_activity_events for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert workspace activity events" on public.workspace_activity_events;
create policy "Members can insert workspace activity events"
on public.workspace_activity_events for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can delete workspace activity events" on public.workspace_activity_events;
create policy "Admins can delete workspace activity events"
on public.workspace_activity_events for delete
using (public.is_workspace_admin(workspace_id));

grant select, insert, delete on public.workspace_activity_events to authenticated;

create table if not exists public.workspace_ai_memory (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source_module text not null default 'assistant',
  scope text not null default 'workspace',
  fact text not null,
  summary text,
  importance integer not null default 1 check (importance between 1 and 5),
  created_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_ai_memory_workspace_idx
  on public.workspace_ai_memory (workspace_id, updated_at desc);

create index if not exists workspace_ai_memory_module_idx
  on public.workspace_ai_memory (workspace_id, source_module, updated_at desc);

drop trigger if exists workspace_ai_memory_set_updated_at on public.workspace_ai_memory;
create trigger workspace_ai_memory_set_updated_at
before update on public.workspace_ai_memory
for each row execute function public.set_updated_at();

alter table public.workspace_ai_memory enable row level security;

drop policy if exists "Members can view workspace ai memory" on public.workspace_ai_memory;
create policy "Members can view workspace ai memory"
on public.workspace_ai_memory for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert workspace ai memory" on public.workspace_ai_memory;
create policy "Members can insert workspace ai memory"
on public.workspace_ai_memory for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update workspace ai memory" on public.workspace_ai_memory;
create policy "Members can update workspace ai memory"
on public.workspace_ai_memory for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can delete workspace ai memory" on public.workspace_ai_memory;
create policy "Admins can delete workspace ai memory"
on public.workspace_ai_memory for delete
using (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspace_ai_memory to authenticated;

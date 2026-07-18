-- Actora AI Inbox foundation: unified mail, labels, attachments, tasks, calendar

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_provider') then
    create type public.inbox_provider as enum ('gmail', 'outlook');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_account_status') then
    create type public.inbox_account_status as enum (
      'connected',
      'syncing',
      'error',
      'disconnected'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_thread_status') then
    create type public.inbox_thread_status as enum (
      'open',
      'archived',
      'trashed',
      'spam'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_message_direction') then
    create type public.inbox_message_direction as enum ('inbound', 'outbound');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_task_status') then
    create type public.inbox_task_status as enum (
      'open',
      'done',
      'cancelled'
    );
  end if;
end
$$;

create table if not exists public.inbox_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider public.inbox_provider not null,
  email text not null,
  display_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  status public.inbox_account_status not null default 'connected',
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, email)
);

create table if not exists public.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid not null references public.inbox_accounts (id) on delete cascade,
  external_id text,
  subject text not null default '(no subject)',
  snippet text not null default '',
  participants jsonb not null default '[]'::jsonb,
  status public.inbox_thread_status not null default 'open',
  is_unread boolean not null default true,
  is_starred boolean not null default false,
  message_count integer not null default 0,
  has_attachments boolean not null default false,
  last_message_at timestamptz not null default now(),
  contact_id uuid references public.crm_contacts (id) on delete set null,
  company_id uuid references public.crm_companies (id) on delete set null,
  ai_summary text,
  meeting_detected boolean not null default false,
  meeting_confidence numeric(4, 3) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  account_id uuid not null references public.inbox_accounts (id) on delete cascade,
  external_id text,
  direction public.inbox_message_direction not null default 'inbound',
  from_email text not null,
  from_name text,
  to_emails jsonb not null default '[]'::jsonb,
  cc_emails jsonb not null default '[]'::jsonb,
  subject text not null default '',
  body_text text not null default '',
  body_html text,
  sent_at timestamptz not null default now(),
  is_draft boolean not null default false,
  ai_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid references public.inbox_accounts (id) on delete cascade,
  name text not null,
  color text not null default '#4f46e5',
  external_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.inbox_thread_labels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  label_id uuid not null references public.inbox_labels (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (thread_id, label_id)
);

create table if not exists public.inbox_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  message_id uuid not null references public.inbox_messages (id) on delete cascade,
  filename text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null default 0,
  storage_url text,
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.inbox_tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid references public.inbox_threads (id) on delete set null,
  message_id uuid references public.inbox_messages (id) on delete set null,
  title text not null,
  description text,
  due_at timestamptz,
  status public.inbox_task_status not null default 'open',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inbox_calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid references public.inbox_threads (id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  attendees jsonb not null default '[]'::jsonb,
  provider public.inbox_provider,
  external_id text,
  status text not null default 'scheduled',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inbox_accounts_workspace_idx
  on public.inbox_accounts (workspace_id, provider);

create index if not exists inbox_threads_workspace_last_idx
  on public.inbox_threads (workspace_id, last_message_at desc);

create index if not exists inbox_threads_status_idx
  on public.inbox_threads (workspace_id, status, is_unread);

create index if not exists inbox_threads_contact_idx
  on public.inbox_threads (contact_id);

create index if not exists inbox_messages_thread_idx
  on public.inbox_messages (thread_id, sent_at asc);

create index if not exists inbox_messages_workspace_idx
  on public.inbox_messages (workspace_id, sent_at desc);

create index if not exists inbox_labels_workspace_idx
  on public.inbox_labels (workspace_id);

create index if not exists inbox_attachments_message_idx
  on public.inbox_attachments (message_id);

create index if not exists inbox_tasks_workspace_idx
  on public.inbox_tasks (workspace_id, status, due_at);

create index if not exists inbox_calendar_workspace_idx
  on public.inbox_calendar_events (workspace_id, starts_at);

drop trigger if exists inbox_accounts_set_updated_at on public.inbox_accounts;
create trigger inbox_accounts_set_updated_at
before update on public.inbox_accounts
for each row execute function public.set_updated_at();

drop trigger if exists inbox_threads_set_updated_at on public.inbox_threads;
create trigger inbox_threads_set_updated_at
before update on public.inbox_threads
for each row execute function public.set_updated_at();

drop trigger if exists inbox_messages_set_updated_at on public.inbox_messages;
create trigger inbox_messages_set_updated_at
before update on public.inbox_messages
for each row execute function public.set_updated_at();

drop trigger if exists inbox_labels_set_updated_at on public.inbox_labels;
create trigger inbox_labels_set_updated_at
before update on public.inbox_labels
for each row execute function public.set_updated_at();

drop trigger if exists inbox_tasks_set_updated_at on public.inbox_tasks;
create trigger inbox_tasks_set_updated_at
before update on public.inbox_tasks
for each row execute function public.set_updated_at();

drop trigger if exists inbox_calendar_events_set_updated_at on public.inbox_calendar_events;
create trigger inbox_calendar_events_set_updated_at
before update on public.inbox_calendar_events
for each row execute function public.set_updated_at();

alter table public.inbox_accounts enable row level security;
alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.inbox_labels enable row level security;
alter table public.inbox_thread_labels enable row level security;
alter table public.inbox_attachments enable row level security;
alter table public.inbox_tasks enable row level security;
alter table public.inbox_calendar_events enable row level security;

-- Accounts
drop policy if exists "Members can view inbox accounts" on public.inbox_accounts;
create policy "Members can view inbox accounts"
on public.inbox_accounts for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox accounts" on public.inbox_accounts;
create policy "Members can insert inbox accounts"
on public.inbox_accounts for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update inbox accounts" on public.inbox_accounts;
create policy "Members can update inbox accounts"
on public.inbox_accounts for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox accounts" on public.inbox_accounts;
create policy "Members can delete inbox accounts"
on public.inbox_accounts for delete
using (public.is_workspace_member(workspace_id));

-- Threads
drop policy if exists "Members can view inbox threads" on public.inbox_threads;
create policy "Members can view inbox threads"
on public.inbox_threads for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox threads" on public.inbox_threads;
create policy "Members can insert inbox threads"
on public.inbox_threads for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update inbox threads" on public.inbox_threads;
create policy "Members can update inbox threads"
on public.inbox_threads for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox threads" on public.inbox_threads;
create policy "Members can delete inbox threads"
on public.inbox_threads for delete
using (public.is_workspace_member(workspace_id));

-- Messages
drop policy if exists "Members can view inbox messages" on public.inbox_messages;
create policy "Members can view inbox messages"
on public.inbox_messages for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox messages" on public.inbox_messages;
create policy "Members can insert inbox messages"
on public.inbox_messages for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update inbox messages" on public.inbox_messages;
create policy "Members can update inbox messages"
on public.inbox_messages for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox messages" on public.inbox_messages;
create policy "Members can delete inbox messages"
on public.inbox_messages for delete
using (public.is_workspace_member(workspace_id));

-- Labels
drop policy if exists "Members can view inbox labels" on public.inbox_labels;
create policy "Members can view inbox labels"
on public.inbox_labels for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox labels" on public.inbox_labels;
create policy "Members can insert inbox labels"
on public.inbox_labels for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update inbox labels" on public.inbox_labels;
create policy "Members can update inbox labels"
on public.inbox_labels for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox labels" on public.inbox_labels;
create policy "Members can delete inbox labels"
on public.inbox_labels for delete
using (public.is_workspace_member(workspace_id));

-- Thread labels
drop policy if exists "Members can view inbox thread labels" on public.inbox_thread_labels;
create policy "Members can view inbox thread labels"
on public.inbox_thread_labels for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox thread labels" on public.inbox_thread_labels;
create policy "Members can insert inbox thread labels"
on public.inbox_thread_labels for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox thread labels" on public.inbox_thread_labels;
create policy "Members can delete inbox thread labels"
on public.inbox_thread_labels for delete
using (public.is_workspace_member(workspace_id));

-- Attachments
drop policy if exists "Members can view inbox attachments" on public.inbox_attachments;
create policy "Members can view inbox attachments"
on public.inbox_attachments for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox attachments" on public.inbox_attachments;
create policy "Members can insert inbox attachments"
on public.inbox_attachments for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox attachments" on public.inbox_attachments;
create policy "Members can delete inbox attachments"
on public.inbox_attachments for delete
using (public.is_workspace_member(workspace_id));

-- Tasks
drop policy if exists "Members can view inbox tasks" on public.inbox_tasks;
create policy "Members can view inbox tasks"
on public.inbox_tasks for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox tasks" on public.inbox_tasks;
create policy "Members can insert inbox tasks"
on public.inbox_tasks for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update inbox tasks" on public.inbox_tasks;
create policy "Members can update inbox tasks"
on public.inbox_tasks for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox tasks" on public.inbox_tasks;
create policy "Members can delete inbox tasks"
on public.inbox_tasks for delete
using (public.is_workspace_member(workspace_id));

-- Calendar
drop policy if exists "Members can view inbox calendar events" on public.inbox_calendar_events;
create policy "Members can view inbox calendar events"
on public.inbox_calendar_events for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox calendar events" on public.inbox_calendar_events;
create policy "Members can insert inbox calendar events"
on public.inbox_calendar_events for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update inbox calendar events" on public.inbox_calendar_events;
create policy "Members can update inbox calendar events"
on public.inbox_calendar_events for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox calendar events" on public.inbox_calendar_events;
create policy "Members can delete inbox calendar events"
on public.inbox_calendar_events for delete
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.inbox_accounts to authenticated;
grant select, insert, update, delete on public.inbox_threads to authenticated;
grant select, insert, update, delete on public.inbox_messages to authenticated;
grant select, insert, update, delete on public.inbox_labels to authenticated;
grant select, insert, delete on public.inbox_thread_labels to authenticated;
grant select, insert, delete on public.inbox_attachments to authenticated;
grant select, insert, update, delete on public.inbox_tasks to authenticated;
grant select, insert, update, delete on public.inbox_calendar_events to authenticated;

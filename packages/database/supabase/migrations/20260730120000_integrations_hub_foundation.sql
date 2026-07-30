-- Integrations Hub foundation: catalog, accounts, encrypted tokens, activity, sync jobs

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_connection_status') then
    create type public.integration_connection_status as enum (
      'connected',
      'not_connected',
      'error',
      'syncing',
      'disconnected'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_activity_event') then
    create type public.integration_activity_event as enum (
      'connected',
      'disconnected',
      'permission_updated',
      'manual_sync',
      'automatic_sync',
      'error',
      'token_refreshed',
      'reconnect'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'integration_sync_job_status') then
    create type public.integration_sync_job_status as enum (
      'queued',
      'running',
      'succeeded',
      'failed',
      'cancelled'
    );
  end if;
end
$$;

-- Catalog of available providers (supports 200+ without redesign)
create table if not exists public.integrations (
  id text primary key,
  name text not null,
  category text not null,
  description text not null default '',
  logo_key text,
  auth_type text not null default 'oauth2',
  featured boolean not null default false,
  launch boolean not null default true,
  kairos_actions jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integrations_category_idx on public.integrations (category);
create index if not exists integrations_featured_idx on public.integrations (featured) where featured;

-- Workspace-scoped connected accounts
create table if not exists public.integration_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  provider text not null references public.integrations (id) on delete restrict,
  account_email text,
  account_name text,
  external_account_id text,
  status public.integration_connection_status not null default 'not_connected',
  permissions text[] not null default '{}',
  scopes text[] not null default '{}',
  last_sync_at timestamptz,
  sync_frequency text not null default 'manual',
  auto_sync boolean not null default true,
  notifications_enabled boolean not null default true,
  kairos_access boolean not null default true,
  health text not null default 'unknown',
  error_message text,
  connected_by uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, provider, external_account_id)
);

create index if not exists integration_accounts_workspace_idx
  on public.integration_accounts (workspace_id, updated_at desc);
create index if not exists integration_accounts_provider_idx
  on public.integration_accounts (provider, status);
create index if not exists integration_accounts_workspace_provider_idx
  on public.integration_accounts (workspace_id, provider);

-- Encrypted OAuth tokens (never exposed to authenticated clients)
create table if not exists public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.integration_accounts (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  token_type text not null default 'Bearer',
  expires_at timestamptz,
  encryption_version int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_tokens_workspace_idx
  on public.integration_tokens (workspace_id);
create index if not exists integration_tokens_expires_idx
  on public.integration_tokens (expires_at);

-- Activity timeline
create table if not exists public.integration_activity (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid references public.integration_accounts (id) on delete set null,
  provider text not null,
  event_type public.integration_activity_event not null,
  title text not null,
  body text,
  actor_id uuid references auth.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists integration_activity_workspace_idx
  on public.integration_activity (workspace_id, created_at desc);
create index if not exists integration_activity_account_idx
  on public.integration_activity (account_id, created_at desc);
create index if not exists integration_activity_provider_idx
  on public.integration_activity (workspace_id, provider, created_at desc);

-- Sync jobs with retry support
create table if not exists public.integration_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid not null references public.integration_accounts (id) on delete cascade,
  provider text not null,
  status public.integration_sync_job_status not null default 'queued',
  trigger text not null default 'manual',
  attempts int not null default 0,
  max_attempts int not null default 3,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  result jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists integration_sync_jobs_workspace_idx
  on public.integration_sync_jobs (workspace_id, created_at desc);
create index if not exists integration_sync_jobs_account_idx
  on public.integration_sync_jobs (account_id, created_at desc);
create index if not exists integration_sync_jobs_status_idx
  on public.integration_sync_jobs (status, created_at desc);

drop trigger if exists integrations_set_updated_at on public.integrations;
create trigger integrations_set_updated_at
before update on public.integrations
for each row execute function public.set_updated_at();

drop trigger if exists integration_accounts_set_updated_at on public.integration_accounts;
create trigger integration_accounts_set_updated_at
before update on public.integration_accounts
for each row execute function public.set_updated_at();

drop trigger if exists integration_tokens_set_updated_at on public.integration_tokens;
create trigger integration_tokens_set_updated_at
before update on public.integration_tokens
for each row execute function public.set_updated_at();

drop trigger if exists integration_sync_jobs_set_updated_at on public.integration_sync_jobs;
create trigger integration_sync_jobs_set_updated_at
before update on public.integration_sync_jobs
for each row execute function public.set_updated_at();

alter table public.integrations enable row level security;
alter table public.integration_accounts enable row level security;
alter table public.integration_tokens enable row level security;
alter table public.integration_activity enable row level security;
alter table public.integration_sync_jobs enable row level security;

-- Catalog is readable by any authenticated user
drop policy if exists "Authenticated users can read integrations catalog" on public.integrations;
create policy "Authenticated users can read integrations catalog"
on public.integrations for select
to authenticated
using (true);

drop policy if exists "Members can view integration accounts" on public.integration_accounts;
create policy "Members can view integration accounts"
on public.integration_accounts for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert integration accounts" on public.integration_accounts;
create policy "Members can insert integration accounts"
on public.integration_accounts for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update integration accounts" on public.integration_accounts;
create policy "Members can update integration accounts"
on public.integration_accounts for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete integration accounts" on public.integration_accounts;
create policy "Members can delete integration accounts"
on public.integration_accounts for delete
to authenticated
using (public.is_workspace_member(workspace_id));

-- Tokens are service-role only (no authenticated select/insert/update/delete)
revoke all on public.integration_tokens from anon, authenticated;

drop policy if exists "Members can view integration activity" on public.integration_activity;
create policy "Members can view integration activity"
on public.integration_activity for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert integration activity" on public.integration_activity;
create policy "Members can insert integration activity"
on public.integration_activity for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can view sync jobs" on public.integration_sync_jobs;
create policy "Members can view sync jobs"
on public.integration_sync_jobs for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert sync jobs" on public.integration_sync_jobs;
create policy "Members can insert sync jobs"
on public.integration_sync_jobs for insert
to authenticated
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can update sync jobs" on public.integration_sync_jobs;
create policy "Members can update sync jobs"
on public.integration_sync_jobs for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select on public.integrations to authenticated;
grant select, insert, update, delete on public.integration_accounts to authenticated;
grant select, insert on public.integration_activity to authenticated;
grant select, insert, update on public.integration_sync_jobs to authenticated;

-- Seed launch catalog
insert into public.integrations (id, name, category, description, logo_key, featured, launch, kairos_actions) values
  ('gmail', 'Gmail', 'google', 'Sync and automate email with Kairos.', 'gmail', true, true, '["read_emails","search_emails","draft_reply","send_email"]'::jsonb),
  ('google-drive', 'Google Drive', 'google', 'Upload, search, and organize Drive files.', 'google-drive', true, true, '["upload_file","search_files","create_folder"]'::jsonb),
  ('google-calendar', 'Google Calendar', 'google', 'Schedule meetings and find availability.', 'google-calendar', true, true, '["create_meeting","cancel_meeting","find_availability"]'::jsonb),
  ('google-docs', 'Google Docs', 'google', 'Create and update Docs with AI assistance.', 'google-docs', false, true, '["create_doc","search_docs"]'::jsonb),
  ('outlook', 'Outlook', 'microsoft', 'Connect Outlook mail and calendar.', 'outlook', true, true, '["read_emails","send_email","create_meeting"]'::jsonb),
  ('onedrive', 'OneDrive', 'microsoft', 'Access and sync OneDrive files.', 'onedrive', false, true, '["upload_file","search_files"]'::jsonb),
  ('slack', 'Slack', 'communication', 'Post messages and read channels.', 'slack', true, true, '["send_message","read_channels"]'::jsonb),
  ('discord', 'Discord', 'communication', 'Send community alerts and updates.', 'discord', false, true, '["send_message"]'::jsonb),
  ('zoom', 'Zoom', 'communication', 'Create and manage Zoom meetings.', 'zoom', false, true, '["create_meeting"]'::jsonb),
  ('notion', 'Notion', 'productivity', 'Create pages and search your workspace notes.', 'notion', true, true, '["create_page","search_notes"]'::jsonb),
  ('trello', 'Trello', 'productivity', 'Manage boards and cards.', 'trello', false, true, '["create_card","list_boards"]'::jsonb),
  ('clickup', 'ClickUp', 'productivity', 'Create tasks and track projects.', 'clickup', false, true, '["create_task","list_tasks"]'::jsonb),
  ('asana', 'Asana', 'productivity', 'Coordinate team workflows and tasks.', 'asana', false, true, '["create_task","list_projects"]'::jsonb),
  ('github', 'GitHub', 'development', 'Issues, PRs, and repository access.', 'github', true, true, '["create_issue","create_pr","read_repositories"]'::jsonb),
  ('gitlab', 'GitLab', 'development', 'Merge requests and DevOps pipelines.', 'gitlab', false, true, '["create_issue","read_repositories"]'::jsonb),
  ('stripe', 'Stripe', 'finance', 'Payments, customers, and invoices.', 'stripe', true, true, '["list_payments","view_customers"]'::jsonb),
  ('paypal', 'PayPal', 'finance', 'View PayPal transactions and payouts.', 'paypal', false, true, '["list_payments"]'::jsonb),
  ('dropbox', 'Dropbox', 'storage', 'Sync and share Dropbox files.', 'dropbox', false, true, '["upload_file","search_files"]'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  logo_key = excluded.logo_key,
  featured = excluded.featured,
  launch = excluded.launch,
  kairos_actions = excluded.kairos_actions,
  updated_at = now();

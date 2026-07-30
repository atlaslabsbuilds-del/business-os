-- Milestone 14: Security dashboard, API keys, sessions, login history.

create table if not exists public.workspace_api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null check (length(name) between 1 and 80),
  key_prefix text not null,
  key_hash text not null,
  scopes text[] not null default array['read']::text[],
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_api_keys_workspace_idx
  on public.workspace_api_keys (workspace_id, created_at desc);
create unique index if not exists workspace_api_keys_hash_idx
  on public.workspace_api_keys (key_hash);

drop trigger if exists workspace_api_keys_set_updated_at on public.workspace_api_keys;
create trigger workspace_api_keys_set_updated_at
before update on public.workspace_api_keys
for each row execute function public.set_updated_at();

alter table public.workspace_api_keys enable row level security;
alter table public.workspace_api_keys force row level security;

drop policy if exists "Admins manage api keys" on public.workspace_api_keys;
create policy "Admins manage api keys"
on public.workspace_api_keys for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

grant select, insert, update, delete on public.workspace_api_keys to authenticated;

create table if not exists public.user_login_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  event_type text not null default 'login'
    check (event_type in ('login', 'logout', 'failed_login', 'mfa_challenge', 'password_reset')),
  ip_hash text,
  user_agent text,
  device_label text,
  location_hint text,
  success boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_login_history_user_idx
  on public.user_login_history (user_id, created_at desc);
create index if not exists user_login_history_workspace_idx
  on public.user_login_history (workspace_id, created_at desc);

alter table public.user_login_history enable row level security;
alter table public.user_login_history force row level security;

drop policy if exists "Users view own login history" on public.user_login_history;
create policy "Users view own login history"
on public.user_login_history for select
using (user_id = auth.uid());

drop policy if exists "Admins view workspace login history" on public.user_login_history;
create policy "Admins view workspace login history"
on public.user_login_history for select
using (
  workspace_id is not null
  and public.is_workspace_admin(workspace_id)
);

-- Inserts via service role / trusted server only for forged-resistant history.
revoke insert, update, delete on public.user_login_history from authenticated;
grant select on public.user_login_history to authenticated;

create table if not exists public.user_device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workspace_id uuid references public.workspaces (id) on delete set null,
  session_token_hash text not null,
  device_label text,
  device_type text not null default 'unknown'
    check (device_type in ('desktop', 'mobile', 'tablet', 'unknown')),
  browser text,
  os text,
  ip_hash text,
  user_agent text,
  last_active_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, session_token_hash)
);

create index if not exists user_device_sessions_user_idx
  on public.user_device_sessions (user_id, last_active_at desc);
create index if not exists user_device_sessions_active_idx
  on public.user_device_sessions (user_id)
  where revoked_at is null;

drop trigger if exists user_device_sessions_set_updated_at on public.user_device_sessions;
create trigger user_device_sessions_set_updated_at
before update on public.user_device_sessions
for each row execute function public.set_updated_at();

alter table public.user_device_sessions enable row level security;
alter table public.user_device_sessions force row level security;

drop policy if exists "Users manage own device sessions" on public.user_device_sessions;
create policy "Users manage own device sessions"
on public.user_device_sessions for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.user_device_sessions to authenticated;

-- Ensure MFA/session policy table exists (idempotent with prior foundation).
create table if not exists public.workspace_security_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  mfa_required boolean not null default false,
  session_timeout_minutes integer not null default 1440
    check (session_timeout_minutes between 15 and 43200),
  allow_api_keys boolean not null default true,
  rate_limit_per_minute integer not null default 120
    check (rate_limit_per_minute between 10 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_security_settings
  add column if not exists allow_api_keys boolean not null default true,
  add column if not exists rate_limit_per_minute integer not null default 120;

alter table public.workspace_security_settings enable row level security;
alter table public.workspace_security_settings force row level security;

drop policy if exists "Members can view security settings" on public.workspace_security_settings;
create policy "Members can view security settings"
on public.workspace_security_settings for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage security settings" on public.workspace_security_settings;
create policy "Admins can manage security settings"
on public.workspace_security_settings for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

grant select, insert, update on public.workspace_security_settings to authenticated;

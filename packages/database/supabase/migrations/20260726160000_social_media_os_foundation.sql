-- VanderBase Social Media OS foundation.

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('instagram','linkedin','twitter','facebook','youtube')),
  handle text not null,
  display_name text,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  external_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, platform, external_id)
);

create index if not exists social_accounts_workspace_idx
  on public.social_accounts (workspace_id, platform, status);

drop trigger if exists social_accounts_set_updated_at on public.social_accounts;
create trigger social_accounts_set_updated_at before update on public.social_accounts
for each row execute function public.set_updated_at();

alter table public.social_accounts enable row level security;
drop policy if exists "Members can view social accounts" on public.social_accounts;
create policy "Members can view social accounts" on public.social_accounts for select
using (public.is_workspace_member(workspace_id));
drop policy if exists "Admins can manage social accounts" on public.social_accounts;
create policy "Admins can manage social accounts" on public.social_accounts for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));
grant select, insert, update, delete on public.social_accounts to authenticated;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  assigned_to uuid references auth.users (id) on delete set null,
  source_content_id uuid references public.content_items (id) on delete set null,
  title text not null default 'Untitled social post',
  body text not null default '',
  media jsonb not null default '[]'::jsonb,
  platforms text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','queued','scheduled','published','failed')),
  approval_status text not null default 'not_required' check (approval_status in ('not_required','pending','approved','rejected')),
  scheduled_at timestamptz,
  published_at timestamptz,
  failure_reason text,
  analytics jsonb not null default '{"followers":0,"reach":0,"impressions":0,"engagementRate":0,"clicks":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_workspace_queue_idx
  on public.social_posts (workspace_id, status, scheduled_at);
create index if not exists social_posts_workspace_updated_idx
  on public.social_posts (workspace_id, updated_at desc);

drop trigger if exists social_posts_set_updated_at on public.social_posts;
create trigger social_posts_set_updated_at before update on public.social_posts
for each row execute function public.set_updated_at();

alter table public.social_posts enable row level security;
drop policy if exists "Members can view social posts" on public.social_posts;
create policy "Members can view social posts" on public.social_posts for select
using (public.is_workspace_member(workspace_id));
drop policy if exists "Members can create social posts" on public.social_posts;
create policy "Members can create social posts" on public.social_posts for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
drop policy if exists "Members can update social posts" on public.social_posts;
create policy "Members can update social posts" on public.social_posts for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
drop policy if exists "Members can delete social posts" on public.social_posts;
create policy "Members can delete social posts" on public.social_posts for delete
using (public.is_workspace_member(workspace_id));
grant select, insert, update, delete on public.social_posts to authenticated;

create table if not exists public.social_engagement (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid references public.social_accounts (id) on delete cascade,
  post_id uuid references public.social_posts (id) on delete cascade,
  engagement_type text not null check (engagement_type in ('comment','mention','message')),
  author_name text,
  body text not null,
  external_id text,
  status text not null default 'open' check (status in ('open','replied','archived')),
  reply_suggestion text,
  created_at timestamptz not null default now()
);

create index if not exists social_engagement_workspace_idx
  on public.social_engagement (workspace_id, status, created_at desc);
alter table public.social_engagement enable row level security;
drop policy if exists "Members can view social engagement" on public.social_engagement;
create policy "Members can view social engagement" on public.social_engagement for select
using (public.is_workspace_member(workspace_id));
grant select on public.social_engagement to authenticated;

create table if not exists public.social_analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  account_id uuid references public.social_accounts (id) on delete cascade,
  post_id uuid references public.social_posts (id) on delete cascade,
  captured_at timestamptz not null default now(),
  followers integer not null default 0,
  reach integer not null default 0,
  impressions integer not null default 0,
  engagement_rate numeric(8,4) not null default 0,
  clicks integer not null default 0
);

create index if not exists social_analytics_workspace_idx
  on public.social_analytics_snapshots (workspace_id, captured_at desc);
alter table public.social_analytics_snapshots enable row level security;
drop policy if exists "Members can view social analytics" on public.social_analytics_snapshots;
create policy "Members can view social analytics" on public.social_analytics_snapshots for select
using (public.is_workspace_member(workspace_id));
grant select on public.social_analytics_snapshots to authenticated;

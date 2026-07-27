-- VanderBase Content OS foundation.
-- Content records, brand voice, assets, and reusable templates.

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled content',
  body text not null default '',
  content_type text not null default 'linkedin',
  status text not null default 'draft'
    check (status in ('draft', 'scheduled', 'published', 'archived')),
  scheduled_at timestamptz,
  published_at timestamptz,
  tags text[] not null default '{}',
  ai_generated boolean not null default false,
  source_item_id uuid references public.content_items (id) on delete set null,
  analytics jsonb not null default '{"views":0,"engagement":0,"reach":0,"clicks":0}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_workspace_status_idx
  on public.content_items (workspace_id, status, updated_at desc);
create index if not exists content_items_workspace_calendar_idx
  on public.content_items (workspace_id, scheduled_at);

drop trigger if exists content_items_set_updated_at on public.content_items;
create trigger content_items_set_updated_at
before update on public.content_items
for each row execute function public.set_updated_at();

alter table public.content_items enable row level security;
drop policy if exists "Members can view content items" on public.content_items;
create policy "Members can view content items" on public.content_items for select
using (public.is_workspace_member(workspace_id));
drop policy if exists "Members can insert content items" on public.content_items;
create policy "Members can insert content items" on public.content_items for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
drop policy if exists "Members can update content items" on public.content_items;
create policy "Members can update content items" on public.content_items for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
drop policy if exists "Members can delete content items" on public.content_items;
create policy "Members can delete content items" on public.content_items for delete
using (public.is_workspace_member(workspace_id));
grant select, insert, update, delete on public.content_items to authenticated;

create table if not exists public.content_brand_voices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  tone text not null default '',
  writing_style text not null default '',
  cta_preferences text not null default '',
  keywords text[] not null default '{}',
  audience_profile text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists content_brand_voices_set_updated_at on public.content_brand_voices;
create trigger content_brand_voices_set_updated_at
before update on public.content_brand_voices
for each row execute function public.set_updated_at();
alter table public.content_brand_voices enable row level security;
drop policy if exists "Members can view content brand voice" on public.content_brand_voices;
create policy "Members can view content brand voice" on public.content_brand_voices for select
using (public.is_workspace_member(workspace_id));
drop policy if exists "Members can insert content brand voice" on public.content_brand_voices;
create policy "Members can insert content brand voice" on public.content_brand_voices for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
drop policy if exists "Members can update content brand voice" on public.content_brand_voices;
create policy "Members can update content brand voice" on public.content_brand_voices for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
grant select, insert, update on public.content_brand_voices to authenticated;

create table if not exists public.content_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  asset_type text not null default 'document',
  url text,
  storage_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists content_assets_workspace_idx
  on public.content_assets (workspace_id, created_at desc);
alter table public.content_assets enable row level security;
drop policy if exists "Members can manage content assets" on public.content_assets;
create policy "Members can manage content assets" on public.content_assets for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.content_assets to authenticated;

create table if not exists public.content_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  name text not null,
  template_type text not null,
  body text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_templates_workspace_idx
  on public.content_templates (workspace_id, template_type, created_at desc);
alter table public.content_templates enable row level security;
drop policy if exists "Members can view content templates" on public.content_templates;
create policy "Members can view content templates" on public.content_templates for select
using (workspace_id is null or public.is_workspace_member(workspace_id));
drop policy if exists "Members can manage workspace templates" on public.content_templates;
create policy "Members can manage workspace templates" on public.content_templates for all
using (workspace_id is not null and public.is_workspace_member(workspace_id))
with check (workspace_id is not null and public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.content_templates to authenticated;

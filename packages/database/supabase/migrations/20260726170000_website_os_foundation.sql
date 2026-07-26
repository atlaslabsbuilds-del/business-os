-- Personal Brand OS Website & Landing Pages foundation.

create table if not exists public.website_projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  project_type text not null default 'website'
    check (project_type in ('website','landing_page','link_in_bio','media_kit','portfolio')),
  template text not null default 'creator',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  slug text not null,
  theme jsonb not null default '{"primary":"#F97316","background":"#0B0B0F"}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{"views":0,"clicks":0,"submissions":0}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, slug)
);

create index if not exists website_projects_workspace_idx
  on public.website_projects (workspace_id, updated_at desc);
drop trigger if exists website_projects_set_updated_at on public.website_projects;
create trigger website_projects_set_updated_at before update on public.website_projects
for each row execute function public.set_updated_at();
alter table public.website_projects enable row level security;
drop policy if exists "Members can manage website projects" on public.website_projects;
create policy "Members can manage website projects" on public.website_projects for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.website_projects to authenticated;

create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.website_projects (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  slug text not null,
  blocks jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists website_pages_project_idx
  on public.website_pages (workspace_id, project_id, sort_order);
drop trigger if exists website_pages_set_updated_at on public.website_pages;
create trigger website_pages_set_updated_at before update on public.website_pages
for each row execute function public.set_updated_at();
alter table public.website_pages enable row level security;
drop policy if exists "Members can manage website pages" on public.website_pages;
create policy "Members can manage website pages" on public.website_pages for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.website_pages to authenticated;

create table if not exists public.website_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.website_projects (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  label text not null,
  url text not null,
  icon text,
  sort_order integer not null default 0,
  clicks integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists website_links_project_idx
  on public.website_links (workspace_id, project_id, sort_order);
alter table public.website_links enable row level security;
drop policy if exists "Members can manage website links" on public.website_links;
create policy "Members can manage website links" on public.website_links for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.website_links to authenticated;

create table if not exists public.website_forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.website_projects (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  name text not null,
  form_type text not null default 'contact' check (form_type in ('contact','lead_capture','newsletter')),
  fields jsonb not null default '[]'::jsonb,
  submissions integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.website_forms enable row level security;
drop policy if exists "Members can manage website forms" on public.website_forms;
create policy "Members can manage website forms" on public.website_forms for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());
grant select, insert, update, delete on public.website_forms to authenticated;

create table if not exists public.website_domains (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid references public.website_projects (id) on delete set null,
  domain text not null,
  status text not null default 'pending' check (status in ('pending','verified','error')),
  ssl_status text not null default 'pending' check (ssl_status in ('pending','active','error')),
  dns_instructions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, domain)
);

alter table public.website_domains enable row level security;
drop policy if exists "Members can manage website domains" on public.website_domains;
create policy "Members can manage website domains" on public.website_domains for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));
grant select, insert, update, delete on public.website_domains to authenticated;

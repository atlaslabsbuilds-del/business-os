-- Documents module foundation: documents, versions, folders, permissions,
-- comments, shares, and knowledge articles.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_status') then
    create type public.document_status as enum (
      'draft',
      'published',
      'archived',
      'trashed'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'document_share_permission') then
    create type public.document_share_permission as enum (
      'view',
      'comment',
      'edit',
      'owner'
    );
  end if;
end
$$;

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  parent_id uuid references public.folders (id) on delete cascade,
  name text not null,
  is_archived boolean not null default false,
  is_favorite boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.folder_permissions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  folder_id uuid not null references public.folders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  permission public.document_share_permission not null default 'view',
  created_at timestamptz not null default now(),
  unique (folder_id, user_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  owner_id uuid references auth.users (id) on delete set null,
  folder_id uuid references public.folders (id) on delete set null,
  title text not null default 'Untitled',
  content text not null default '',
  content_json jsonb not null default '{}'::jsonb,
  status public.document_status not null default 'draft',
  tags text[] not null default '{}',
  is_template boolean not null default false,
  is_favorite boolean not null default false,
  is_knowledge boolean not null default false,
  knowledge_category text,
  summary text,
  word_count integer not null default 0,
  last_edited_by uuid references auth.users (id) on delete set null,
  trashed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  content text not null,
  content_json jsonb not null default '{}'::jsonb,
  version_number integer not null default 1,
  change_summary text,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table if not exists public.document_comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  body text not null,
  mentions uuid[] not null default '{}',
  anchor text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_shares (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid not null references public.documents (id) on delete cascade,
  shared_by uuid not null references auth.users (id) on delete restrict,
  user_id uuid references auth.users (id) on delete cascade,
  email text,
  permission public.document_share_permission not null default 'view',
  created_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

create table if not exists public.knowledge_articles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  document_id uuid references public.documents (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete restrict,
  title text not null,
  category text not null default 'guides'
    check (category in ('wiki', 'company', 'policies', 'guides', 'playbooks')),
  summary text,
  body text not null default '',
  tags text[] not null default '{}',
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  default_share_permission public.document_share_permission not null default 'view',
  autosave_seconds integer not null default 3,
  enable_templates boolean not null default true,
  knowledge_categories jsonb not null default '["wiki","company","policies","guides","playbooks"]'::jsonb,
  permissions jsonb not null default '{"canShare":true,"canPublish":true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists folders_workspace_idx on public.folders (workspace_id, parent_id, position);
create index if not exists documents_workspace_idx on public.documents (workspace_id, updated_at desc);
create index if not exists documents_folder_idx on public.documents (folder_id);
create index if not exists documents_status_idx on public.documents (workspace_id, status);
create index if not exists document_versions_doc_idx on public.document_versions (document_id, version_number desc);
create index if not exists knowledge_articles_workspace_idx on public.knowledge_articles (workspace_id, category);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'folders',
    'documents',
    'document_comments',
    'knowledge_articles',
    'document_settings'
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

alter table public.folders enable row level security;
alter table public.folder_permissions enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_comments enable row level security;
alter table public.document_shares enable row level security;
alter table public.knowledge_articles enable row level security;
alter table public.document_settings enable row level security;

drop policy if exists "Members can manage folders" on public.folders;
create policy "Members can manage folders" on public.folders for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage folder permissions" on public.folder_permissions;
create policy "Members can manage folder permissions" on public.folder_permissions for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage documents" on public.documents;
create policy "Members can manage documents" on public.documents for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage document versions" on public.document_versions;
create policy "Members can manage document versions" on public.document_versions for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage document comments" on public.document_comments;
create policy "Members can manage document comments" on public.document_comments for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage document shares" on public.document_shares;
create policy "Members can manage document shares" on public.document_shares for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and shared_by = auth.uid());

drop policy if exists "Members can manage knowledge articles" on public.knowledge_articles;
create policy "Members can manage knowledge articles" on public.knowledge_articles for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage document settings" on public.document_settings;
create policy "Members can manage document settings" on public.document_settings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.folders to authenticated;
grant select, insert, update, delete on public.folder_permissions to authenticated;
grant select, insert, update, delete on public.documents to authenticated;
grant select, insert, update, delete on public.document_versions to authenticated;
grant select, insert, update, delete on public.document_comments to authenticated;
grant select, insert, update, delete on public.document_shares to authenticated;
grant select, insert, update, delete on public.knowledge_articles to authenticated;
grant select, insert, update, delete on public.document_settings to authenticated;

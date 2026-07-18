-- Workspace foundation: multi-tenant workspaces, members, invitations
-- Keeps existing profiles + platform user_roles. Adds workspace_* tables.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'workspace_role') then
    create type public.workspace_role as enum ('owner', 'admin', 'member');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
  end if;
end
$$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_by uuid not null references auth.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Each user may own at most one workspace.
create unique index if not exists workspace_members_one_owned_workspace_idx
  on public.workspace_members (user_id)
  where role = 'owner';

create index if not exists workspace_members_user_id_idx
  on public.workspace_members (user_id);

create index if not exists workspace_members_workspace_id_idx
  on public.workspace_members (workspace_id);

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  status public.invitation_status not null default 'pending',
  invited_by uuid not null references auth.users (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitations_role_not_owner check (role in ('admin', 'member'))
);

create unique index if not exists invitations_pending_workspace_email_idx
  on public.invitations (workspace_id, lower(email))
  where status = 'pending';

create index if not exists invitations_workspace_id_idx
  on public.invitations (workspace_id);

create index if not exists invitations_email_idx
  on public.invitations (lower(email));

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists workspace_members_set_updated_at on public.workspace_members;
create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
before update on public.invitations
for each row execute function public.set_updated_at();

-- Ensure profile exists for every auth user (idempotent with initial migration).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.create_workspace(workspace_name text, workspace_slug text)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  created public.workspaces;
begin
  if current_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if exists (
    select 1
    from public.workspace_members
    where user_id = current_user_id
      and role = 'owner'
  ) then
    raise exception 'WORKSPACE_LIMIT_REACHED';
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (workspace_name, workspace_slug, current_user_id)
  returning * into created;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (created.id, current_user_id, 'owner');

  return created;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.invitations enable row level security;

drop policy if exists "Members can view their workspaces" on public.workspaces;
create policy "Members can view their workspaces"
on public.workspaces
for select
using (public.is_workspace_member(id));

drop policy if exists "Owners can update their workspaces" on public.workspaces;
create policy "Owners can update their workspaces"
on public.workspaces
for update
using (
  exists (
    select 1
    from public.workspace_members
    where workspace_id = workspaces.id
      and user_id = auth.uid()
      and role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.workspace_members
    where workspace_id = workspaces.id
      and user_id = auth.uid()
      and role = 'owner'
  )
);

drop policy if exists "Authenticated users can create workspaces via RPC" on public.workspaces;
-- Inserts happen through security definer RPC; no direct insert policy needed.

drop policy if exists "Members can view workspace membership" on public.workspace_members;
create policy "Members can view workspace membership"
on public.workspace_members
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage workspace members" on public.workspace_members;
create policy "Admins can manage workspace members"
on public.workspace_members
for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "Members can view invitations" on public.invitations;
create policy "Members can view invitations"
on public.invitations
for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage invitations" on public.invitations;
create policy "Admins can manage invitations"
on public.invitations
for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

grant usage on schema public to authenticated;
grant select, update on public.workspaces to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.invitations to authenticated;
grant execute on function public.create_workspace(text, text) to authenticated;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.is_workspace_admin(uuid) to authenticated;

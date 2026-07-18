-- Workspace management: logo, owner delete, transfer ownership RPCs

alter table public.workspaces
  add column if not exists logo_url text;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
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
      and role = 'owner'
  );
$$;

drop policy if exists "Owners can delete their workspaces" on public.workspaces;
create policy "Owners can delete their workspaces"
on public.workspaces
for delete
using (public.is_workspace_owner(id));

create or replace function public.transfer_workspace_ownership(
  target_workspace_id uuid,
  new_owner_user_id uuid
)
returns public.workspaces
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  workspace_row public.workspaces;
begin
  if current_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'FORBIDDEN';
  end if;

  if new_owner_user_id = current_user_id then
    raise exception 'INVALID_TRANSFER_TARGET';
  end if;

  if not exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = new_owner_user_id
  ) then
    raise exception 'TARGET_NOT_MEMBER';
  end if;

  if exists (
    select 1
    from public.workspace_members
    where user_id = new_owner_user_id
      and role = 'owner'
      and workspace_id <> target_workspace_id
  ) then
    raise exception 'TARGET_ALREADY_OWNS_WORKSPACE';
  end if;

  update public.workspace_members
  set role = 'admin', updated_at = now()
  where workspace_id = target_workspace_id
    and user_id = current_user_id
    and role = 'owner';

  update public.workspace_members
  set role = 'owner', updated_at = now()
  where workspace_id = target_workspace_id
    and user_id = new_owner_user_id;

  update public.workspaces
  set created_by = new_owner_user_id, updated_at = now()
  where id = target_workspace_id
  returning * into workspace_row;

  return workspace_row;
end;
$$;

create or replace function public.delete_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_workspace_owner(target_workspace_id) then
    raise exception 'FORBIDDEN';
  end if;

  delete from public.workspaces where id = target_workspace_id;
end;
$$;

grant execute on function public.is_workspace_owner(uuid) to authenticated;
grant execute on function public.transfer_workspace_ownership(uuid, uuid) to authenticated;
grant execute on function public.delete_workspace(uuid) to authenticated;
grant delete on public.workspaces to authenticated;

-- Allow workspace teammates to view each other's profiles (for Team page).
drop policy if exists "Workspace members can view teammate profiles" on public.profiles;
create policy "Workspace members can view teammate profiles"
on public.profiles
for select
using (
  exists (
    select 1
    from public.workspace_members me
    join public.workspace_members teammate
      on teammate.workspace_id = me.workspace_id
    where me.user_id = auth.uid()
      and teammate.user_id = profiles.id
  )
);

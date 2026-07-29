-- Notifications center: categories, per-user read state, preferences, realtime

alter table public.workspace_notifications
  add column if not exists category text not null default 'system_update',
  add column if not exists priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  add column if not exists recipient_user_id uuid references auth.users (id) on delete cascade;

create index if not exists workspace_notifications_category_idx
  on public.workspace_notifications (workspace_id, category, created_at desc);

create index if not exists workspace_notifications_recipient_idx
  on public.workspace_notifications (workspace_id, recipient_user_id, created_at desc)
  where recipient_user_id is not null;

create table if not exists public.user_notification_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  notification_id uuid not null references public.workspace_notifications (id) on delete cascade,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, notification_id)
);

create index if not exists user_notification_states_user_idx
  on public.user_notification_states (user_id, read_at);

create index if not exists user_notification_states_notification_idx
  on public.user_notification_states (notification_id);

drop trigger if exists user_notification_states_set_updated_at on public.user_notification_states;
create trigger user_notification_states_set_updated_at
before update on public.user_notification_states
for each row execute function public.set_updated_at();

alter table public.user_notification_states enable row level security;
alter table public.user_notification_states force row level security;

drop policy if exists "Users manage own notification states" on public.user_notification_states;
create policy "Users manage own notification states"
on public.user_notification_states for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.user_notification_states to authenticated;

create table if not exists public.user_notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_notifications boolean not null default true,
  in_app_notifications boolean not null default true,
  marketing_emails boolean not null default false,
  product_updates boolean not null default true,
  security_alerts boolean not null default true,
  billing_alerts boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists user_notification_preferences_set_updated_at on public.user_notification_preferences;
create trigger user_notification_preferences_set_updated_at
before update on public.user_notification_preferences
for each row execute function public.set_updated_at();

alter table public.user_notification_preferences enable row level security;
alter table public.user_notification_preferences force row level security;

drop policy if exists "Users manage own notification preferences" on public.user_notification_preferences;
create policy "Users manage own notification preferences"
on public.user_notification_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.user_notification_preferences to authenticated;

-- Members can delete notifications they can view (per-user dismiss via states; workspace delete for admins remains)
drop policy if exists "Members can delete workspace notifications" on public.workspace_notifications;
create policy "Members can delete workspace notifications"
on public.workspace_notifications for delete
using (public.is_workspace_member(workspace_id));

-- Realtime for instant in-app delivery
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.workspace_notifications;
  end if;
exception
  when duplicate_object then null;
end
$$;

-- AI smart reply draft history (local cache + Gmail draft id)

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_ai_reply_style') then
    create type public.inbox_ai_reply_style as enum (
      'professional',
      'friendly',
      'concise',
      'detailed'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'inbox_ai_reply_status') then
    create type public.inbox_ai_reply_status as enum (
      'draft',
      'sent',
      'discarded'
    );
  end if;
end
$$;

create table if not exists public.inbox_ai_reply_drafts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  account_id uuid references public.inbox_accounts (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  style public.inbox_ai_reply_style not null default 'professional',
  body text not null,
  subject text,
  gmail_draft_id text,
  gmail_message_id text,
  status public.inbox_ai_reply_status not null default 'draft',
  credits_used integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists inbox_ai_reply_drafts_thread_idx
  on public.inbox_ai_reply_drafts (workspace_id, thread_id, created_at desc);

create index if not exists inbox_ai_reply_drafts_status_idx
  on public.inbox_ai_reply_drafts (workspace_id, status);

drop trigger if exists inbox_ai_reply_drafts_set_updated_at on public.inbox_ai_reply_drafts;
create trigger inbox_ai_reply_drafts_set_updated_at
before update on public.inbox_ai_reply_drafts
for each row execute function public.set_updated_at();

alter table public.inbox_ai_reply_drafts enable row level security;

drop policy if exists "Members can view inbox ai reply drafts" on public.inbox_ai_reply_drafts;
create policy "Members can view inbox ai reply drafts"
on public.inbox_ai_reply_drafts for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert inbox ai reply drafts" on public.inbox_ai_reply_drafts;
create policy "Members can insert inbox ai reply drafts"
on public.inbox_ai_reply_drafts for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update inbox ai reply drafts" on public.inbox_ai_reply_drafts;
create policy "Members can update inbox ai reply drafts"
on public.inbox_ai_reply_drafts for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete inbox ai reply drafts" on public.inbox_ai_reply_drafts;
create policy "Members can delete inbox ai reply drafts"
on public.inbox_ai_reply_drafts for delete
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.inbox_ai_reply_drafts to authenticated;

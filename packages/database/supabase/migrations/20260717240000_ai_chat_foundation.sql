-- AI Chat + Credit Engine foundation

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  model text not null default 'gpt-4o-mini',
  provider text not null default 'openai',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text not null default '',
  model text,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_credits (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  balance bigint not null default 10000 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount bigint not null,
  reason text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_workspace_user_idx
  on public.ai_conversations (workspace_id, user_id, updated_at desc);

create index if not exists ai_conversations_pinned_idx
  on public.ai_conversations (workspace_id, user_id, pinned desc, updated_at desc);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at asc);

create index if not exists credit_transactions_workspace_idx
  on public.credit_transactions (workspace_id, created_at desc);

drop trigger if exists ai_conversations_set_updated_at on public.ai_conversations;
create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

drop trigger if exists workspace_credits_set_updated_at on public.workspace_credits;
create trigger workspace_credits_set_updated_at
before update on public.workspace_credits
for each row execute function public.set_updated_at();

create or replace function public.ensure_workspace_credits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_credits (workspace_id, balance)
  values (new.id, 10000)
  on conflict (workspace_id) do nothing;
  return new;
end;
$$;

drop trigger if exists workspaces_ensure_credits on public.workspaces;
create trigger workspaces_ensure_credits
after insert on public.workspaces
for each row execute function public.ensure_workspace_credits();

create or replace function public.deduct_workspace_credits(
  target_workspace_id uuid,
  deduct_amount bigint,
  reason text,
  metadata jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_balance bigint;
begin
  if current_user_id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'FORBIDDEN';
  end if;

  if deduct_amount <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  insert into public.workspace_credits (workspace_id, balance)
  values (target_workspace_id, 10000)
  on conflict (workspace_id) do nothing;

  update public.workspace_credits
  set balance = balance - deduct_amount,
      updated_at = now()
  where workspace_id = target_workspace_id
    and balance >= deduct_amount
  returning balance into new_balance;

  if new_balance is null then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  insert into public.credit_transactions (workspace_id, user_id, amount, reason, metadata)
  values (target_workspace_id, current_user_id, -deduct_amount, reason, metadata);

  return new_balance;
end;
$$;

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.workspace_credits enable row level security;
alter table public.credit_transactions enable row level security;

drop policy if exists "Members can view workspace conversations" on public.ai_conversations;
create policy "Members can view workspace conversations"
on public.ai_conversations for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can create conversations" on public.ai_conversations;
create policy "Members can create conversations"
on public.ai_conversations for insert
with check (
  public.is_workspace_member(workspace_id)
  and user_id = auth.uid()
);

drop policy if exists "Owners can update own conversations" on public.ai_conversations;
create policy "Owners can update own conversations"
on public.ai_conversations for update
using (user_id = auth.uid() and public.is_workspace_member(workspace_id))
with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "Owners can delete own conversations" on public.ai_conversations;
create policy "Owners can delete own conversations"
on public.ai_conversations for delete
using (user_id = auth.uid() and public.is_workspace_member(workspace_id));

drop policy if exists "Members can view conversation messages" on public.ai_messages;
create policy "Members can view conversation messages"
on public.ai_messages for select
using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and public.is_workspace_member(c.workspace_id)
  )
);

drop policy if exists "Members can insert conversation messages" on public.ai_messages;
create policy "Members can insert conversation messages"
on public.ai_messages for insert
with check (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = auth.uid()
      and public.is_workspace_member(c.workspace_id)
  )
);

drop policy if exists "Members can delete conversation messages" on public.ai_messages;
create policy "Members can delete conversation messages"
on public.ai_messages for delete
using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = auth.uid()
      and public.is_workspace_member(c.workspace_id)
  )
);

drop policy if exists "Members can view workspace credits" on public.workspace_credits;
create policy "Members can view workspace credits"
on public.workspace_credits for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can view credit transactions" on public.credit_transactions;
create policy "Members can view credit transactions"
on public.credit_transactions for select
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.ai_conversations to authenticated;
grant select, insert, delete on public.ai_messages to authenticated;
grant select on public.workspace_credits to authenticated;
grant select on public.credit_transactions to authenticated;
grant execute on function public.deduct_workspace_credits(uuid, bigint, text, jsonb) to authenticated;

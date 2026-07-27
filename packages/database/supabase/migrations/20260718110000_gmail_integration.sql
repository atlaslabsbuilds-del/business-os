-- VanderBase Gmail integration: sync cursors, AI classification, upsert indexes

alter table public.inbox_accounts
  add column if not exists history_id text;

alter table public.inbox_accounts
  add column if not exists sync_error text;

alter table public.inbox_threads
  add column if not exists ai_priority text;

alter table public.inbox_threads
  add column if not exists ai_classification text;

alter table public.inbox_threads
  add column if not exists ai_suggested_actions jsonb not null default '[]'::jsonb;

create unique index if not exists inbox_threads_account_external_uidx
  on public.inbox_threads (account_id, external_id)
  where external_id is not null;

create unique index if not exists inbox_messages_account_external_uidx
  on public.inbox_messages (account_id, external_id)
  where external_id is not null;

create unique index if not exists inbox_labels_account_external_uidx
  on public.inbox_labels (account_id, external_id)
  where account_id is not null and external_id is not null;

create index if not exists inbox_accounts_history_idx
  on public.inbox_accounts (workspace_id, provider, history_id);

create index if not exists inbox_threads_ai_priority_idx
  on public.inbox_threads (workspace_id, ai_priority)
  where ai_priority is not null;

-- VanderBase Finance foundation. All records are workspace-scoped and use real
-- user-entered or provider-synced values. Provider-specific fields are kept in
-- metadata so Stripe/Razorpay/bank adapters can be added without a migration.

create table if not exists public.finance_invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  customer_id uuid references public.crm_companies (id) on delete set null,
  customer_name text not null,
  invoice_number text not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(14, 2) not null default 0,
  tax numeric(14, 2) not null default 0,
  discount numeric(14, 2) not null default 0,
  total numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  notes text,
  due_date date,
  paid_at timestamptz,
  provider text,
  provider_invoice_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, invoice_number)
);

create index if not exists finance_invoices_workspace_idx
  on public.finance_invoices (workspace_id, created_at desc);
create index if not exists finance_invoices_status_idx
  on public.finance_invoices (workspace_id, status);

create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  category text not null,
  vendor text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  expense_date date not null default current_date,
  notes text,
  receipt_path text,
  status text not null default 'recorded'
    check (status in ('recorded', 'reimbursable', 'reimbursed', 'void')),
  provider text,
  provider_transaction_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_expenses_workspace_idx
  on public.finance_expenses (workspace_id, expense_date desc);
create index if not exists finance_expenses_category_idx
  on public.finance_expenses (workspace_id, category);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  type text not null check (type in ('income', 'expense', 'refund', 'manual')),
  description text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  transaction_date date not null default current_date,
  reference_id uuid,
  provider text,
  provider_transaction_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists finance_transactions_workspace_idx
  on public.finance_transactions (workspace_id, transaction_date desc, created_at desc);

drop trigger if exists finance_invoices_set_updated_at on public.finance_invoices;
create trigger finance_invoices_set_updated_at before update on public.finance_invoices
for each row execute function public.set_updated_at();
drop trigger if exists finance_expenses_set_updated_at on public.finance_expenses;
create trigger finance_expenses_set_updated_at before update on public.finance_expenses
for each row execute function public.set_updated_at();

alter table public.finance_invoices enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.finance_transactions enable row level security;

drop policy if exists "Members can manage finance invoices" on public.finance_invoices;
create policy "Members can manage finance invoices" on public.finance_invoices for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance expenses" on public.finance_expenses;
create policy "Members can manage finance expenses" on public.finance_expenses for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance transactions" on public.finance_transactions;
create policy "Members can manage finance transactions" on public.finance_transactions for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

grant select, insert, update, delete on public.finance_invoices to authenticated;
grant select, insert, update, delete on public.finance_expenses to authenticated;
grant select, insert, update, delete on public.finance_transactions to authenticated;

insert into storage.buckets (id, name, public)
values ('finance-receipts', 'finance-receipts', false)
on conflict (id) do nothing;

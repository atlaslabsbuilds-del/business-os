-- Finance module expansion: normalized entities, budgets, cash flow, reports,
-- and workspace-level finance preferences.

create table if not exists public.finance_customers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  crm_company_id uuid references public.crm_companies (id) on delete set null,
  name text not null,
  email text,
  phone text,
  billing_address text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_vendors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null,
  email text,
  category text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_invoice_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  invoice_id uuid not null references public.finance_invoices (id) on delete cascade,
  description text not null,
  quantity numeric(14, 3) not null default 1 check (quantity > 0),
  unit_price numeric(14, 2) not null default 0 check (unit_price >= 0),
  amount numeric(14, 2) not null default 0 check (amount >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  name text not null,
  category text,
  department text,
  period_start date not null,
  period_end date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  alert_threshold numeric(5, 2) not null default 80 check (alert_threshold between 0 and 100),
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (period_end >= period_start)
);

create table if not exists public.finance_cash_flow (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  flow_type text not null check (flow_type in ('in', 'out')),
  description text not null,
  category text,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'USD',
  flow_date date not null default current_date,
  is_forecast boolean not null default false,
  status text not null default 'projected' check (status in ('projected', 'confirmed', 'cancelled')),
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete restrict,
  report_type text not null check (report_type in ('profit_loss', 'balance_sheet', 'cash_flow', 'revenue', 'expense', 'tax')),
  period_start date not null,
  period_end date not null,
  title text not null,
  summary text,
  data jsonb not null default '{}'::jsonb,
  format text not null default 'json' check (format in ('json', 'csv', 'pdf')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  currency text not null default 'USD',
  tax_rate numeric(5, 2) not null default 0 check (tax_rate between 0 and 100),
  invoice_number_format text not null default 'INV-{YYYY}-{####}',
  fiscal_year_start_month integer not null default 1 check (fiscal_year_start_month between 1 and 12),
  payment_methods jsonb not null default '["bank_transfer","card","cash"]'::jsonb,
  default_categories jsonb not null default '["Software","Payroll","Marketing","Travel","Operations"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_customers_workspace_idx on public.finance_customers (workspace_id, name);
create index if not exists finance_vendors_workspace_idx on public.finance_vendors (workspace_id, name);
create index if not exists finance_invoice_items_invoice_idx on public.finance_invoice_items (workspace_id, invoice_id, sort_order);
create index if not exists finance_budgets_workspace_period_idx on public.finance_budgets (workspace_id, period_start, period_end);
create index if not exists finance_cash_flow_workspace_date_idx on public.finance_cash_flow (workspace_id, flow_date desc);
create index if not exists finance_reports_workspace_created_idx on public.finance_reports (workspace_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'finance_customers',
    'finance_vendors',
    'finance_invoice_items',
    'finance_budgets',
    'finance_cash_flow',
    'finance_reports',
    'finance_settings'
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

alter table public.finance_customers enable row level security;
alter table public.finance_vendors enable row level security;
alter table public.finance_invoice_items enable row level security;
alter table public.finance_budgets enable row level security;
alter table public.finance_cash_flow enable row level security;
alter table public.finance_reports enable row level security;
alter table public.finance_settings enable row level security;

drop policy if exists "Members can manage finance customers" on public.finance_customers;
create policy "Members can manage finance customers" on public.finance_customers for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance vendors" on public.finance_vendors;
create policy "Members can manage finance vendors" on public.finance_vendors for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance invoice items" on public.finance_invoice_items;
create policy "Members can manage finance invoice items" on public.finance_invoice_items for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage finance budgets" on public.finance_budgets;
create policy "Members can manage finance budgets" on public.finance_budgets for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance cash flow" on public.finance_cash_flow;
create policy "Members can manage finance cash flow" on public.finance_cash_flow for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance reports" on public.finance_reports;
create policy "Members can manage finance reports" on public.finance_reports for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can manage finance settings" on public.finance_settings;
create policy "Members can manage finance settings" on public.finance_settings for all
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.finance_customers to authenticated;
grant select, insert, update, delete on public.finance_vendors to authenticated;
grant select, insert, update, delete on public.finance_invoice_items to authenticated;
grant select, insert, update, delete on public.finance_budgets to authenticated;
grant select, insert, update, delete on public.finance_cash_flow to authenticated;
grant select, insert, update, delete on public.finance_reports to authenticated;
grant select, insert, update, delete on public.finance_settings to authenticated;

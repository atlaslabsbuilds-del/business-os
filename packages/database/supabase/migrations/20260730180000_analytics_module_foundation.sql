-- Executive analytics foundation: dashboards, widgets, saved reports, insights, forecasts.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'analytics_widget_type') then
    create type public.analytics_widget_type as enum ('metric','line','bar','area','pie','heatmap','table');
  end if;
end
$$;

create table if not exists public.analytics_dashboards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  description text,
  is_default boolean not null default false,
  layout jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.analytics_widgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  dashboard_id uuid not null references public.analytics_dashboards(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  title text not null,
  metric_key text not null,
  widget_type public.analytics_widget_type not null default 'metric',
  position integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.analytics_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  report_type text not null default 'executive',
  filters jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  report_id uuid references public.analytics_reports(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null,
  schedule text,
  recipients text[] not null default '{}',
  last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  body text not null,
  category text not null default 'business_health',
  severity text not null default 'info' check (severity in ('info','success','warning','critical')),
  score integer check (score between 0 and 100),
  action_url text,
  data jsonb not null default '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.analytics_forecasts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  metric_key text not null,
  period_start date not null,
  period_end date not null,
  predicted_value numeric(14,2) not null default 0,
  confidence numeric(5,2) not null default 0 check (confidence between 0 and 100),
  methodology text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists analytics_dashboards_workspace_idx on public.analytics_dashboards(workspace_id, updated_at desc);
create index if not exists analytics_widgets_dashboard_idx on public.analytics_widgets(dashboard_id, position);
create index if not exists analytics_reports_workspace_idx on public.analytics_reports(workspace_id, generated_at desc);
create index if not exists ai_insights_workspace_idx on public.ai_insights(workspace_id, created_at desc);
create index if not exists analytics_forecasts_metric_idx on public.analytics_forecasts(workspace_id, metric_key, period_end desc);

do $$
declare table_name text;
begin
  foreach table_name in array array['analytics_dashboards','analytics_widgets','analytics_reports','saved_reports','ai_insights','analytics_forecasts'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', table_name, table_name);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists "Members can manage %s" on public.%I', table_name, table_name);
    execute format('create policy "Members can manage %s" on public.%I for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id))', table_name, table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

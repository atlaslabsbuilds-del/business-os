-- VanderBase CRM foundation: workspace-scoped contacts, companies, deals, activities, notes, tags

do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_lifecycle_stage') then
    create type public.crm_lifecycle_stage as enum (
      'lead',
      'qualified',
      'customer',
      'churned',
      'other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_deal_stage') then
    create type public.crm_deal_stage as enum (
      'qualified',
      'proposal',
      'negotiation',
      'won',
      'lost'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_activity_type') then
    create type public.crm_activity_type as enum (
      'call',
      'email',
      'meeting',
      'task',
      'note',
      'other'
    );
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_entity_type') then
    create type public.crm_entity_type as enum (
      'contact',
      'company',
      'deal',
      'lead'
    );
  end if;
end
$$;

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  domain text,
  industry text,
  website text,
  phone text,
  description text,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid references public.crm_companies (id) on delete set null,
  first_name text not null default '',
  last_name text not null default '',
  email text,
  phone text,
  title text,
  lifecycle_stage public.crm_lifecycle_stage not null default 'lead',
  source text,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  company_id uuid references public.crm_companies (id) on delete set null,
  contact_id uuid references public.crm_contacts (id) on delete set null,
  title text not null,
  amount numeric(14, 2) not null default 0,
  currency text not null default 'USD',
  stage public.crm_deal_stage not null default 'qualified',
  probability integer not null default 10 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type public.crm_activity_type not null default 'task',
  subject text not null,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  company_id uuid references public.crm_companies (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete cascade,
  owner_id uuid references auth.users (id) on delete set null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  body text not null,
  contact_id uuid references public.crm_contacts (id) on delete cascade,
  company_id uuid references public.crm_companies (id) on delete cascade,
  deal_id uuid references public.crm_deals (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_notes_has_parent check (
    contact_id is not null or company_id is not null or deal_id is not null
  )
);

create table if not exists public.crm_tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null,
  color text not null default '#4f46e5',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, name)
);

create table if not exists public.crm_taggings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  tag_id uuid not null references public.crm_tags (id) on delete cascade,
  entity_type public.crm_entity_type not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (tag_id, entity_type, entity_id)
);

create index if not exists crm_companies_workspace_idx on public.crm_companies (workspace_id, updated_at desc);
create index if not exists crm_companies_name_idx on public.crm_companies (workspace_id, lower(name));
create index if not exists crm_contacts_workspace_idx on public.crm_contacts (workspace_id, updated_at desc);
create index if not exists crm_contacts_stage_idx on public.crm_contacts (workspace_id, lifecycle_stage);
create index if not exists crm_contacts_email_idx on public.crm_contacts (workspace_id, lower(email));
create index if not exists crm_contacts_company_idx on public.crm_contacts (company_id);
create index if not exists crm_deals_workspace_idx on public.crm_deals (workspace_id, updated_at desc);
create index if not exists crm_deals_stage_idx on public.crm_deals (workspace_id, stage);
create index if not exists crm_activities_workspace_idx on public.crm_activities (workspace_id, created_at desc);
create index if not exists crm_notes_workspace_idx on public.crm_notes (workspace_id, created_at desc);
create index if not exists crm_tags_workspace_idx on public.crm_tags (workspace_id, lower(name));
create index if not exists crm_taggings_entity_idx on public.crm_taggings (workspace_id, entity_type, entity_id);

drop trigger if exists crm_companies_set_updated_at on public.crm_companies;
create trigger crm_companies_set_updated_at
before update on public.crm_companies
for each row execute function public.set_updated_at();

drop trigger if exists crm_contacts_set_updated_at on public.crm_contacts;
create trigger crm_contacts_set_updated_at
before update on public.crm_contacts
for each row execute function public.set_updated_at();

drop trigger if exists crm_deals_set_updated_at on public.crm_deals;
create trigger crm_deals_set_updated_at
before update on public.crm_deals
for each row execute function public.set_updated_at();

drop trigger if exists crm_activities_set_updated_at on public.crm_activities;
create trigger crm_activities_set_updated_at
before update on public.crm_activities
for each row execute function public.set_updated_at();

drop trigger if exists crm_notes_set_updated_at on public.crm_notes;
create trigger crm_notes_set_updated_at
before update on public.crm_notes
for each row execute function public.set_updated_at();

drop trigger if exists crm_tags_set_updated_at on public.crm_tags;
create trigger crm_tags_set_updated_at
before update on public.crm_tags
for each row execute function public.set_updated_at();

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_notes enable row level security;
alter table public.crm_tags enable row level security;
alter table public.crm_taggings enable row level security;

-- Companies
drop policy if exists "Members can view crm companies" on public.crm_companies;
create policy "Members can view crm companies"
on public.crm_companies for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm companies" on public.crm_companies;
create policy "Members can insert crm companies"
on public.crm_companies for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm companies" on public.crm_companies;
create policy "Members can update crm companies"
on public.crm_companies for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm companies" on public.crm_companies;
create policy "Members can delete crm companies"
on public.crm_companies for delete
using (public.is_workspace_member(workspace_id));

-- Contacts
drop policy if exists "Members can view crm contacts" on public.crm_contacts;
create policy "Members can view crm contacts"
on public.crm_contacts for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm contacts" on public.crm_contacts;
create policy "Members can insert crm contacts"
on public.crm_contacts for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm contacts" on public.crm_contacts;
create policy "Members can update crm contacts"
on public.crm_contacts for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm contacts" on public.crm_contacts;
create policy "Members can delete crm contacts"
on public.crm_contacts for delete
using (public.is_workspace_member(workspace_id));

-- Deals
drop policy if exists "Members can view crm deals" on public.crm_deals;
create policy "Members can view crm deals"
on public.crm_deals for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm deals" on public.crm_deals;
create policy "Members can insert crm deals"
on public.crm_deals for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm deals" on public.crm_deals;
create policy "Members can update crm deals"
on public.crm_deals for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm deals" on public.crm_deals;
create policy "Members can delete crm deals"
on public.crm_deals for delete
using (public.is_workspace_member(workspace_id));

-- Activities
drop policy if exists "Members can view crm activities" on public.crm_activities;
create policy "Members can view crm activities"
on public.crm_activities for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm activities" on public.crm_activities;
create policy "Members can insert crm activities"
on public.crm_activities for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm activities" on public.crm_activities;
create policy "Members can update crm activities"
on public.crm_activities for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm activities" on public.crm_activities;
create policy "Members can delete crm activities"
on public.crm_activities for delete
using (public.is_workspace_member(workspace_id));

-- Notes
drop policy if exists "Members can view crm notes" on public.crm_notes;
create policy "Members can view crm notes"
on public.crm_notes for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm notes" on public.crm_notes;
create policy "Members can insert crm notes"
on public.crm_notes for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm notes" on public.crm_notes;
create policy "Members can update crm notes"
on public.crm_notes for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm notes" on public.crm_notes;
create policy "Members can delete crm notes"
on public.crm_notes for delete
using (public.is_workspace_member(workspace_id));

-- Tags
drop policy if exists "Members can view crm tags" on public.crm_tags;
create policy "Members can view crm tags"
on public.crm_tags for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm tags" on public.crm_tags;
create policy "Members can insert crm tags"
on public.crm_tags for insert
with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update crm tags" on public.crm_tags;
create policy "Members can update crm tags"
on public.crm_tags for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm tags" on public.crm_tags;
create policy "Members can delete crm tags"
on public.crm_tags for delete
using (public.is_workspace_member(workspace_id));

-- Taggings
drop policy if exists "Members can view crm taggings" on public.crm_taggings;
create policy "Members can view crm taggings"
on public.crm_taggings for select
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert crm taggings" on public.crm_taggings;
create policy "Members can insert crm taggings"
on public.crm_taggings for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Members can delete crm taggings" on public.crm_taggings;
create policy "Members can delete crm taggings"
on public.crm_taggings for delete
using (public.is_workspace_member(workspace_id));

grant select, insert, update, delete on public.crm_companies to authenticated;
grant select, insert, update, delete on public.crm_contacts to authenticated;
grant select, insert, update, delete on public.crm_deals to authenticated;
grant select, insert, update, delete on public.crm_activities to authenticated;
grant select, insert, update, delete on public.crm_notes to authenticated;
grant select, insert, update, delete on public.crm_tags to authenticated;
grant select, insert, delete on public.crm_taggings to authenticated;

-- VanderBase pre-launch waitlist.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  team_size text not null
    check (team_size in ('1', '2-10', '11-50', '51-200', '200+')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'converted', 'unsubscribed')),
  referral_code text not null,
  referred_by uuid references public.waitlist (id) on delete set null,
  share_company_publicly boolean not null default false,
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email),
  constraint waitlist_referral_code_unique unique (referral_code)
);

create index if not exists waitlist_created_at_idx
  on public.waitlist (created_at asc);

create index if not exists waitlist_referred_by_idx
  on public.waitlist (referred_by)
  where referred_by is not null;

create index if not exists waitlist_referral_code_idx
  on public.waitlist (referral_code);

alter table public.waitlist enable row level security;

grant select, insert, update on public.waitlist to service_role;

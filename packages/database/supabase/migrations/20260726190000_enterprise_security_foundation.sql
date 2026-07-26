-- Enterprise security foundation.
-- This migration is additive: existing application tables and flows remain intact.

do $$
begin
  alter type public.workspace_role add value if not exists 'manager';
  alter type public.workspace_role add value if not exists 'guest';
exception
  when undefined_object then null;
end
$$;

alter table public.invitations
  drop constraint if exists invitations_role_not_owner;
alter table public.invitations
  add constraint invitations_role_not_owner
  check (role::text in ('admin', 'manager', 'member', 'guest'));

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null check (length(event_type) between 1 and 100),
  resource_type text,
  resource_id text,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists security_audit_logs_workspace_created_idx
  on public.security_audit_logs (workspace_id, created_at desc);
create index if not exists security_audit_logs_actor_created_idx
  on public.security_audit_logs (actor_user_id, created_at desc);
create index if not exists security_audit_logs_event_created_idx
  on public.security_audit_logs (event_type, created_at desc);

alter table public.security_audit_logs enable row level security;

drop policy if exists "Members can view workspace audit logs" on public.security_audit_logs;
create policy "Members can view workspace audit logs"
on public.security_audit_logs for select
using (
  workspace_id is not null
  and public.is_workspace_member(workspace_id)
  and public.is_workspace_admin(workspace_id)
);

-- Audit records are written by trusted server code using the service role.
-- No authenticated client may forge or delete audit history.
revoke all on public.security_audit_logs from anon, authenticated;
grant select on public.security_audit_logs to authenticated;

-- OAuth credentials are server-only. Public application clients retain
-- normal account metadata access, but cannot select the secret columns.
revoke select (access_token, refresh_token) on public.inbox_accounts from authenticated;
revoke select (access_token, refresh_token) on public.social_accounts from authenticated;

-- Ensure all public application tables are protected even when a future
-- migration creates a table without remembering to enable RLS.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'organizations', 'organization_members', 'user_roles',
    'workspaces', 'workspace_members', 'invitations',
    'ai_conversations', 'ai_messages', 'workspace_credits', 'credit_transactions',
    'inbox_accounts', 'inbox_threads', 'inbox_messages', 'inbox_labels',
    'inbox_thread_labels', 'inbox_attachments', 'inbox_tasks',
    'inbox_calendar_events', 'inbox_ai_reply_drafts',
    'crm_companies', 'crm_contacts', 'crm_deals', 'crm_activities',
    'crm_notes', 'crm_tags', 'crm_taggings',
    'content_items', 'content_brand_voices', 'content_assets', 'content_templates',
    'social_accounts', 'social_posts', 'social_engagement', 'social_analytics_snapshots',
    'website_projects', 'website_pages', 'website_links', 'website_forms',
    'website_domains', 'calendar_booking_links', 'calendar_availability',
    'calendar_meeting_notes', 'calendar_reminders', 'workspace_notifications',
    'workspace_activity_events', 'workspace_ai_memory', 'security_audit_logs',
    'workspace_ai_settings', 'kairos_agent_runs', 'ai_output_versions',
    'workspace_onboarding_progress', 'workspace_ai_suggestions'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('alter table public.%I enable row level security', table_name);
      execute format('alter table public.%I force row level security', table_name);
    end if;
  end loop;
end
$$;

-- Explicitly prevent anonymous access to every application table.
revoke all on all tables in schema public from anon;

-- Prepared MFA/session policy storage. Supabase Auth performs the challenge;
-- these workspace controls provide a stable place for future enforcement.
create table if not exists public.workspace_security_settings (
  workspace_id uuid primary key references public.workspaces (id) on delete cascade,
  mfa_required boolean not null default false,
  session_timeout_minutes integer not null default 1440
    check (session_timeout_minutes between 15 and 43200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspace_security_settings enable row level security;
alter table public.workspace_security_settings force row level security;
drop policy if exists "Members can view security settings" on public.workspace_security_settings;
create policy "Members can view security settings"
on public.workspace_security_settings for select
using (public.is_workspace_member(workspace_id));
drop policy if exists "Admins can manage security settings" on public.workspace_security_settings;
create policy "Admins can manage security settings"
on public.workspace_security_settings for all
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));
grant select, insert, update on public.workspace_security_settings to authenticated;

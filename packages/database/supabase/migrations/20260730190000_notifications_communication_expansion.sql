-- Milestone 13: Notifications & Communication expansion
-- Extends workspace_notifications foundation with archive, channels,
-- templates, delivery queue, and richer preference controls.

alter table public.user_notification_states
  add column if not exists archived_at timestamptz;

create index if not exists user_notification_states_archived_idx
  on public.user_notification_states (user_id, archived_at)
  where archived_at is not null;

alter table public.user_notification_preferences
  add column if not exists push_notifications boolean not null default true,
  add column if not exists browser_notifications boolean not null default false,
  add column if not exists webhook_events boolean not null default false,
  add column if not exists sms_notifications boolean not null default false,
  add column if not exists quiet_hours_enabled boolean not null default false,
  add column if not exists quiet_hours_start time,
  add column if not exists quiet_hours_end time,
  add column if not exists do_not_disturb boolean not null default false,
  add column if not exists priority_min text not null default 'low'
    check (priority_min in ('low', 'normal', 'high', 'urgent')),
  add column if not exists channel_overrides jsonb not null default '{}'::jsonb;

-- Source-of-truth tables map to milestone names:
-- notifications → workspace_notifications
-- notification_preferences → user_notification_preferences
-- activity_logs → workspace_activity_events

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete cascade,
  key text not null,
  category text not null default 'system_update',
  title_template text not null,
  body_template text,
  default_priority text not null default 'normal'
    check (default_priority in ('low', 'normal', 'high', 'urgent')),
  channels text[] not null default array['in_app']::text[],
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, key)
);

create index if not exists notification_templates_workspace_idx
  on public.notification_templates (workspace_id, category);

drop trigger if exists notification_templates_set_updated_at on public.notification_templates;
create trigger notification_templates_set_updated_at
before update on public.notification_templates
for each row execute function public.set_updated_at();

alter table public.notification_templates enable row level security;
alter table public.notification_templates force row level security;

drop policy if exists "Members can view notification templates" on public.notification_templates;
create policy "Members can view notification templates"
on public.notification_templates for select
using (
  workspace_id is null
  or public.is_workspace_member(workspace_id)
);

drop policy if exists "Admins can manage notification templates" on public.notification_templates;
create policy "Admins can manage notification templates"
on public.notification_templates for all
using (
  workspace_id is not null
  and public.is_workspace_admin(workspace_id)
)
with check (
  workspace_id is not null
  and public.is_workspace_admin(workspace_id)
);

grant select, insert, update, delete on public.notification_templates to authenticated;

create table if not exists public.delivery_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  notification_id uuid references public.workspace_notifications (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  channel text not null
    check (channel in ('in_app', 'email', 'push', 'browser', 'webhook', 'sms')),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'sent', 'failed', 'cancelled', 'skipped')),
  attempts integer not null default 0,
  scheduled_for timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists delivery_queue_status_idx
  on public.delivery_queue (status, scheduled_for);
create index if not exists delivery_queue_workspace_idx
  on public.delivery_queue (workspace_id, created_at desc);
create index if not exists delivery_queue_user_idx
  on public.delivery_queue (user_id, status);

drop trigger if exists delivery_queue_set_updated_at on public.delivery_queue;
create trigger delivery_queue_set_updated_at
before update on public.delivery_queue
for each row execute function public.set_updated_at();

alter table public.delivery_queue enable row level security;
alter table public.delivery_queue force row level security;

drop policy if exists "Users can view own delivery queue" on public.delivery_queue;
create policy "Users can view own delivery queue"
on public.delivery_queue for select
using (
  public.is_workspace_member(workspace_id)
  and (user_id is null or user_id = auth.uid() or public.is_workspace_admin(workspace_id))
);

-- Queue writes are server-driven; authenticated users may insert for their workspace.
drop policy if exists "Members can enqueue deliveries" on public.delivery_queue;
create policy "Members can enqueue deliveries"
on public.delivery_queue for insert
with check (public.is_workspace_member(workspace_id));

drop policy if exists "Admins can manage delivery queue" on public.delivery_queue;
create policy "Admins can manage delivery queue"
on public.delivery_queue for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

grant select, insert, update on public.delivery_queue to authenticated;

-- Seed system templates (workspace_id null = global defaults)
insert into public.notification_templates (workspace_id, key, category, title_template, body_template, default_priority, channels)
select null, v.key, v.category, v.title_template, v.body_template, v.default_priority, v.channels
from (values
  ('task_assigned', 'task_assigned', 'Task assigned: {{title}}', '{{body}}', 'high', array['in_app','email','push']::text[]),
  ('task_completed', 'task_completed', 'Task completed: {{title}}', '{{body}}', 'normal', array['in_app']::text[]),
  ('project_updated', 'project_updated', 'Project updated: {{title}}', '{{body}}', 'normal', array['in_app','email']::text[]),
  ('crm_activity', 'crm_activity', 'CRM activity: {{title}}', '{{body}}', 'normal', array['in_app']::text[]),
  ('invoice_paid', 'invoice_paid', 'Invoice paid: {{title}}', '{{body}}', 'normal', array['in_app','email']::text[]),
  ('invoice_overdue', 'invoice_overdue', 'Invoice overdue: {{title}}', '{{body}}', 'high', array['in_app','email','push']::text[]),
  ('meeting_reminder', 'meeting_reminder', 'Meeting reminder: {{title}}', '{{body}}', 'high', array['in_app','push','browser']::text[]),
  ('calendar_invite', 'calendar_invite', 'Calendar invite: {{title}}', '{{body}}', 'normal', array['in_app','email']::text[]),
  ('document_shared', 'document_shared', 'Document shared: {{title}}', '{{body}}', 'normal', array['in_app','email']::text[]),
  ('mention', 'mention', 'You were mentioned: {{title}}', '{{body}}', 'high', array['in_app','push']::text[]),
  ('comment', 'comment', 'New comment: {{title}}', '{{body}}', 'normal', array['in_app']::text[]),
  ('team_invite', 'team_invite', 'Team invitation: {{title}}', '{{body}}', 'high', array['in_app','email']::text[]),
  ('system_alert', 'system_alert', 'System alert: {{title}}', '{{body}}', 'high', array['in_app','email']::text[]),
  ('ai_recommendation', 'ai_recommendation', 'Kairos: {{title}}', '{{body}}', 'normal', array['in_app']::text[]),
  ('security_alert', 'security_alert', 'Security alert: {{title}}', '{{body}}', 'urgent', array['in_app','email','push']::text[]),
  ('integration_alert', 'integration_alert', 'Integration alert: {{title}}', '{{body}}', 'high', array['in_app','email']::text[]),
  ('billing_alert', 'billing_alert', 'Billing alert: {{title}}', '{{body}}', 'high', array['in_app','email']::text[])
) as v(key, category, title_template, body_template, default_priority, channels)
where not exists (
  select 1 from public.notification_templates t
  where t.workspace_id is null and t.key = v.key
);

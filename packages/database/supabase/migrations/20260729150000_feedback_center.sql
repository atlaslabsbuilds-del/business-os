-- VanderBase Feedback Center: user feedback, votes, screenshots, roadmap

create table if not exists public.feedback_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null
    check (category in ('feature_request', 'bug_report', 'improvement', 'general')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'submitted'
    check (status in ('submitted', 'in_review', 'planned', 'in_progress', 'completed', 'rejected')),
  screenshot_path text,
  assignee_id uuid references auth.users (id) on delete set null,
  vote_count integer not null default 0 check (vote_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_items_workspace_idx
  on public.feedback_items (workspace_id, created_at desc);
create index if not exists feedback_items_status_idx
  on public.feedback_items (workspace_id, status, created_at desc);
create index if not exists feedback_items_category_idx
  on public.feedback_items (workspace_id, category);
create index if not exists feedback_items_roadmap_idx
  on public.feedback_items (status, vote_count desc)
  where status in ('planned', 'in_progress', 'completed')
    and category = 'feature_request';
create index if not exists feedback_items_reporter_idx
  on public.feedback_items (created_by, created_at desc);

drop trigger if exists feedback_items_set_updated_at on public.feedback_items;
create trigger feedback_items_set_updated_at
before update on public.feedback_items
for each row execute function public.set_updated_at();

create table if not exists public.feedback_votes (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback_items (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (feedback_id, user_id)
);

create index if not exists feedback_votes_feedback_idx
  on public.feedback_votes (feedback_id);
create index if not exists feedback_votes_user_idx
  on public.feedback_votes (user_id);

alter table public.feedback_items enable row level security;
alter table public.feedback_items force row level security;
alter table public.feedback_votes enable row level security;
alter table public.feedback_votes force row level security;

-- Workspace members can view feedback in their workspace
drop policy if exists "Members can view feedback" on public.feedback_items;
create policy "Members can view feedback"
on public.feedback_items for select
using (public.is_workspace_member(workspace_id));

-- Authenticated users can read roadmap-visible feature requests (for public page via SSR service role or anon through needed)
-- Public roadmap uses server-side service/admin or authenticated SSR; keep member select above.
-- Allow anyone authenticated to read roadmap items (planned/in_progress/completed feature requests)
drop policy if exists "Authenticated can view roadmap feedback" on public.feedback_items;
create policy "Authenticated can view roadmap feedback"
on public.feedback_items for select
using (
  auth.role() = 'authenticated'
  and category = 'feature_request'
  and status in ('planned', 'in_progress', 'completed')
);

drop policy if exists "Members can create feedback" on public.feedback_items;
create policy "Members can create feedback"
on public.feedback_items for insert
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

drop policy if exists "Authors can update own feedback" on public.feedback_items;
create policy "Authors can update own feedback"
on public.feedback_items for update
using (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
)
with check (
  public.is_workspace_member(workspace_id)
  and created_by = auth.uid()
);

-- Workspace admins can manage all feedback (status, assignee)
drop policy if exists "Admins can manage feedback" on public.feedback_items;
create policy "Admins can manage feedback"
on public.feedback_items for update
using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

drop policy if exists "Admins can delete feedback" on public.feedback_items;
create policy "Admins can delete feedback"
on public.feedback_items for delete
using (public.is_workspace_admin(workspace_id));

-- Votes: authenticated users can vote on roadmap items they can see
drop policy if exists "Users can view votes" on public.feedback_votes;
create policy "Users can view votes"
on public.feedback_votes for select
using (auth.uid() = user_id or exists (
  select 1 from public.feedback_items f
  where f.id = feedback_id
    and (
      public.is_workspace_member(f.workspace_id)
      or (
        f.category = 'feature_request'
        and f.status in ('planned', 'in_progress', 'completed')
      )
    )
));

drop policy if exists "Users can vote" on public.feedback_votes;
create policy "Users can vote"
on public.feedback_votes for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.feedback_items f
    where f.id = feedback_id
      and f.category = 'feature_request'
      and f.status in ('planned', 'in_progress', 'completed', 'submitted', 'in_review')
  )
);

drop policy if exists "Users can remove own vote" on public.feedback_votes;
create policy "Users can remove own vote"
on public.feedback_votes for delete
using (auth.uid() = user_id);

grant select, insert, update, delete on public.feedback_items to authenticated;
grant select, insert, delete on public.feedback_votes to authenticated;

-- Keep vote_count in sync
create or replace function public.feedback_refresh_vote_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.feedback_id, old.feedback_id);
  update public.feedback_items
  set vote_count = (
    select count(*)::integer from public.feedback_votes where feedback_id = target_id
  )
  where id = target_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists feedback_votes_refresh_count on public.feedback_votes;
create trigger feedback_votes_refresh_count
after insert or delete on public.feedback_votes
for each row execute function public.feedback_refresh_vote_count();

insert into storage.buckets (id, name, public)
values ('feedback-screenshots', 'feedback-screenshots', false)
on conflict (id) do nothing;

-- Structured AI email summary for inbox threads (cacheable JSON payload)

alter table public.inbox_threads
  add column if not exists ai_summary_structured jsonb;

comment on column public.inbox_threads.ai_summary_structured is
  'Cached structured AI email summary: shortSummary, actionItems, priority, deadlines, people, money';

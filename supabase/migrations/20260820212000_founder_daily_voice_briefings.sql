-- Private, structured briefings created from Nasirr's daily founder voice memos.

create table if not exists public.founder_daily_briefings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  briefing_date date not null,
  summary text not null default '',
  completed jsonb not null default '[]'::jsonb check (jsonb_typeof(completed) = 'array'),
  decisions jsonb not null default '[]'::jsonb check (jsonb_typeof(decisions) = 'array'),
  blockers jsonb not null default '[]'::jsonb check (jsonb_typeof(blockers) = 'array'),
  tomorrow_priorities jsonb not null default '[]'::jsonb check (jsonb_typeof(tomorrow_priorities) = 'array'),
  week_focus jsonb not null default '[]'::jsonb check (jsonb_typeof(week_focus) = 'array'),
  source text not null default 'voice-memo' check (source in ('voice-memo', 'manual', 'codex')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, briefing_date)
);

create index if not exists founder_daily_briefings_owner_date_idx
on public.founder_daily_briefings (owner_id, briefing_date desc);

alter table public.founder_daily_briefings enable row level security;

create policy "Founder only daily briefings select"
on public.founder_daily_briefings for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only daily briefings insert"
on public.founder_daily_briefings for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only daily briefings update"
on public.founder_daily_briefings for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only daily briefings delete"
on public.founder_daily_briefings for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_daily_briefings from anon;
grant select, insert, update, delete on public.founder_daily_briefings to authenticated;

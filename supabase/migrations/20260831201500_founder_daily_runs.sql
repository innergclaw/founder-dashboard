-- Private daily and weekly operating reports for the Founder Dashboard.

create table if not exists public.founder_daily_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_date date not null,
  run_type text not null default 'daily' check (run_type in ('daily', 'weekly')),
  title text not null default '',
  summary text not null default '',
  changed jsonb not null default '[]'::jsonb check (jsonb_typeof(changed) = 'array'),
  decisions jsonb not null default '[]'::jsonb check (jsonb_typeof(decisions) = 'array'),
  failures jsonb not null default '[]'::jsonb check (jsonb_typeof(failures) = 'array'),
  resume_next jsonb not null default '[]'::jsonb check (jsonb_typeof(resume_next) = 'array'),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, run_date, run_type)
);

create index if not exists founder_daily_runs_owner_date_idx
on public.founder_daily_runs (owner_id, run_date desc, run_type);

alter table public.founder_daily_runs enable row level security;

create policy "Founder only daily runs select"
on public.founder_daily_runs for select to authenticated
using (
  (select auth.uid()) = owner_id
  and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid
);

revoke all on public.founder_daily_runs from anon;
revoke all on public.founder_daily_runs from authenticated;
grant select on public.founder_daily_runs to authenticated;

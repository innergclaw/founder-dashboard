-- Cloud synchronization telemetry for the private Founder Dashboard.

alter table public.founder_projects
  add column if not exists last_repo_push_at timestamptz,
  add column if not exists live_status integer,
  add column if not exists repo_state jsonb not null default '{}'::jsonb,
  add column if not exists sync_source text;

create table if not exists public.founder_sync_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('github-actions', 'dashboard-manual', 'codex-skill')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed', 'skipped')),
  projects_checked integer not null default 0 check (projects_checked >= 0),
  projects_updated integer not null default 0 check (projects_updated >= 0),
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists founder_sync_runs_owner_started_idx
on public.founder_sync_runs (owner_id, started_at desc);

alter table public.founder_sync_runs enable row level security;

create policy "Founder only sync runs select" on public.founder_sync_runs for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_sync_runs from anon;
grant select on public.founder_sync_runs to authenticated;


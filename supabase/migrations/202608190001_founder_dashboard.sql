-- Founder Dashboard cloud model.
-- Static hosting is public; every data row is restricted to the founder's Auth UID.

create table if not exists public.founder_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand text not null check (brand in ('OWNYOURWEB', 'INNERGINTEL', 'SHOPNASGFX')),
  name text not null,
  summary text not null default '',
  status text not null default 'active' check (status in ('active', 'attention', 'paused', 'complete')),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  live_url text,
  repo_url text,
  next_action text not null default '',
  health smallint not null default 80 check (health between 0 and 100),
  sort_order integer not null default 0,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, brand, name)
);

create table if not exists public.founder_schedules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand text not null check (brand in ('OWNYOURWEB', 'INNERGINTEL', 'SHOPNASGFX', 'PERSONAL')),
  name text not null,
  schedule_label text not null,
  rrule text,
  next_run_at timestamptz,
  status text not null default 'active' check (status in ('active', 'paused', 'complete')),
  source text not null default 'dashboard',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, source, name)
);

create table if not exists public.founder_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand text not null check (brand in ('OWNYOURWEB', 'INNERGINTEL', 'SHOPNASGFX', 'PERSONAL')),
  title text not null check (char_length(title) between 1 and 160),
  details text not null default '',
  status text not null default 'queued' check (status in ('queued', 'in_progress', 'waiting', 'done')),
  priority text not null default 'medium' check (priority in ('urgent', 'high', 'medium', 'low')),
  due_at timestamptz,
  source text not null default 'dashboard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists founder_jobs_owner_status_due_idx
on public.founder_jobs (owner_id, status, due_at);

alter table public.founder_projects enable row level security;
alter table public.founder_schedules enable row level security;
alter table public.founder_jobs enable row level security;

create policy "Founder only projects select" on public.founder_projects for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only projects insert" on public.founder_projects for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only projects update" on public.founder_projects for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only projects delete" on public.founder_projects for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only schedules select" on public.founder_schedules for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only schedules insert" on public.founder_schedules for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only schedules update" on public.founder_schedules for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only schedules delete" on public.founder_schedules for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only jobs select" on public.founder_jobs for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only jobs insert" on public.founder_jobs for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only jobs update" on public.founder_jobs for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder only jobs delete" on public.founder_jobs for delete to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_projects, public.founder_schedules, public.founder_jobs from anon;
grant select, insert, update, delete on public.founder_projects, public.founder_schedules, public.founder_jobs to authenticated;

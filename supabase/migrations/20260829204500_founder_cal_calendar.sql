-- Private Cal.com booking mirror for the Founder Dashboard.

create table if not exists public.founder_calendar_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  booking_uid text not null,
  title text not null,
  status text not null default 'accepted',
  start_at timestamptz not null,
  end_at timestamptz not null,
  location text,
  attendee_names text[] not null default '{}',
  host_names text[] not null default '{}',
  event_type_id bigint,
  source text not null default 'cal.com',
  is_current boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, booking_uid)
);

create table if not exists public.founder_calendar_sync_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_type text not null check (run_type in ('morning', 'evening', 'manual', 'test')),
  status text not null default 'running' check (status in ('running', 'success', 'failed')),
  bookings_checked integer not null default 0 check (bookings_checked >= 0),
  today_count integer not null default 0 check (today_count >= 0),
  week_count integer not null default 0 check (week_count >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists founder_calendar_events_owner_start_idx
on public.founder_calendar_events (owner_id, start_at);

create index if not exists founder_calendar_sync_runs_owner_started_idx
on public.founder_calendar_sync_runs (owner_id, started_at desc);

alter table public.founder_calendar_events enable row level security;
alter table public.founder_calendar_sync_runs enable row level security;

create policy "Founder only calendar events select"
on public.founder_calendar_events for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only calendar sync runs select"
on public.founder_calendar_sync_runs for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_calendar_events, public.founder_calendar_sync_runs from anon;
grant select on public.founder_calendar_events, public.founder_calendar_sync_runs to authenticated;


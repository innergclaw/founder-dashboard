-- Proactive briefing and alert layer for the private Founder Dashboard.

create table if not exists public.founder_notification_preferences (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'America/New_York',
  morning_brief_hour smallint not null default 7 check (morning_brief_hour between 0 and 23),
  midday_brief_hour smallint not null default 12 check (midday_brief_hour between 0 and 23),
  evening_brief_hour smallint not null default 18 check (evening_brief_hour between 0 and 23),
  reminder_lead_hours smallint not null default 24 check (reminder_lead_hours between 1 and 168),
  telegram_enabled boolean not null default true,
  email_enabled boolean not null default false,
  browser_enabled boolean not null default false,
  apple_messages_enabled boolean not null default false,
  quiet_hours_start smallint not null default 21 check (quiet_hours_start between 0 and 23),
  quiet_hours_end smallint not null default 7 check (quiet_hours_end between 0 and 23),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.founder_alerts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand text check (brand in ('OWNYOURWEB', 'INNERGINTEL', 'SHOPNASGFX', 'PERSONAL')),
  title text not null check (char_length(title) between 1 and 160),
  message text not null default '',
  severity text not null default 'info' check (severity in ('info', 'attention', 'urgent')),
  source text not null check (source in ('daily-brief', 'deadline', 'project-health', 'schedule', 'system')),
  status text not null default 'unread' check (status in ('unread', 'read', 'dismissed')),
  action_url text,
  fingerprint text not null,
  event_at timestamptz,
  expires_at timestamptz,
  delivery jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, fingerprint)
);

create table if not exists public.founder_brief_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_type text not null check (run_type in ('morning', 'midday', 'evening', 'pulse', 'manual', 'test')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed', 'skipped')),
  alerts_created integer not null default 0 check (alerts_created >= 0),
  summary jsonb not null default '{}'::jsonb,
  deliveries jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists founder_alerts_owner_status_created_idx
on public.founder_alerts (owner_id, status, created_at desc);

create index if not exists founder_alerts_owner_event_idx
on public.founder_alerts (owner_id, event_at);

create index if not exists founder_brief_runs_owner_started_idx
on public.founder_brief_runs (owner_id, started_at desc);

alter table public.founder_notification_preferences enable row level security;
alter table public.founder_alerts enable row level security;
alter table public.founder_brief_runs enable row level security;

create policy "Founder only notification preferences select"
on public.founder_notification_preferences for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only notification preferences insert"
on public.founder_notification_preferences for insert to authenticated
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only notification preferences update"
on public.founder_notification_preferences for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only alerts select"
on public.founder_alerts for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only alerts update"
on public.founder_alerts for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create policy "Founder only brief runs select"
on public.founder_brief_runs for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all on public.founder_notification_preferences, public.founder_alerts, public.founder_brief_runs from anon;
grant select, insert, update on public.founder_notification_preferences to authenticated;
grant select, update on public.founder_alerts to authenticated;
grant select on public.founder_brief_runs to authenticated;

insert into public.founder_notification_preferences (owner_id)
values ('75677100-97b7-4578-92c5-cf131997b580'::uuid)
on conflict (owner_id) do nothing;

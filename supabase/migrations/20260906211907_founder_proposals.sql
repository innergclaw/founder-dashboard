create table public.founder_proposals (
id uuid primary key default gen_random_uuid(),
owner_id uuid not null references auth.users(id) on delete cascade,
brand text not null default 'OWNYOURWEB' check (brand in ('OWNYOURWEB','INNERGINTEL','SHOPNASGFX')),
organization text not null check (char_length(organization) between 1 and 180),
title text not null check (char_length(title) between 1 and 250),
buyer_type text not null default 'Organization',
status text not null default 'inquired' check (status in ('inquired','in_communication','no_reply','confirmed')),
budget_max numeric(12,2) not null check (budget_max >= 0),
proposal_due date,
inquired_on date,
last_reply_on date,
source_url text not null default '',
email_url text not null default '',
notes text not null default '' check (char_length(notes) <= 4000),
next_action text not null default '' check (char_length(next_action) <= 2000),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
unique(owner_id,organization,title)
);
create index founder_proposals_owner_status_idx on public.founder_proposals(owner_id,status);
alter table public.founder_proposals enable row level security;
create policy "Founder proposals read" on public.founder_proposals for select to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder proposals update" on public.founder_proposals for update to authenticated
using ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
with check ((select auth.uid()) = owner_id and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
revoke all on public.founder_proposals from public, anon, authenticated;
grant select on public.founder_proposals to authenticated;
grant update(status,notes,next_action,updated_at) on public.founder_proposals to authenticated;
grant all on public.founder_proposals to service_role;
notify pgrst, 'reload schema';

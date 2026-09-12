-- Private founder comment inbox. Apply only after review and deployment approval.
-- Existing approved comments remain public. No existing pending comment is approved.
begin;

create schema if not exists private;

alter table public.innerg_read_feedback
  add column review_status text,
  add column reviewed_at timestamptz,
  add column reviewed_by uuid,
  add column review_version integer not null default 0;

-- Old approvals have no recorded reviewer or date. Do not invent either value.
update public.innerg_read_feedback
set review_status = case when approved then 'approved' else 'pending' end;

alter table public.innerg_read_feedback
  alter column review_status set default 'pending',
  alter column review_status set not null,
  add constraint innerg_feedback_review_status_check
    check (review_status in ('pending', 'approved', 'denied')),
  add constraint innerg_feedback_review_version_check check (review_version >= 0),
  add constraint innerg_feedback_approval_matches_review
    check (approved = (review_status = 'approved'));

create index innerg_feedback_review_queue_idx
  on public.innerg_read_feedback (review_status, created_at desc, id);

-- Metadata only. Comment text and reader_hash never enter this audit table.
create table public.innerg_read_feedback_reviews (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.innerg_read_feedback(id) on delete restrict,
  owner_id uuid not null default '75677100-97b7-4578-92c5-cf131997b580'::uuid
    check (owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid),
  previous_status text not null check (previous_status in ('pending', 'approved', 'denied')),
  review_status text not null check (review_status in ('approved', 'denied')),
  review_version integer not null check (review_version > 0),
  reviewed_by uuid not null
    check (reviewed_by = '75677100-97b7-4578-92c5-cf131997b580'::uuid),
  reviewed_at timestamptz not null,
  unique (feedback_id, review_version)
);

alter table public.innerg_read_feedback enable row level security;
alter table public.innerg_read_feedback_reviews enable row level security;

-- Remove both table and column privileges. Revoking one does not remove the other.
revoke all privileges on table public.innerg_read_feedback from public, anon, authenticated;
revoke all privileges (id, slug, reader_hash, message, approved, created_at,
  submitted_day, review_status, reviewed_at, reviewed_by, review_version)
  on table public.innerg_read_feedback from public, anon, authenticated;
grant select (id, slug, message, approved, created_at, review_status, reviewed_at, review_version)
  on public.innerg_read_feedback to authenticated;
grant update (review_status) on public.innerg_read_feedback to authenticated;

-- Existing policies are preserved. Restrictive guards prevent an older permissive
-- policy from widening access after the safe column grants above take effect.
create policy "Founder feedback select"
  on public.innerg_read_feedback for select to authenticated
  using ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder feedback select guard"
  on public.innerg_read_feedback as restrictive for select to authenticated
  using ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder feedback update"
  on public.innerg_read_feedback for update to authenticated
  using ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
  with check ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid);
create policy "Founder feedback update guard"
  on public.innerg_read_feedback as restrictive for update to authenticated
  using ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid)
  with check ((select auth.uid()) = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

revoke all privileges on public.innerg_read_feedback_reviews
  from public, anon, authenticated, service_role;
grant select (id, feedback_id, previous_status, review_status, review_version, reviewed_at)
  on public.innerg_read_feedback_reviews to authenticated;
create policy "Founder feedback audit select"
  on public.innerg_read_feedback_reviews for select to authenticated
  using ((select auth.uid()) = owner_id
    and owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid);

create function private.innerg_feedback_prepare_review()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    -- The public submission service cannot publish a comment during insertion.
    NEW.review_status := 'pending';
    NEW.approved := false;
    NEW.reviewed_at := null;
    NEW.reviewed_by := null;
    NEW.review_version := 0;
    return NEW;
  end if;

  if auth.uid() is distinct from '75677100-97b7-4578-92c5-cf131997b580'::uuid then
    raise exception 'Only the founder can moderate comments' using errcode = '42501';
  end if;

  if NEW.id is distinct from OLD.id
    or NEW.slug is distinct from OLD.slug
    or NEW.reader_hash is distinct from OLD.reader_hash
    or NEW.message is distinct from OLD.message
    or NEW.created_at is distinct from OLD.created_at
    or NEW.submitted_day is distinct from OLD.submitted_day
    or NEW.approved is distinct from OLD.approved
    or NEW.reviewed_at is distinct from OLD.reviewed_at
    or NEW.reviewed_by is distinct from OLD.reviewed_by
    or NEW.review_version is distinct from OLD.review_version then
    raise exception 'Only review_status can be changed' using errcode = '42501';
  end if;

  if NEW.review_status is not distinct from OLD.review_status then
    return NEW;
  end if;
  if NEW.review_status is null or NEW.review_status not in ('approved', 'denied') then
    raise exception 'Choose approved or denied' using errcode = '22023';
  end if;

  NEW.approved := NEW.review_status = 'approved';
  NEW.reviewed_at := clock_timestamp();
  NEW.reviewed_by := auth.uid();
  NEW.review_version := OLD.review_version + 1;
  return NEW;
end;
$$;

-- Definer rights are required for internal audit/alert writes, which browser
-- roles cannot insert. Both update branches verify the founder explicitly.
create function private.innerg_feedback_record_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.review_status <> 'pending' or NEW.approved then
      raise exception 'New comments must await review' using errcode = '23514';
    end if;
    insert into public.founder_alerts
      (owner_id, brand, title, message, severity, source, action_url, fingerprint, event_at)
    values
      ('75677100-97b7-4578-92c5-cf131997b580'::uuid, 'INNERGINTEL',
       'New reader comment', 'A reader comment is waiting for your review.',
       'attention', 'system', 'https://innergclaw.github.io/founder-dashboard/#comments',
       'innerg-read-feedback:' || NEW.id::text, NEW.created_at)
    on conflict (owner_id, fingerprint) do nothing;
    return NEW;
  end if;

  if auth.uid() is distinct from '75677100-97b7-4578-92c5-cf131997b580'::uuid then
    raise exception 'Only the founder can moderate comments' using errcode = '42501';
  end if;
  if NEW.review_status is not distinct from OLD.review_status then
    return NEW;
  end if;

  insert into public.innerg_read_feedback_reviews
    (feedback_id, previous_status, review_status, review_version, reviewed_by, reviewed_at)
  values
    (NEW.id, OLD.review_status, NEW.review_status, NEW.review_version,
     NEW.reviewed_by, NEW.reviewed_at);

  update public.founder_alerts
  set status = 'read', read_at = coalesce(read_at, NEW.reviewed_at), updated_at = NEW.reviewed_at
  where owner_id = '75677100-97b7-4578-92c5-cf131997b580'::uuid
    and fingerprint = 'innerg-read-feedback:' || NEW.id::text
    and status <> 'read';
  return NEW;
end;
$$;

revoke all on function private.innerg_feedback_prepare_review()
  from public, anon, authenticated, service_role;
revoke all on function private.innerg_feedback_record_review()
  from public, anon, authenticated, service_role;

create trigger innerg_feedback_prepare_review
  before insert or update on public.innerg_read_feedback
  for each row execute function private.innerg_feedback_prepare_review();
create trigger innerg_feedback_record_review
  after insert or update on public.innerg_read_feedback
  for each row execute function private.innerg_feedback_record_review();

-- Backfill every pending row, including the two present during the preflight.
-- ON CONFLICT keeps retries from duplicating an existing alert or resetting it.
insert into public.founder_alerts
  (owner_id, brand, title, message, severity, source, action_url, fingerprint, event_at)
select '75677100-97b7-4578-92c5-cf131997b580'::uuid, 'INNERGINTEL',
  'New reader comment', 'A reader comment is waiting for your review.',
  'attention', 'system', 'https://innergclaw.github.io/founder-dashboard/#comments',
  'innerg-read-feedback:' || id::text, created_at
from public.innerg_read_feedback
where review_status = 'pending'
on conflict (owner_id, fingerprint) do nothing;

notify pgrst, 'reload schema';
commit;

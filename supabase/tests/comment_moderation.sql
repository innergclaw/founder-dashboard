-- Run after the moderation migration as a database administrator.
-- Use a local database. Every fixture, approval, denial, audit and alert rolls back.
-- This script never modifies an existing comment.
begin;

create function pg_temp.assert_true(condition boolean, label text)
returns void language plpgsql security invoker as $$
begin
  if condition is distinct from true then raise exception 'FAIL: %', label; end if;
end;
$$;

create function pg_temp.expect_denied(statement text, label text)
returns void language plpgsql security invoker as $$
begin
  begin
    execute statement;
  exception when insufficient_privilege then
    return;
  end;
  raise exception 'FAIL: permission was not denied: %', label;
end;
$$;

select pg_temp.assert_true(not exists (
  select 1 from public.innerg_read_feedback
  where id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002',
    'fda00000-0000-4000-8000-000000000003')
), 'Fixture IDs do not belong to real comments');

-- Reuse one existing read only as a foreign-key target. Do not edit that read.
select pg_temp.assert_true(exists (select 1 from public.innerg_reads), 'A read exists for the fixture foreign key');
select set_config('test.feedback_slug', (select slug from public.innerg_reads order by slug limit 1), true);

-- If alert storage fails, the submission must fail in the same transaction.
alter table public.founder_alerts add constraint comment_test_reject_alert
  check (fingerprint <> 'innerg-read-feedback:fda00000-0000-4000-8000-000000000003') not valid;
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
do $$ begin
  begin
    insert into public.innerg_read_feedback (id, slug, reader_hash, message)
    values ('fda00000-0000-4000-8000-000000000003', current_setting('test.feedback_slug'), repeat('f', 64),
      'LOCAL ROLLBACK FIXTURE. Forced alert failure.');
    raise exception 'FAIL: submission survived its alert failure';
  exception when check_violation then null;
  end;
  perform pg_temp.assert_true(not exists (select 1 from public.innerg_read_feedback
    where id = 'fda00000-0000-4000-8000-000000000003'), 'Alert failure also rolls back submission');
end; $$;
reset role;
alter table public.founder_alerts drop constraint comment_test_reject_alert;

-- Submission service has no founder identity. Even supplied approval must reset.
set local role service_role;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
insert into public.innerg_read_feedback
  (id, slug, reader_hash, message, approved, review_status, reviewed_at, reviewed_by, review_version)
values
  ('fda00000-0000-4000-8000-000000000001', current_setting('test.feedback_slug'), repeat('a', 64),
   'LOCAL ROLLBACK FIXTURE. This comment is never published.', true, 'approved', now(),
   '75677100-97b7-4578-92c5-cf131997b580', 99),
  ('fda00000-0000-4000-8000-000000000002', current_setting('test.feedback_slug'), repeat('b', 64),
   'LOCAL ROLLBACK FIXTURE. Denial check.', false, 'pending', null, null, 0);

select pg_temp.assert_true((select count(*) = 2 from public.innerg_read_feedback
  where id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002')
    and not approved and review_status = 'pending' and review_version = 0
    and reviewed_at is null and reviewed_by is null), 'Service inserts always await review');
select pg_temp.expect_denied($q$update public.innerg_read_feedback set review_status = 'approved'
  where id = 'fda00000-0000-4000-8000-000000000001'$q$, 'Service cannot moderate');

reset role;
select pg_temp.assert_true((select count(*) = 2 from public.founder_alerts
  where fingerprint in ('innerg-read-feedback:fda00000-0000-4000-8000-000000000001',
    'innerg-read-feedback:fda00000-0000-4000-8000-000000000002')
    and owner_id = '75677100-97b7-4578-92c5-cf131997b580'
    and status = 'unread' and source = 'system' and severity = 'attention'
    and brand = 'INNERGINTEL'
    and message = 'A reader comment is waiting for your review.'
    and action_url = 'https://innergclaw.github.io/founder-dashboard/#comments'
    and delivery = '{}'::jsonb), 'New comments create one private generic alert each');

-- Repeating the alert backfill cannot duplicate or overwrite a record.
insert into public.founder_alerts (owner_id, brand, title, source, fingerprint)
values ('75677100-97b7-4578-92c5-cf131997b580', 'INNERGINTEL', 'Duplicate test', 'system',
  'innerg-read-feedback:fda00000-0000-4000-8000-000000000001')
on conflict (owner_id, fingerprint) do nothing;
select pg_temp.assert_true((select count(*) = 1 from public.founder_alerts
  where owner_id = '75677100-97b7-4578-92c5-cf131997b580'
    and fingerprint = 'innerg-read-feedback:fda00000-0000-4000-8000-000000000001'),
  'Alert fingerprint remains unique');

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select pg_temp.expect_denied('select id, message from public.innerg_read_feedback', 'Anonymous read');
select pg_temp.expect_denied('select reader_hash from public.innerg_read_feedback', 'Anonymous hash read');
select pg_temp.expect_denied($q$update public.innerg_read_feedback set review_status = 'approved'$q$,
  'Anonymous approval');
select pg_temp.expect_denied('select id from public.innerg_read_feedback_reviews', 'Anonymous audit read');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000099', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"00000000-0000-4000-8000-000000000099"}', true);
select pg_temp.assert_true((select count(id) = 0 from public.innerg_read_feedback), 'Other member sees no comments');
select pg_temp.assert_true((select count(id) = 0 from public.innerg_read_feedback_reviews), 'Other member sees no audit');
select pg_temp.assert_true((select count(id) = 0 from public.founder_alerts), 'Other member sees no founder alerts');
select pg_temp.expect_denied('select reader_hash from public.innerg_read_feedback', 'Other member hash read');
do $$ declare affected integer; begin
  update public.innerg_read_feedback set review_status = 'approved'
    where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 0;
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 0, 'Other member cannot approve');
end; $$;

-- Audit failure must also roll back the public approval and its alert change.
reset role;
alter table public.innerg_read_feedback_reviews add constraint comment_test_reject_review check (false) not valid;
set local role authenticated;
select set_config('request.jwt.claim.sub', '75677100-97b7-4578-92c5-cf131997b580', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"75677100-97b7-4578-92c5-cf131997b580"}', true);
do $$ begin
  begin
    update public.innerg_read_feedback set review_status = 'approved'
      where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 0;
    raise exception 'FAIL: approval survived its audit failure';
  exception when check_violation then null;
  end;
  perform pg_temp.assert_true((select not approved and review_status = 'pending' and review_version = 0
    from public.innerg_read_feedback where id = 'fda00000-0000-4000-8000-000000000001'),
    'Audit failure rolls back the public approval');
  perform pg_temp.assert_true((select status = 'unread' from public.founder_alerts
    where fingerprint = 'innerg-read-feedback:fda00000-0000-4000-8000-000000000001'),
    'Audit failure leaves the originating alert unread');
end; $$;
reset role;
alter table public.innerg_read_feedback_reviews drop constraint comment_test_reject_review;
set local role authenticated;

-- Founder can read the explicit safe fields, but never the private hash.
select set_config('request.jwt.claim.sub', '75677100-97b7-4578-92c5-cf131997b580', true);
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"75677100-97b7-4578-92c5-cf131997b580"}', true);
select pg_temp.assert_true((select count(*) = 2 from (
  select id, slug, message, approved, created_at, review_status, reviewed_at, review_version
  from public.innerg_read_feedback where id in
    ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002')
) safe_rows), 'Founder can read safe inbox fields');
select pg_temp.expect_denied('select reader_hash from public.innerg_read_feedback', 'Founder hash read');
select pg_temp.expect_denied('select * from public.innerg_read_feedback', 'Wildcard read stays blocked');
select pg_temp.expect_denied($q$update public.innerg_read_feedback set message = 'Changed'
  where id = 'fda00000-0000-4000-8000-000000000001'$q$, 'Comment text cannot be edited');
select pg_temp.expect_denied($q$update public.innerg_read_feedback set approved = true
  where id = 'fda00000-0000-4000-8000-000000000001'$q$, 'Direct approved edit');
select pg_temp.expect_denied($q$update public.innerg_read_feedback set review_version = 20
  where id = 'fda00000-0000-4000-8000-000000000001'$q$, 'Review version cannot be forged');
select pg_temp.expect_denied('delete from public.innerg_read_feedback_reviews', 'Audit cannot be deleted');

do $$ declare affected integer; begin
  update public.innerg_read_feedback set review_status = 'approved'
    where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 0;
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 1, 'Founder approval succeeds');
  update public.innerg_read_feedback set review_status = 'denied'
    where id = 'fda00000-0000-4000-8000-000000000002' and review_version = 0;
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 1, 'Founder denial succeeds');
  update public.innerg_read_feedback set review_status = 'denied'
    where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 0;
  get diagnostics affected = row_count;
  perform pg_temp.assert_true(affected = 0, 'Stale version cannot overwrite approval');
end; $$;

select pg_temp.assert_true((select approved and review_status = 'approved' and review_version = 1
  and reviewed_at is not null from public.innerg_read_feedback
  where id = 'fda00000-0000-4000-8000-000000000001'), 'Approval controls public visibility');
select pg_temp.assert_true((select not approved and review_status = 'denied' and review_version = 1
  and reviewed_at is not null from public.innerg_read_feedback
  where id = 'fda00000-0000-4000-8000-000000000002'), 'Denied comment remains hidden');
select pg_temp.assert_true((select count(id) = 2 from public.innerg_read_feedback_reviews
  where feedback_id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002')
  and previous_status = 'pending' and review_version = 1 and reviewed_at is not null),
  'Both review events persist in the audit within the transaction');

-- A repeated decision is a no-op. A new valid decision has a new audit version.
update public.innerg_read_feedback set review_status = 'approved'
  where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 1;
select pg_temp.assert_true((select review_version = 1 from public.innerg_read_feedback
  where id = 'fda00000-0000-4000-8000-000000000001'), 'Repeat approval does not change the version');
update public.innerg_read_feedback set review_status = 'denied'
  where id = 'fda00000-0000-4000-8000-000000000001' and review_version = 1;
select pg_temp.assert_true((select not approved and review_version = 2 from public.innerg_read_feedback
  where id = 'fda00000-0000-4000-8000-000000000001'), 'Founder can remove prior approval');
select pg_temp.assert_true((select count(id) = 2 from public.innerg_read_feedback_reviews
  where feedback_id = 'fda00000-0000-4000-8000-000000000001'), 'Decision reversal preserves both events');

reset role;
select pg_temp.assert_true((select count(*) = 2 from public.innerg_read_feedback
  where id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002')
    and reviewed_by = '75677100-97b7-4578-92c5-cf131997b580'), 'Database stamps the founder reviewer');
select pg_temp.assert_true((select count(*) = 2 from public.founder_alerts
  where fingerprint in ('innerg-read-feedback:fda00000-0000-4000-8000-000000000001',
    'innerg-read-feedback:fda00000-0000-4000-8000-000000000002')
  and owner_id = '75677100-97b7-4578-92c5-cf131997b580' and status = 'read' and read_at is not null),
  'Moderation marks originating alerts read');
select pg_temp.assert_true(not exists (select 1 from information_schema.columns
  where table_schema = 'public' and table_name = 'innerg_read_feedback_reviews'
    and column_name in ('message', 'reader_hash')), 'Audit contains no comment text or reader hash');
select pg_temp.assert_true(not has_function_privilege('authenticated',
  'private.innerg_feedback_record_review()', 'execute'), 'Audit trigger is not a browser RPC');

rollback;

-- A clean rollback removes all fixture comments, alerts, and audit events.
do $$ begin
  if exists (select 1 from public.innerg_read_feedback
    where id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002'))
    or exists (select 1 from public.innerg_read_feedback_reviews
    where feedback_id in ('fda00000-0000-4000-8000-000000000001', 'fda00000-0000-4000-8000-000000000002'))
    or exists (select 1 from public.founder_alerts where fingerprint in
    ('innerg-read-feedback:fda00000-0000-4000-8000-000000000001',
     'innerg-read-feedback:fda00000-0000-4000-8000-000000000002')) then
    raise exception 'FAIL: rollback left fixture data';
  end if;
end; $$;

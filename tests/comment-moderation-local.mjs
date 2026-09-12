import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// No network connection, credentials, database URL, or disk persistence is used.
// An explicit module path avoids adding a production dependency for local tests.
const runtime = process.env.PGLITE_MODULE;
if (!runtime) throw new Error('Set PGLITE_MODULE to @electric-sql/pglite@0.5.8/dist/index.js.');
const { PGlite } = await import(pathToFileURL(path.resolve(runtime)).href);
const db = new PGlite();
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (name) => readFile(path.join(root, name), 'utf8');

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid;
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    insert into auth.users values ('75677100-97b7-4578-92c5-cf131997b580');
    create table public.innerg_reads (slug text primary key);
    insert into public.innerg_reads values ('local-test-read');
    create table public.innerg_read_feedback (
      id uuid primary key default gen_random_uuid(),
      slug text not null references public.innerg_reads(slug),
      reader_hash text not null,
      message text not null check (char_length(message) between 3 and 1500),
      approved boolean not null default false,
      created_at timestamptz not null default now(),
      submitted_day date not null default current_date,
      unique(slug, reader_hash, submitted_day)
    );
    alter table public.innerg_read_feedback enable row level security;
    grant all on public.innerg_read_feedback to service_role;
    -- Challenge the migration with stale broad grants and permissive policies.
    -- The new restrictive guards and explicit column revokes must still win.
    grant select, update on public.innerg_read_feedback to authenticated;
    grant select (reader_hash), update (message) on public.innerg_read_feedback to authenticated;
    grant select (reader_hash) on public.innerg_read_feedback to anon;
    create policy legacy_broad_read on public.innerg_read_feedback for select to authenticated using (true);
    create policy legacy_broad_update on public.innerg_read_feedback for update to authenticated using (true) with check (true);
    insert into public.innerg_read_feedback (id, slug, reader_hash, message, approved) values
      ('fab00000-0000-4000-8000-000000000001', 'local-test-read', repeat('c',64), 'Existing approved fixture', true),
      ('fab00000-0000-4000-8000-000000000002', 'local-test-read', repeat('d',64), 'Existing pending fixture one', false),
      ('fab00000-0000-4000-8000-000000000003', 'local-test-read', repeat('e',64), 'Existing pending fixture two', false);
  `);
  await db.exec(await read('supabase/migrations/20260820183633_founder_briefing_alerts.sql'));
  await db.exec(await read('supabase/migrations/20260911235256_innerg_comment_moderation.sql'));

  const legacy = await db.query(`select id, review_status, approved, review_version, reviewed_at, reviewed_by
    from public.innerg_read_feedback order by id`);
  assert.deepEqual(legacy.rows.map((row) => [row.review_status, row.approved]),
    [['approved', true], ['pending', false], ['pending', false]]);
  assert(legacy.rows.every((row) => row.review_version === 0 && row.reviewed_at === null && row.reviewed_by === null));
  const baseline = await db.query(`select
    (select count(*)::int from public.innerg_read_feedback) as comments,
    (select count(*)::int from public.innerg_read_feedback_reviews) as reviews,
    (select count(*)::int from public.founder_alerts) as alerts`);
  assert.deepEqual(baseline.rows[0], { comments: 3, reviews: 0, alerts: 2 });

  await db.exec(await read('supabase/tests/comment_moderation.sql'));
  const after = await db.query(`select
    (select count(*)::int from public.innerg_read_feedback) as comments,
    (select count(*)::int from public.innerg_read_feedback_reviews) as reviews,
    (select count(*)::int from public.founder_alerts) as alerts`);
  assert.deepEqual(after.rows, baseline.rows);
  console.log('PASS: legacy approval and 2 pending alerts preserved.');
  console.log('PASS: founder approve/deny, stale-write protection, audit, and read alerts.');
  console.log('PASS: anonymous/member restrictions, hidden hashes, immutable fields, and service pending-only submission.');
  console.log('PASS: restrictive policies survive stale broad grants; alert/audit failure rolls back the related comment change.');
  console.log('PASS: rollback removed every test comment, review event, and alert. No remote database was contacted.');
} finally {
  await db.close();
}

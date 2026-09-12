# Private comment moderation

The database migration was deployed on September 11, 2026. The inbox uses the existing Founder Dashboard at `https://innergclaw.github.io/founder-dashboard/#comments`. Phone push and email alerts are not configured by this change.

The migration adds a founder-only inbox to the existing `innerg_read_feedback` table. Public readers still use the existing public service. That service publishes only rows where `approved = true`.

## Access and decisions

The browser can select `id, slug, message, approved, created_at, review_status, reviewed_at, review_version`. It cannot select `reader_hash`, `submitted_day`, or `reviewed_by`. A wildcard select fails by design.

Only founder account `75677100-97b7-4578-92c5-cf131997b580` can read comments or change `review_status`. The browser cannot edit comment text, approval flags, reviewer identity, dates, or versions. Other members see no rows. Anonymous users have no table access.

Each decision must update `review_status` with both the comment `id` and its last seen `review_version` in the query filters. Zero returned rows means the comment changed or access ended. Refresh the inbox before another decision. The database increases the version only when the status changes.

Approve sets `approved = true`. Deny sets it to false. A later denial can remove an earlier approval. A repeated decision does not add an audit event. Resetting a reviewed comment to pending is not supported.

New service submissions always start pending, even if the caller supplies an approved status. Existing approvals remain approved. Their historical reviewer and date stay empty because those facts were not recorded.

## Alerts and audit

Each new pending comment creates one founder alert in the same transaction. The message contains no comment text or reader identifier. The alert points to `#comments`. The same alert fingerprint cannot appear twice for the owner.

Moderation writes a metadata-only audit event and marks the originating alert read. Both actions run in the same transaction as the decision. Failure leaves the previous decision intact. Only the founder can read the safe audit fields. Browser users and the service role cannot insert, edit, or delete audit events.

Internal trigger functions live in the private schema with an empty search path. Browser roles cannot call them as remote functions. The audit-writing function uses elevated rights only for the required internal writes and checks the founder identity on updates.

The migration creates missing alerts for existing pending comments. It does not approve or deny them. It does not enable phone push, email, or Telegram delivery.

## Local verification

The test runner uses `@electric-sql/pglite@0.5.8`, an in-memory PostgreSQL runtime. It has no remote connection or persistent database directory. Set `PGLITE_MODULE` to that package's `dist/index.js` file and run `node tests/comment-moderation-local.mjs`.

The runner creates a minimal copy of the known schema, then loads the existing alert migration and the new moderation migration. It also adds stale broad grants and policies before the new migration to test the restrictive guards.

The SQL test at `supabase/tests/comment_moderation.sql` runs in a transaction and ends with rollback. It uses fixed fixture IDs after checking they are unused. It temporarily tests failed alert and audit writes. It never changes an existing comment. Run it only on a local database because those failure checks temporarily add table constraints.

Tests cover preserved approvals, pending-alert backfill, owner decisions, stale versions, denied access, hidden hashes, immutable fields, audit history, generic unique alerts, atomic failure, and removal of all fixtures after rollback.

## Browser and live verification

The browser tests cover desktop (1440 px) and mobile (390 px), sign-out protection, plain-text rendering, approval confirmation and cancellation, denial, keyboard operation, stale or failed responses, and recovery. Authenticated browser interactions use isolated fixtures and intercepted requests, not real reader comments or a real founder session.

Run `node tests/comment-moderation-browser.mjs <site-url>` with Playwright available. Set `PLAYWRIGHT_MODULE` to an external Playwright module and `CHROME_PATH` to a local Chrome executable if they are not installed as defaults. All authenticated backend requests are intercepted. Screenshots are written to the temporary directory, not published. `npm run verify` includes the seven comment API and source checks.

Live database role checks passed for owner approval and denial, audit history, version checks, and unauthorized access. Transactional fixtures were rolled back and their absence was checked. Both existing reader comments remain pending. Two private dashboard alerts were created for those pending comments.

Anonymous Data API reads and writes are denied. The existing public article service returns only approved comments. No real reader comment was approved, denied, or deleted during testing.

A real founder sign-in and a real decision from the phone remain the final owner acceptance check. The browser test fixtures do not replace that check. There is no phone push, email, Telegram delivery, or Codex notification in this release. Dashboard alerts and the inbox work without the Mac running. Approval updates the database directly; the article shows the approved note on its next open or refresh. No site rebuild or Codex action is needed.

## Sources checked

- [Supabase column privileges](https://supabase.com/docs/guides/database/postgres/column-level-security)
- [Supabase row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Explicit Data API grants change](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)

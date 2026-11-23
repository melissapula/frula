# Plan: any user can message any user (audit item 3)

## 1. Task

Original task text: `audit`, read as the next open item in the backlog memory note
`project_audit_2026_10_30_backlog.md`. Item 3, verbatim:

> 3. Any user can message any user. RLS checks only `sender_id`, then `server/api/notifications/send.post.ts`
>    emails the content from the Frula domain. The route can also be replayed for one message. Fix:
>    require recipient to be the listing owner or already in the thread; send each message's email once.

The same note says item 3 changes the same INSERT policy and must keep the payload condition, that
database changes go in a new migration, and that opening a PR or posting anywhere needs Missa's
separate confirmation for that step.

**Definition of done**

- A user can only start a conversation with the owner of an active listing, about that listing.
- A user can only message a non-owner who has already written to them on that listing.
- Nobody can message themselves.
- All eight legitimate insert paths still work (table in `investigation-unsolicited-messages.md`,
  section 3).
- The payload condition from item 2 still holds.
- One message produces at most one email and one bell notification, including messages that exist
  before this change.
- Tests fail before the fix and pass after it, then the same checks pass on production.
- The email route has automated tests that run on every pull request.

## 2. Source

`investigation-unsolicited-messages.md`, written 2026-10-30.

**Spot-check confirmed, by reading the code on 2026-10-30:**

- `git fetch` then `git diff --stat HEAD origin/main` is empty. `origin/main` is ab0a361 (PR #8).
- `supabase/migrations/20261030_messages_lock_writes.sql:15-21` is the INSERT policy, and 32-33 are the
  column grants.
- `apps/web/server/api/notifications/send.post.ts`: auth 51-54, rate limit 57, message load 74-78,
  sender check 86-91, recipient check 116-120, bell insert 149-156, Resend 209-222. The URL
  `https://api.resend.com/emails` is hardcoded at 209.
- `supabase/migrations/20261030_profiles_names_and_rows.sql:29-31` trusts `messages` rows, and 32-34
  trusts `transactions`.
- `supabase/migrations/20261030_messages_respond_function.sql:4-28` is the function pattern.
- `tests/db/messages-integrity.test.ts`: `canExecute` 63-65 is hardcoded to `respond_to_message`,
  `insertMessage` 67-73 is hardcoded to `ACTIVE_LISTING`, and the `RETURNING` comment is at 259.
- `tests/db/support/fixtures.ts:10`: `DRAFT_LISTING` is not exported, and is owned by `TXN_A`.
- `supabase/MIGRATION_CHECKLIST.md`: last migration is item 21 and seeds are 22-23.
- Neither `can_message`, `claim_message_notification` nor `notified_at` exists anywhere in the repo.

**Drift:** none that matters. `OfferModal.vue` and `ViewingModal.vue` inserts are at 312 and 213, and
`[userId].vue` inserts at 280 and 477, one line after the cited `await` statements.

**Added by the spot-check, not in the investigation:**

- Paths 6, 7 and 8 (system notes) never call `notify`. Their rows keep `notified_at` NULL, so a sender
  can trigger one email for each by calling the route by hand. That is still at most one, so the plan
  accepts it.
- Nothing in the app sets a listing to `pending` or `sold`, and the detail page only loads `active`
  listings (`listing/[id]/index.vue:428`, `schema.sql:345`). So the raw Postgres error on a blocked
  insert stays unreachable from the UI.
- The route's claim fires a realtime UPDATE on `messages`. The only UPDATE listener is `AuthNav.vue:194`,
  which calls `refreshUnread()`. That is harmless, and the same goes for the backfill.
- The `SUPABASE_SERVICE_ROLE_KEY` naming mismatch (audit item 14) affects Phase 2: the installed module
  reads `SUPABASE_SERVICE_KEY`.

## 3. Decisions and assumptions

**Open questions, answered by Missa on 2026-10-30:**

1. "Already in the thread" means **the recipient has written to the sender** on that listing. Old forged
   rows give their sender nothing, so no cleanup is needed. Accepted cost: a buyer with no reply cannot
   follow up once the listing leaves `active`.
2. **No retry** of a failed email. Claim first, at most once. A Resend failure loses that email; the
   inbox message and bell row remain.
3. Existing rows that break the rule: **run the read-only count, and leave them** unless it shows abuse.
   The query is in Phase 1.
4. **Add `@nuxt/test-utils` now.** This overrides the investigation's recommendation, so the route gets
   automated tests in this plan. New dev dependency approved: `@nuxt/test-utils`.

**Reuse decision:**

- Recipient rule: **build** `can_message`, mirroring `respond_to_message`.
- Send once: **build** a `notified_at` claim column and function. Postgres gives the atomic check-and-set.
- Route tests: **adopt** `@nuxt/test-utils` through its e2e `setup()`, in a `node` environment.

**What the `@nuxt/test-utils` docs say, and why that shapes Phase 2.** Checked on nuxt.com's testing page
for 4.x; context7 failed to connect, and the package is not installed yet. npm reports version 4.3.4
with peers `nuxt ^4`, `vitest ^4 || ^5` and `vue ^3.5`, so the installed nuxt 4.4.2 and vitest 5.0.5 fit.
The only documented route-level path is e2e: `setup()` builds the app, starts a real server, and tests
call it over HTTP. `registerEndpoint` replaces a route with mock data, so it cannot test the real one.
The docs do not describe calling Nitro handlers from the `nuxt` environment. So this is a real build
plus fake Supabase and Resend servers, and it is bigger than adding a package.

**Other decisions made in this plan:**

- **Three PRs rather than the investigation's one.** A migration first means the route cannot deploy
  ahead of it, which removes the deploy-order risk. The test harness gets its own PR so the route change
  can be written test-first against it.
- `claim_message_notification` is **not** security definer. Only `service_role` runs it, and that role
  can already update the table, so it does not need the extra power.
- **Resend gets a configurable base URL.** The hardcoded URL at `send.post.ts:209` cannot be pointed at
  a fake any other way. The default stays the real address, so production does not change.

**Assumptions:**

- Merging to `main` deploys the app. Missa runs SQL by hand in the Supabase SQL Editor.
- `setup()` accepts what Phase 2 needs. Unverified until installed, so Phase 2 starts with a check.

## 4. Phase overview

1. **Database rule and claim function.** New migration and PGlite tests. Depends on nothing.
2. **Route test harness.** `@nuxt/test-utils`, fake services, tests of today's route behavior. Depends on
   nothing, though it follows Phase 1 in order.
3. **Send each email once.** The route calls the claim, test-first. Depends on Phase 1 being run on
   production and on Phase 2 being merged.

## 5. Phases

### Phase 1: database rule and claim function

**Goal.** Close the "message anyone" hole and add the claim, unused for now. It stands alone because
blocking inserts needs no app change, and the route ignores the new column.

**Changes**

- `tests/db/support/fixtures.ts`: export `DRAFT_LISTING`; add and export `SOLD_LISTING`, owned by
  `SELLER`, status `sold`. `SELLER` is already public through `ACTIVE_LISTING`, so profile tests should
  not change.
- `tests/db/messages-integrity.test.ts`: write these first, and watch them fail.
  - Make `canExecute` take a function signature, and let `insertMessage` take a listing id with
    `ACTIVE_LISTING` as the default.
  - Add `['notified_at', `'2020-01-01'`]` to `LOCKED_COLUMNS`.
  - Add a `who can be messaged` block.
  - Add a `notification claim` block.
- `supabase/migrations/20261030_messages_recipient_rule.sql`: new, inside `BEGIN`/`COMMIT`, with a short
  comment on why the check is a function (a policy on `messages` that reads `messages` is expected to
  recurse).

  ```sql
  CREATE OR REPLACE FUNCTION public.can_message(target_listing uuid, target_recipient uuid)
  RETURNS boolean AS $$
    SELECT EXISTS (SELECT 1 FROM public.listings l
                   WHERE l.id = target_listing
                     AND l.user_id = target_recipient
                     AND l.status = 'active')
        OR EXISTS (SELECT 1 FROM public.messages m
                   WHERE m.listing_id = target_listing
                     AND m.sender_id = target_recipient
                     AND m.recipient_id = auth.uid());
  $$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

  -- RLS runs this as the querying role, so authenticated must keep it.
  REVOKE EXECUTE ON FUNCTION public.can_message(uuid, uuid) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.can_message(uuid, uuid) TO authenticated;

  DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;
  CREATE POLICY "Senders can insert messages"
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
      AND recipient_id <> sender_id
      AND public.can_message(listing_id, recipient_id)
      AND ((kind = 'text' AND payload IS NULL)
        OR (kind IN ('offer', 'viewing_request') AND payload->>'status' = 'pending'))
    );

  ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
  -- Without this every old message could be replayed for one more email.
  UPDATE public.messages SET notified_at = created_at WHERE notified_at IS NULL;

  CREATE OR REPLACE FUNCTION public.claim_message_notification(message_id uuid)
  RETURNS boolean AS $$
  BEGIN
    UPDATE public.messages m
       SET notified_at = NOW()
     WHERE m.id = message_id AND m.notified_at IS NULL;
    RETURN FOUND;
  END;
  $$ LANGUAGE plpgsql SET search_path = '';

  REVOKE EXECUTE ON FUNCTION public.claim_message_notification(uuid) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.claim_message_notification(uuid) TO service_role;
  ```

  The column grants at `20261030_messages_lock_writes.sql:32-33` already stop users updating
  `notified_at`. A sender could set it on their own insert, which only suppresses their own email.
- `tests/db/support/schema-files.ts`: add the migration after `20261030_messages_lock_writes.sql`.
- `supabase/MIGRATION_CHECKLIST.md`: add it as item 22, renumber the seeds to 23-24, and note that it
  must run before Phase 3 merges.

**Tests**

Blocked, using `expectBlocked`, in both the `RETURNING` form and the no-`RETURNING` form (see the comment
at `messages-integrity.test.ts:259`):

- a stranger to a non-owner on `ACTIVE_LISTING`
- the seller to someone who never wrote
- a buyer to the owner of `DRAFT_LISTING` with no history
- a buyer to the owner of `SOLD_LISTING` with no history
- a user to themselves, including the owner on their own listing
- an offer to a non-owner, which shows the rule covers every `kind`
- a forged row seeded from `STRANGER` to `BUYER`, after which `STRANGER` still cannot message `BUYER`
  on that listing, which is the point of question 1's answer

Allowed:

- a buyer to the owner
- the seller replying to a buyer who wrote
- a counter offer back to the buyer
- the buyer to the owner of `SOLD_LISTING` after the seller has written to them

Privacy and privileges:

- a stranger with no shared message cannot read a non-seller's profile row, including after a blocked
  insert attempt
- `can_message` is executable by `authenticated`, and not by `anon`
- `claim_message_notification` is executable by `service_role` only

Claim, as `service_role`:

- the first call returns true and the second returns false
- a missing message returns false
- `notified_at` cannot be updated by either party or `anon` (from `LOCKED_COLUMNS`)

Existing tests should pass unchanged, because they use `BUYER` to `SELLER` and the fixture seeds a buyer
message before any seller reply. That is inferred until run.

**Not testable here:** the backfill. The harness seeds after migrations, so no row exists when it runs.
The production read-back below covers it.

**Verification**

1. `npm test`: the new blocks are red before the migration is listed, and green after.
2. Sanity-check the tests: remove the migration from `schema-files.ts`, and confirm the new blocks and
   the file-list guard in `tests/db/setup.test.ts` go red. Also remove only the `can_message` line from
   the policy and confirm the blocked cases go red. Restore both.
3. Before running it on production, Missa runs these in the SQL Editor:

   ```sql
   -- Rows that break the rule. Leave them unless this shows abuse.
   select m.id, m.listing_id, m.sender_id, m.recipient_id, m.created_at
   from public.messages m
   left join public.listings l on l.id = m.listing_id
   where l.user_id is distinct from m.recipient_id
     and not exists (
       select 1 from public.messages r
       where r.listing_id = m.listing_id
         and r.sender_id = m.recipient_id
         and r.recipient_id = m.sender_id
         and r.created_at < m.created_at);

   -- ChoreQuest shares this project. Expect no rows.
   select proname from pg_proc
   where proname in ('can_message', 'claim_message_notification');
   ```

   Also confirm ChoreQuest does not write to `public.messages` by searching its repo. The new policy
   would apply to it.
4. Run the migration, then read back with `pg_policies`, `has_function_privilege` for both functions,
   and `select count(*) from public.messages where notified_at is null`, which must be 0.
5. Two-account check on production: every path in the investigation's section 3 table, plus one blocked
   stranger insert from the browser console.

**Safe to merge because** nothing calls the claim yet and no client code changes. The merge itself
changes no database, since Missa runs the SQL separately, and all eight legitimate paths pass the rule.

**Branch and PR title.** `fix/messages-recipient-rule`, from a fresh `origin/main`: "Limit who can be
messaged, and add a notification claim".

### Phase 2: route test harness

**Goal.** Get the real email route running under test against fake Supabase and Resend, covering what it
does today. It stands alone because it changes no behavior, and it gives Phase 3 a way to fail first.

**Start with a check, and stop if it fails.** Install the package, then confirm from the installed
version's types and docs that `setup()` can run in a `node` environment against `apps/web`, and can
reach the fakes with no real credentials. If the real route cannot run under it without changes beyond
those listed here, stop and bring that to Missa. Do not silently switch to hand-mocked handler tests.
That would drop her decision and test less.

**Changes**

- `package.json`: add `@nuxt/test-utils` to `devDependencies`. Add its required peers only if the install
  or the first run says so. `playwright-core`, `happy-dom` and `jsdom` should not be needed, because
  nothing here uses a browser or DOM. Confirm that on install.
- `vitest.config.ts`: split into two `projects`, `db` (today's `tests/db/**`) and `routes`
  (`tests/routes/**`), both `environment: 'node'`, so each test file matches exactly one project as the
  docs require. Keep `hookTimeout` on `db`. `npm test` runs both.
- `apps/web/nuxt.config.ts`: add `resendApiUrl: process.env.RESEND_API_URL || 'https://api.resend.com'`
  to the server-only part of `runtimeConfig`.
- `apps/web/server/api/notifications/send.post.ts:209`: use `${config.resendApiUrl}/emails`.
- `.env.example`: add a commented `RESEND_API_URL` line saying it is for tests only.
- `tests/routes/support/fake-services.ts`: new. One `node:http` server on a fixed local port that records
  calls and answers:
  - `GET /auth/v1/user`, which is how the installed `serverSupabaseUser` checks a session
    (`@nuxtjs/supabase` 1.6.2, `client.auth.getUser()`)
  - `GET /rest/v1/messages`, `profiles` and `listings`
  - `POST /rest/v1/notifications`
  - `POST /emails`, for Resend

  No new mocking library.
- `tests/routes/support/test-env.ts`: new. Sets fake `SUPABASE_URL`, `SUPABASE_KEY`,
  `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY` and `RESEND_API_URL` in `process.env`, before anything loads
  Nuxt, and throws unless both URLs start with `http://127.0.0.1`.
- `tests/routes/notifications-send.test.ts`: new. Each test uses its own user, because the route allows
  5 calls a minute per user in server memory. The user's session cookie follows `@supabase/ssr`'s format;
  the exact cookie name and encoding are unverified until written.
- `.github/workflows/test.yml`: adjust only if the first PR run shows a need. The workflow installs with
  `npm ci --ignore-scripts`, and whether `nuxt build` works after that is unverified. The PR run answers
  it.

**Tests** (today's behavior)

- returns 401 with no session
- returns 400 with no `messageId`
- returns 403 when the caller is not the sender, and sends no email
- when the sender calls it, creates one bell row and one email to the recipient, on the fake
- returns `{ sent: false }` when Resend fails, and the bell row still exists

**Verification**

1. `npm test` with the real `.env` and `apps/web/.env` present. Confirm the fake recorded the Resend and
   Supabase calls, which proves the traffic did not go to real services.
2. Sanity-check the tests: remove the sender check at `send.post.ts:86-91` and confirm the 403 test goes
   red. Restore it.
3. Check `git status`: no build output is left tracked.
4. Confirm `Tests` is green on the pull request, and note how long the run takes. `pull_request` runs the
   workflow on every push to the PR branch, so the extra build time is paid each push.
5. Confirm the Resend default by reading the built config or with one real message on production after
   deploy.

**Safe to merge because** the only production change is a config value whose default equals the old
hardcoded address.

**Branch and PR title.** `test/notification-route-harness`, from a fresh `origin/main`: "Add route tests
for the notification email".

### Phase 3: send each email once

**Goal.** Make a message produce at most one email and one bell row. It stands alone because the claim
function is already on production by this point.

**Precondition.** Phase 1's migration has been run and read back on production. Merging this first would
stop all emails, because the RPC would fail and the route fails closed.

**Changes**

- `tests/routes/support/fake-services.ts`: answer `POST /rest/v1/rpc/claim_message_notification` with true
  once per message id, then false, and allow a forced error.
- `tests/routes/notifications-send.test.ts`: add the tests below first and watch them fail.
- `apps/web/server/api/notifications/send.post.ts`: after the recipient check at 116-120, and before any
  bell or email work:

  ```ts
  // Claimed before sending, so a Resend failure loses this email rather than risking a duplicate.
  const { data: claimed, error: claimErr } = await admin.rpc('claim_message_notification', {
      message_id: message.id,
  })
  if (claimErr) {
      // eslint-disable-next-line no-console
      console.error('Notification claim failed:', claimErr)
      throw createError({ statusCode: 500, statusMessage: 'Could not send notification' })
  }
  if (!claimed) {
      return { sent: false, reason: 'Already notified' }
  }
  ```

  Update the header comment at 1-13 to say each message notifies once. The client swallows the 500
  (`useNotificationEmail.ts:18-21`), so the sender's message still goes through.
- `supabase/MIGRATION_CHECKLIST.md`: add the one-time catch-up under item 22.

**Tests**

- a replayed `messageId` returns `Already notified`, with exactly one email and one bell row recorded
- two concurrent calls for one message produce one email (the fake models the claim, so this proves the
  route obeys it; atomicity itself is the database's, covered in Phase 1)
- a claim error returns 500 with no email and no bell row
- a failed Resend send is not retried on a second call

**Verification**

1. `npm test`: the replay test is red before the route change and green after.
2. Sanity-check the tests: remove the `!claimed` return and confirm the replay test goes red. Restore it.
3. After deploy, Missa runs this one-time catch-up. Messages sent between Phases 1 and 3 were notified by
   the old route but kept `notified_at` NULL. The 5 minutes leaves in-flight messages alone.

   ```sql
   update public.messages set notified_at = created_at
   where notified_at is null and created_at < now() - interval '5 minutes';
   ```

4. Two-account check on production: send one message, POST its id to `/api/notifications/send` again from
   the browser console, and confirm `Already notified`, one email and one bell row.

**Safe to merge because** the claim exists on production by then, and a claim failure stops only the
notification, never the message.

**Branch and PR title.** `fix/notifications-send-once`, from a fresh `origin/main`: "Send each message's
notification once".

## 6. Risks

- **Real emails or production writes from tests.** `.env` and `apps/web/.env` hold real credentials on
  Missa's machine, and the Nuxt build may read them. Phase 2 limits this three ways: fake values set
  first (dotenv does not override existing variables), a guard that throws on a non-local URL, and a
  check that the fake recorded the calls. This one comes first in Phase 2 review.
- **Harness cost.** Every PR now pays for a Nuxt build, and the fake Supabase has to match what
  `supabase-js` sends. Upgrades can break it. Phase 2's stop condition catches a harness that does not
  fit before it spreads.
- **The fake is not Supabase.** Route tests prove the route's logic, not the real RPC call. Phase 1's
  PGlite tests and each phase's production check cover that side.
- **Policy recursion.** The recursion error is recalled, not run. The Phase 1 tests exercise the function
  through a real insert, and PGlite is not Supabase, so the production check still applies.
- **Deleted threads.** After `deleteThread` (`inbox/index.vue:264-270`), a seller cannot message the buyer
  until the buyer writes again, even mid-transaction. The checklist note at `transaction/[id].vue:245`
  would then fail silently (item 18). Accepted for now. Allowing `transactions` as a third route would be
  unsafe until item 4 closes.
- **Buyer with no reply, listing no longer active.** Accepted in question 1. Unreachable from the app today:
  a search of `apps/web` finds no code that moves a listing away from `active`.
- **ChoreQuest.** It shares the Supabase project. Phase 1's checks come before the migration.
- **Lost emails.** A Resend failure after the claim loses that email. Accepted in question 2.
- **Rollback.** Phase 3 reverts as a normal PR. Phase 1 can be undone by recreating the old policy from
  `20261030_messages_lock_writes.sql:15-21`; the column and functions are harmless to leave.
- **Bulk contact remains.** Any signed-in user can still message every active seller, which is items 7
  and 12.

## 7. Out of scope

These belong in their own tickets.

- `save.post.ts` has no replay protection and never checks the listing was saved (60-67). Not in the audit
  backlog.
- The bell insert at `send.post.ts:149` ignores its error. Same family as item 18.
- The route uses raw `readBody` with no UUID check (65-69), so a malformed id gives a misleading 404. The
  Nuxt rule prefers `readValidatedBody`.
- `send.post.ts:122` calls every unnamed sender "A buyer", including sellers replying. Related to item 17.
- Offer and viewing `body` text is client-written and can disagree with `payload`. Not in the audit backlog.
- Paths 6, 7 and 8 ignore insert errors (item 18).
- Rate limiting and message length (items 7, 12).
- The `transactions` route into the profile policy (item 4).
- `.env.example` says `SUPABASE_SERVICE_ROLE_KEY`, and the app reads `SUPABASE_SERVICE_KEY` (item 14).
- `CLAUDE.md` is stale on message features.

When item 3 closes, update `project_audit_2026_10_30_backlog.md`, including its description line, and
`project_test_infra_next.md`, which still says route tests wait for item 3. Opening each PR is a separate
decision for Missa.

## Recommendation

Start with Phase 1. It closes the blocking hole on its own, needs no new dependency, and Phase 3 cannot
ship without it. Run the production count and the ChoreQuest checks before its migration.

## Progress

- **Phase 1: merged as PR #9 (93d00e5).** Branch `fix/messages-recipient-rule`, base `origin/main`
  (ab0a361).
  Added `20261030_messages_recipient_rule.sql` (`can_message`, stricter insert policy, `notified_at` and
  backfill, `claim_message_notification`), listed it in `schema-files.ts`, added it to the checklist as
  item 22 with seeds renumbered 23-24, and added `SOLD_LISTING` plus the new test blocks. 134 tests pass.
  Run on production by 2026-10-30: the read-back passed (insert policy as written, `claim` runs for
  `service_role` only, `can_message` not for `anon`, 0 rows with NULL `notified_at`). `service_role`
  can also run `can_message`, from Supabase's default privileges, which is harmless because that role
  bypasses row policies. Results of step 3's pre-checks were not shared; step 5's two-account check
  remains.
  - **Deviation:** the migration comment does not use the plan's recursion reason. An inline policy was
    tried and all 134 tests passed on PGlite with no recursion, so section 6's "Policy recursion" risk
    does not apply. The function stays, because its check does not depend on the read policies of
    `listings` and `messages`.
  - **Added beyond the plan's test list:** a reply based on a different listing is blocked. The sold
    listing's no-history case uses `STRANGER`, because `BUYER` has history there.
- **Phase 2: merged as PR #10 (de7e16e).** Tests check green in 1m29s. Branch
  `test/notification-route-harness`, base `origin/main` (93d00e5). Added `@nuxt/test-utils` 4.3.4, split `vitest.config.ts` into `db` and `routes` projects,
  added `resendApiUrl` to runtime config and used it in `send.post.ts`, added the `.env.example` note,
  and added `tests/routes/` (fake services, test env, 6 route tests). 140 tests pass, including in a
  clean copy with no `.env`, installed the way CI does.
  - **Deviation, approved by Missa:** a logged-out caller gets 500, not the plan's 401, because
    `serverSupabaseUser` throws before the route's check. The test pins 500 and no email. The fix
    belongs in its own ticket, and the same helper is used by three more routes.
  - **Deviation:** `test-env.ts` also fakes the `NUXT_` variables, because the repo root `.env` defines
    `NUXT_PUBLIC_SUPABASE_URL` and `NUXT_PUBLIC_SUPABASE_KEY`, which override runtime config.
  - **Deviation:** `.github/workflows/test.yml` gains a `nuxt prepare` step. Found by the clean copy, not
    a PR run: the build needs `.nuxt/tsconfig.server.json`, and `--ignore-scripts` skips postinstall.
  - **Added beyond the plan's test list:** a test that the Supabase and Resend calls reached the fakes.
  - Still open: step 5's production email check, after deploy.
- **Phase 3: merged as PR #11; Missa reports the catch-up SQL run.** Branch `fix/notifications-send-once`,
  base `origin/main` (de7e16e).
  `send.post.ts` calls `claim_message_notification` after the recipient check and before any bell or
  email work, and returns `Already notified` when the claim is lost. The fake answers the claim once per
  message and can be forced to fail. Added 4 route tests and the one-time catch-up under checklist item
  22. No deviations.
  - Still open: step 4's two-account check, which also covers Phase 2's step 5 email check, and Phase 1's
    step 5 two-account check.

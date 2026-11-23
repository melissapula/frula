# Investigation: forged offers on `messages` (audit item 2)

Investigated 2026-10-30 against `main` at 82c9ccc, working tree clean. This was read-only: no tests,
builds or migrations ran, and no database, local or production, was touched. All line references
were read on that date.

## 1. Task

Original task: "audit item 2", meaning item 2 in the backlog memory note
`project_audit_2026_10_30_backlog.md`. The item's text, verbatim:

> 2. Offers can be forged. A recipient rewrote a buyer's `payload.offer_price` and `body`; a sender
>    reassigned `recipient_id`. Cause: "Recipients can mark as read" restricts rows, not columns, and the
>    old schema.sql "Message participants only" FOR ALL policy is never dropped. Fix: allow only
>    read/flag/status changes, through a trigger or server route. An investigation was started
>    2026-10-30 and interrupted, with no report. Read so far: legitimate updates are `is_read` (thread
>    page, `markUnread`), `flagged` (`toggleFlag`, across both parties' messages, so it depends on the
>    FOR ALL policy) and `payload.status` (`patchMessagePayload` sends the whole payload). `deleteThread`
>    also depends on FOR ALL. Dropping that policy without replacing these breaks them.

The backlog also says: re-verify against current code and confirm the live database state before
starting; database changes go in a new migration; opening a PR or posting anywhere needs Missa's
separate confirmation. The test infrastructure note says item 2 is the first fix done test-first.

**Restatement.** Either party to a conversation can change anything in a message, so the terms of
an offer can be rewritten after it was made. Limit users to the changes the app really makes, and
keep every inbox action working.

**Done means:**

- Nobody signed in can change `body`, `kind`, `listing_id`, `sender_id`, `recipient_id`,
  `created_at`, or any part of `payload` other than through a valid status response.
- Only the recipient of a pending offer or viewing request can respond to it, once, with a status
  valid for its kind.
- A user cannot insert a message that claims another person as sender, or one that is already
  accepted (both newly found, section 3).
- Marking read and unread, flagging, deleting a thread, accepting, countering, declining, confirming
  a viewing and all insert paths still work.
- Tests fail before the fix and pass after it, then the same checks pass on production.

**Ambiguity in the task:**

- The item says "trigger or server route". This report recommends a third way: column privileges
  plus one database function (section 6). Open question 1.
- The item covers updates only. The same FOR ALL policy also allows forged inserts, which the audit
  did not list. This report treats them as in scope because dropping the policy is the fix for both.
- It does not say whether a sender may change `is_read` on their own message. Open question 2.

## 2. Where it lives

| File | Role |
| --- | --- |
| `supabase/schema.sql` | `messages` table (214-222), RLS on (331), FOR ALL policy (355-357) |
| `supabase/messages_rls.sql` | SELECT (9-13), INSERT (16-20) and UPDATE (23-28) policies |
| `supabase/messages_kinds.sql` | Adds `kind` and `payload` (12-15) |
| `supabase/messages_flagged.sql` | Adds `flagged` (6-7) |
| `supabase/migrations/20261030_profiles_names_and_rows.sql` | Profile read policy that queries `messages` (29-31) |
| `supabase/migrations/20261030_profiles_column_privileges.sql` | The column-privilege precedent (5-7) |
| `supabase/MIGRATION_CHECKLIST.md` | Manual run order; the 2026-10-30 entries are items 18-19 |
| `apps/web/app/pages/inbox/[listingId]/[userId].vue` | Thread page: inserts, mark read, offer and viewing actions |
| `apps/web/app/pages/inbox/index.vue` | `toggleFlag` (214), `markUnread` (234), `deleteThread` (254) |
| `apps/web/app/components/OfferModal.vue` | Inserts offers and counters (311-331) |
| `apps/web/app/components/ViewingModal.vue` | Inserts viewing requests (212-230) |
| `apps/web/app/components/OfferCard.vue`, `ViewingCard.vue` | Show payload; action buttons only while `pending` (OfferCard 56, ViewingCard 45) |
| `apps/web/app/pages/transaction/[id].vue` | Inserts a checklist message (244-249) |
| `apps/web/app/composables/useMessages.ts` | Payload types (3-27), thread building (67-103) |
| `apps/web/server/api/notifications/send.post.ts` | Service-role read of a message (74-78); emails `body`, not payload details |
| `tests/db/support/*`, `tests/db/profile-privacy.test.ts` | PGlite harness and the test pattern to copy |

## 3. How it works today

**The rules.** A Postgres table can have several policies. Permissive ones are combined with OR, so
a row is allowed if any one of them allows it. An RLS policy picks rows, never columns. Two policies
matter here:

- "Message participants only" (`supabase/schema.sql:355-357`) is `FOR ALL` with `USING` only. With
  no `WITH CHECK`, Postgres reuses `USING` for new rows. No file drops it (searched all of
  `supabase/*.sql`).
- "Recipients can mark as read" (`supabase/messages_rls.sql:23-28`) was probably meant to narrow
  updates, but it can only add permission, never remove it.

**What each person can therefore do** (from reading the SQL; the audit reproduced the first two on
PGlite, the others were not run):

1. A recipient can rewrite `payload.offer_price` and `body`. Audit reproduced.
2. A sender can reassign `recipient_id`. Audit reproduced.
3. A sender can set `payload.status = 'accepted'` on their own offer. The card then shows accepted
   (`OfferCard.vue:85`). Inferred from the policy.
4. **New: a user can insert a message with someone else as sender**, as long as they are the
   recipient. The FOR ALL check is `auth.uid() = sender_id OR auth.uid() = recipient_id`, which
   overrides the stricter `sender_id = auth.uid()` at `messages_rls.sql:20` because policies are
   OR'd. A seller can manufacture an offer "from" a buyer. This is an insert, so no update rule
   fixes it. Inferred from the policy.
5. **New: any sender can insert an offer that is already accepted.** Nothing checks `payload` on
   insert. Dropping FOR ALL does not fix this. Inferred from the policy.

**Legitimate traffic.** Every `messages` write in the app:

| Action | Location | Write | Who |
| --- | --- | --- | --- |
| Send text | `[userId].vue:278`, `:475` | insert | sender |
| System notes | `[userId].vue:389`, `:525` | insert | either party |
| Checklist note | `transaction/[id].vue:244` | insert | either party |
| Offer, counter | `OfferModal.vue:312` | insert, `status: 'pending'` (320) | sender |
| Viewing request | `ViewingModal.vue:213` | insert, `status: 'pending'` (221) | sender |
| Mark read | `[userId].vue:427`, `:458` | `is_read = true` | recipient |
| Mark unread | `inbox/index.vue:236` | `is_read = false` | recipient (`last_received_id`) |
| Flag | `inbox/index.vue:217` | `flagged`, both directions of a thread | either party |
| Delete thread | `inbox/index.vue:260` | delete, both directions | either party |
| Respond | `patchMessagePayload`, `[userId].vue:506-521` | whole `payload` | recipient |

No server route writes `messages`. The only other touch is the service-role read in `send.post.ts`.

**The respond flow.** `OfferCard` shows buttons when `canAct && status === 'pending'`, and `canAct`
is `m.recipient_id === myId` (`[userId].vue:147`). It is based on the recipient, not the listing
owner, so a buyer can accept a seller's counter-offer. `patchMessagePayload` updates local state
first, then sends the whole payload. On failure it only logs (`[userId].vue:517-520`), and its
callers continue: `acceptOffer` still starts a transaction and posts "Offer accepted"
(`[userId].vue:541-551`). Today that branch is rarely hit. After this fix a rejected response would
reach it, so it must be handled.

**Statuses in use.** Offers: `accepted` (541), `countered` (577), `declined` (583). Viewings:
`confirmed` (593), `declined` (602). All start from `pending`.

**Tests.** No test covers `messages` writes. `tests/db/support/fixtures.ts:34-35` seeds one text
message, and `profile-privacy.test.ts:113` relies on it.

## 4. What needs to change

Test-first, in this order.

1. **`tests/db/messages-integrity.test.ts` (new).** Write it first and watch it fail. Copy the setup
   of `profile-privacy.test.ts:17-27`. Seed an offer and a viewing request in this file's own
   `beforeAll`, not in shared fixtures, so profile tests stay unaffected. Export `ACTIVE_LISTING`
   from `fixtures.ts`. Cover:
   - Denied: recipient and sender changing `body`, `payload`, `recipient_id`, `sender_id`,
     `listing_id`, `kind`, `created_at`; stranger changing or deleting anything; anon doing either.
   - Denied: insert claiming another sender; insert of an offer or viewing with a non-pending status;
     insert of a text message with a payload.
   - Respond function: recipient succeeds for each valid status per kind; sender, stranger and anon
     are rejected; a second response is rejected; `confirmed` on an offer and `accepted` on a viewing
     are rejected; a text message is rejected.
   - Still allowed: recipient sets `is_read` both ways; both parties set `flagged`; both parties
     delete; sender inserts text, offer and viewing; either party inserts a system note.
   - Two harness details. `as()` rolls back, so assert writes with `RETURNING`. An RLS block on UPDATE
     or DELETE returns zero rows rather than an error, so assert `rows` has length 0 there. A blocked
     INSERT says "row-level security", which `isDenied` (`database.ts:76-77`) does not match, so
     add a local `isBlocked` in the test file or widen `isDenied`.

2. **`supabase/migrations/<date>_messages_respond_function.sql` (new, additive).** Create
   `public.respond_to_message(message_id uuid, new_status text)`:
   - `SECURITY DEFINER SET search_path = ''`, like `handle_new_user`
     (`20261030_profiles_names_and_rows.sql:17`).
   - One `UPDATE` that sets `payload = jsonb_set(payload, '{status}', to_jsonb(new_status))` where
     `id` matches, `recipient_id = auth.uid()`, `payload->>'status' = 'pending'`, and the kind and
     status pair is allowed. One statement means two clicks cannot both win.
   - If no row changed, raise with errcode `42501`, with "permission denied" in the message so
     `isDenied` matches. Do not say which condition failed.
   - `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO authenticated;`. Both
     revokes are required (section 7).

3. **`supabase/migrations/<date>_messages_lock_writes.sql` (new).** In one transaction:
   - `DROP POLICY IF EXISTS "Message participants only"` and `"Recipients can mark as read"`.
   - Add a participant `FOR UPDATE` policy with both `USING` and `WITH CHECK`, and a participant
     `FOR DELETE` policy, both `TO authenticated`.
   - Replace "Senders can insert messages" so `WITH CHECK` keeps `sender_id = auth.uid()` and adds
     `(kind = 'text' AND payload IS NULL) OR (kind IN ('offer','viewing_request') AND
     payload->>'status' = 'pending')`.
   - `REVOKE UPDATE ON public.messages FROM anon, authenticated;` then
     `GRANT UPDATE (is_read, flagged) ON public.messages TO authenticated;`.
   - **Do not revoke `SELECT` from `anon`.** See section 7.

4. **`apps/web/app/pages/inbox/[listingId]/[userId].vue`.** Replace `patchMessagePayload` (506-521)
   with a function that calls `supabase.rpc('respond_to_message', ...)`, updates local state only on
   success, and returns whether it worked. Update the callers at 541, 577, 583, 593 and 602 to stop
   on failure and show `sendError`, so a failed accept does not start a transaction or post a false
   "accepted" note.

5. **`tests/db/support/schema-files.ts`.** Add both migrations to `APPLIED_FILES`, after
   `20261030_profiles_column_privileges.sql`. `setup.test.ts:14-19` fails if a file is unlisted.

6. **`supabase/MIGRATION_CHECKLIST.md`.** Add a section after item 19 and renumber the seed items.

7. **Production.** Follow the order in Risks below, then repeat the key denied and allowed checks
   with real signed-in users, since PGlite is not Supabase.

## 5. Patterns to follow

- Column privileges: `20261030_profiles_column_privileges.sql:5-7`, including its comment that a
  column-level REVOKE does not affect a table-level grant.
- Safe definer function: `20261030_profiles_names_and_rows.sql:10-17`.
- Client RPC call and error handling: `apps/web/app/composables/useListings.ts:16`.
- Staged rollout: PR #1 then PR #3, one migration additive and the next one locking.
- Migration style: `BEGIN`/`COMMIT`, with a short comment on why.
- Tests: `tests/db/profile-privacy.test.ts`, with `it.each` for the denied matrix.

## 6. Reuse options

The new capability is "restrict which columns a user can update, and allow one narrow payload
change". Checked: repo and installed dependencies. No package search was needed, since this is
built-in Postgres; no web, npm or `gh` search was run.

| Option | Finding | Verdict |
| --- | --- | --- |
| Column privileges plus function | Repo precedent (PR #3). Deny by default, so a future column stays locked. Errors match `isDenied`. Survives someone re-running `messages_rls.sql`. | **Adopt.** |
| Trigger comparing old and new | No client change, since it can ignore `status` within the payload. But more logic to get right, it must exempt the service role, and it has no repo precedent. | Reject. |
| Server route | Could validate with the service role, but adds a route and session handling, and direct table updates must still be blocked anyway. | Reject. |

No new dependency.

## 7. Risks and blast radius

- **Anon `SELECT` on `messages` must stay.** The profile read policy queries `messages`
  (`20261030_profiles_names_and_rows.sql:29-31`), and that subquery runs with the caller's privileges.
  A blanket `REVOKE ALL ... FROM anon` here could make logged-out seller pages fail with permission
  denied. RLS already returns anon no message rows. `profile-privacy.test.ts:69` and `:101` should
  catch a mistake here. The behaviour is from Postgres knowledge, not run.
- **Rollout order.** Pushing to `main` auto-deploys (`README.md:138`), while SQL is run by hand.
  - Run migration 1 (additive, harmless to the old client).
  - Merge and let the new client deploy.
  - Run migration 2.
  - Reverse the order and old clients' responses fail. Worse, the old client shows the status
    locally while only logging the failure.
- **Stale tabs.** An open tab with the old code fails on respond after step 3. Reloading fixes it.
- **Function grants.** Postgres gives functions to `PUBLIC` by default, and Supabase is believed to
  also grant new functions to `anon` and `authenticated`. The test stand-in
  (`database.ts:26-27`) mimics default grants for tables only, so a test cannot prove the Supabase
  case. Check it on production:
  `select grantee from information_schema.routine_privileges where routine_name = 'respond_to_message';`
- **Delete remains open by design.** Either party can still delete a whole thread for both, including
  an accepted offer. This keeps today's behaviour; item 5 already tracks it.
- **Flags are shared.** One party's flag shows for both (`inbox/index.vue:217-223`,
  `useMessages.ts:90`). A participant policy keeps that. Not changed here.
- **Existing rows.** Old forged data cannot be detected: no history is kept. The insert check applies
  only to new rows, so old rows do not block the migration.
- **Item 3 overlap.** Item 3 will change the same INSERT policy. Do this one first and have item 3
  keep the payload condition.
- **Item 5 overlap.** Service-role deletes are unaffected, since nothing here changes that role.

## 8. Verified vs. inferred

**Verified by reading code at 82c9ccc:**

- All policies on `messages` in the repo, and that no file drops the FOR ALL policy.
- Every `.from('messages')` call in `apps/web`, and that no server route writes the table.
- All status values and insert payloads.
- `.rpc(` usage, and that no generated database types constrain the client (search for `Database`
  and `createClient<` found none).

**Reported by the audit, not re-run:** forged updates 1 and 2, on PGlite with the repo's SQL.

**Inferred, not run** (the investigation was read-only):

- Sender self-accept, forged-sender insert and pre-accepted insert.
- That the anon `SELECT` revoke would break profile reads.
- That the proposed policies behave as described. The new tests are what prove this.
- Supabase's default function grants, and that `postgres`, as table owner, passes RLS inside the
  definer function.

**Could not confirm:**

- **Production state.** Nobody has checked which `messages` policies or grants exist live, or
  whether the FOR ALL policy is really still there. The dashboard could also hold changes the repo
  does not show. Realtime is the same: no SQL file adds `messages` to a publication, yet the thread
  page depends on it, so it was likely enabled by hand.

## 9. Open questions

1. **Approach: replace the audit's "trigger or server route" with column privileges plus a function?**
   Recommend yes. It is deny by default and repeats PR #3's pattern. The cost is a small client change.
2. **May a sender change `is_read` on their own sent message?** Column grants cannot separate this
   from the recipient. Recommend accepting it: the only harm is a sender changing whether their own
   message looks read, and no forged terms are possible. Closing it needs a trigger or more functions.
3. **May an offer be responded to only once?** Recommend yes, matching the UI, which hides the buttons
   after a response. An accepted offer then cannot be un-accepted without a new feature.
4. **Include the two insert forgeries in this PR?** Recommend yes. One is fixed by the same policy
   drop, and the other is one condition in the policy being replaced.

## 10. Pre-existing problems

For their own tickets, not this change:

- `deleteThread` removes a conversation for both parties, including accepted offers (already in item 5).
- `flagged` is shared between parties, though it looks personal.
- Email and inbox text use `body` while the card uses `payload`, and a sender controls both at insert,
  so they can disagree. Fixing it means building `body` on the server.
- `onCounterSent` guesses the original offer as the latest pending one (`[userId].vue:569-576`) rather
  than keeping the message id from `counterOffer`.
- `acceptOffer` patches status before `startTransaction` (541-546), and `startTransaction` failure is
  not reported to it, so an offer can read accepted with no transaction. Worth rechecking under item 4.
- `startTransaction` ignores errors from the checklist insert (`[userId].vue:373-386`).
- The thread page subscribes to `INSERT` only (`[userId].vue:443`), so the other party sees a status
  change only after a reload.
- `README.md:94` says migrations run in any order, which is untrue for the 2026-10-30 files and
  for these.
- `MIGRATION_CHECKLIST.md:4` claims every file is safe to re-run (known, item 14). Re-running
  `messages_rls.sql` would recreate "Recipients can mark as read" and the old INSERT policy; column
  privileges would still hold, but the insert check would be weakened.
- Realtime publication settings are not in the repo.

## Recommendation

1. Run the read-only production checks first, since everything assumes the FOR ALL policy is live:
   ```sql
   select policyname, cmd, roles, qual, with_check from pg_policies
    where schemaname = 'public' and tablename = 'messages' order by 1;
   select grantee, privilege_type from information_schema.role_table_grants
    where table_schema = 'public' and table_name = 'messages' order by 1, 2;
   ```
2. Answer Open questions 1-4.
3. Write `tests/db/messages-integrity.test.ts` and confirm the denied cases fail for the right reason.
   Keep the allowed cases green throughout: they are the guard against breaking the inbox.
4. Add the two migrations and the client change on one branch, one PR, and confirm green.
5. As a checker sanity check, temporarily remove the lock migration from `APPLIED_FILES` and confirm
   the denied tests go red.
6. Roll out in the order in section 7, then repeat the checks on production as two real signed-in users.

# Plan: forged offers on `messages` (audit item 2)

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

**Definition of done**

- Nobody signed in can change `body`, `kind`, `listing_id`, `sender_id`, `recipient_id`,
  `created_at`, or any part of `payload` other than through a valid status response.
- Only the recipient of a pending offer or viewing request can respond to it, once, with a status
  valid for its kind.
- A user cannot insert a message that claims another person as sender, or one that is already
  accepted.
- Marking read and unread, flagging, deleting a thread, accepting, countering, declining, confirming
  a viewing and all insert paths still work.
- Tests fail before the fix and pass after it, then the same checks pass on production.

## 2. Source

`investigation-forged-offers.md`, written 2026-10-30 at 82c9ccc. `main` is still at 82c9ccc with a
clean working tree.

**Spot-check confirmed, by reading the code:**

- `supabase/schema.sql:355` is the FOR ALL policy, and no SQL file drops it.
- `supabase/messages_rls.sql:9-13`, `:16-20` and `:23-28` are the SELECT, INSERT and UPDATE policies.
- `apps/web/app/pages/inbox/[listingId]/[userId].vue`: `patchMessagePayload` at 506-521, callers at
  541, 577, 583, 593 and 602, `canAct` at 147, `sendError` declared at 260 and shown at 126 and 224.
- `apps/web/app/pages/inbox/index.vue`: `toggleFlag` 214, `markUnread` 234, `deleteThread` 254. None
  of them chain `.select()` on the write.
- All insert paths match the planned check. Text inserts send no `payload`, and offers and viewings
  send `status: 'pending'` (`OfferModal.vue:320`, `ViewingModal.vue:221`). `kind` defaults to `'text'`
  (`messages_kinds.sql:13`).
- `tests/db/support/database.ts`, `fixtures.ts` (`ACTIVE_LISTING` not exported) and `schema-files.ts`
  match, and `tests/db/setup.test.ts:14-19` is the file-list guard.
- No SQL file uses `FORCE ROW LEVEL SECURITY`, so a table owner's definer function passes RLS.

**No drift.** Four gaps turned up that the investigation did not cover; this plan handles all of them.

1. **`as()` runs one statement and rolls back**, so a test cannot call the function and then read
   the row. The function therefore returns the new payload, which also gives the client the
   server's value. The investigation had not said what it returns.
2. **The anon function test cannot tell two denials apart.** The function's own error also says
   "permission denied", so anon gets that message even if the grant is wrong. The grant needs a
   separate `has_function_privilege` assertion.
3. **The SELECT policy may not be live.** Checklist item 16 runs `messages_rls.sql` only "if not
   already included". If production lacks "Participants can read messages", dropping FOR ALL would
   empty every inbox. The lock migration recreates that policy, and the production check looks for it.
4. **A second response cannot be tested by responding twice**, for the same `as()` reason. The test
   seeds an already-answered offer instead.

## 3. Decisions and assumptions

**Open questions, all answered by Missa on 2026-10-30:**

1. Approach: column privileges plus one database function, replacing the audit's "trigger or server
   route".
2. A sender may change `is_read` on their own sent message. Accepted, since no terms can be forged.
3. An offer or viewing can be responded to only once. An accepted offer cannot be un-accepted
   without a new feature.
4. Both insert forgeries are fixed here.

**Reuse:** adopt built-in Postgres column privileges, following PR #3. Nothing is wrapped or built
beyond one function. No new dependency.

**Plan decisions:**

- **Two PRs, not the investigation's one.** The rollout is already three steps, and two PRs let the
  inbox run on the new code before anything is locked. PR #1 then PR #3 is the same shape.
- `respond_to_message` returns `jsonb`, the updated payload, for reasons given in section 2.
- `isBlocked` stays local to the new test file, so `isDenied` keeps its meaning for the privacy tests.
- The client shows one fixed error message. The function deliberately does not say which condition
  failed.

**Assumptions, each checked on production in the phases below:**

- The FOR ALL policy is live on production. Nobody has confirmed this.
- Supabase may grant new functions to `anon` and `authenticated` by default, so both are revoked
  explicitly.
- `postgres`, as table owner, passes RLS inside the definer function.

## 4. Phase overview

**Prerequisite:** the read-only production check in Phase 1, step 0. Missa runs it. It decides
whether this plan still applies.

1. **Add the respond function and move the client onto it.** Additive, depends on nothing.
2. **Lock message writes.** Depends on Phase 1 being deployed and its migration run.

## 5. Phases

### Phase 1: respond function and client

**Goal.** Give the inbox a safe way to respond, and stop the page reporting a response that failed.
This stands alone: it closes no hole yet, but it improves failure handling and nothing depends on
the lock.

**Step 0, before any code.** Run in the Supabase SQL Editor (read-only):

```sql
select policyname, cmd, roles, qual, with_check from pg_policies
 where schemaname = 'public' and tablename = 'messages' order by 1;
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'messages' order by 1, 2;
```

Expected: "Message participants only", "Participants can read messages", "Senders can insert
messages", "Recipients can mark as read". Stop and revisit this plan if FOR ALL is missing, if an
unknown policy exists, or if a trigger or dashboard change appears that the repo does not show.

**Changes**

- `tests/db/support/fixtures.ts`: export `ACTIVE_LISTING` (line 9).
- `tests/db/messages-integrity.test.ts` (new, written first). Copy the setup of
  `profile-privacy.test.ts:17-27`. Seed in this file's own `beforeAll`, not shared fixtures, so profile
  tests are unaffected: a pending offer, a pending viewing request, an already-accepted offer and a
  text message, with fixed ids and buyer to seller.
- `supabase/migrations/20261030_messages_respond_function.sql` (new). If this is written on a later
  day, use that day's date in the file name, here and everywhere below.

  ```sql
  -- Offer and viewing responses go through here, so the client never writes payload.
  BEGIN;

  CREATE OR REPLACE FUNCTION public.respond_to_message(message_id uuid, new_status text)
  RETURNS jsonb AS $$
  DECLARE
    updated_payload jsonb;
  BEGIN
    UPDATE public.messages m
       SET payload = jsonb_set(m.payload, '{status}', to_jsonb(new_status))
     WHERE m.id = message_id
       AND m.recipient_id = auth.uid()
       AND m.payload->>'status' = 'pending'
       AND ((m.kind = 'offer' AND new_status IN ('accepted', 'countered', 'declined'))
         OR (m.kind = 'viewing_request' AND new_status IN ('confirmed', 'declined')))
    RETURNING m.payload INTO updated_payload;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
    END IF;

    RETURN updated_payload;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

  -- Functions are executable by PUBLIC by default.
  REVOKE EXECUTE ON FUNCTION public.respond_to_message(uuid, text) FROM PUBLIC, anon, authenticated;
  GRANT EXECUTE ON FUNCTION public.respond_to_message(uuid, text) TO authenticated;

  COMMIT;
  ```

  One `UPDATE` means two simultaneous clicks cannot both win: the second waits, rechecks the row, and
  no longer finds it pending.

- `tests/db/support/schema-files.ts`: add the migration to `APPLIED_FILES` after
  `20261030_profiles_column_privileges.sql`.
- `apps/web/app/pages/inbox/[listingId]/[userId].vue`:
  - Replace `patchMessagePayload` (506-521) with `respondToMessage(messageId, status)`. It calls
    `supabase.rpc('respond_to_message', { message_id: messageId, new_status: status })`, follows the
    error handling at `useListings.ts:16`, and returns whether it worked.
  - On success, set the local message's `payload` from the returned value and clear `sendError`.
  - On failure, log the detail, set `sendError` to `'Could not save your response. Reload the page
    and try again.'` and leave local state alone. The local change no longer happens first.
  - Callers at 541, 583, 593 and 602 return early on failure, so a failed accept starts no
    transaction and posts no note.
  - `onCounterSent` (577) has nothing after the call, so the helper's error message is enough. The
    counter-offer has already been sent by then, so the page reports only the failed status change.
- `supabase/MIGRATION_CHECKLIST.md`: add a "Message integrity" section after item 19 with item 20,
  this migration. Renumber the seed items. Change item 19's "Must run last" to "Must run after the
  migration above", which is no longer true as written.

**Tests** (`describe` names reflect behavior)

- Recipient succeeds for each valid pair: offer with `accepted`, `countered`, `declined`; viewing
  with `confirmed`, `declined`. Assert the returned `status`, and that `offer_price` and the other
  fields are unchanged.
- Rejected with `isDenied`: sender, stranger, anon, an answered offer, `confirmed` on an offer,
  `accepted` on a viewing, a text message, an unknown status, a message id that does not exist.
- `SELECT has_function_privilege('anon', 'public.respond_to_message(uuid, text)', 'EXECUTE')` is
  false, and true for `authenticated`. This is the only test that proves the grant.
- Guards, passing from the start and in both phases: recipient sets `is_read` both ways; both parties
  set `flagged`; both parties delete; sender inserts text, offer and viewing; either party inserts a
  system note. Assert writes with `RETURNING`, because `as()` rolls back.

Each `as()` rolls back, so tests do not disturb one another's seed rows.

**Verification**

1. Write the tests and run `npm test`. Confirm the function tests fail because the function does not
   exist, and the guards pass.
2. Add the migration. `npm test` is green.
3. Checker sanity check: delete the `REVOKE`/`GRANT` lines, confirm the `has_function_privilege` test
   goes red, and restore them.
4. `npm run format:check` and `npm run build`. `npm run lint` and typecheck cannot be used (item 13).
5. Run the migration on production **before merging**. Then check the grants:
   ```sql
   select grantee from information_schema.routine_privileges
    where routine_name = 'respond_to_message';
   ```
   Expected: `authenticated` and the owner or service roles, with no `anon` and no `PUBLIC`. If anon
   appears, run the `REVOKE` again and find out why.
6. Merge, let Cloudflare deploy, then as two real signed-in users: accept, counter, decline, confirm
   and decline a viewing, and read back the status after a reload. These prove the definer function
   passes RLS on Supabase, which PGlite cannot.

The client change has no automated test: component tests are deferred, so the by-hand checks in step
6 are the only evidence for it. Report that plainly in the PR.

**Safe to merge because** the migration only adds a function and the old policies stay. The one
ordering rule: the migration must run before the merge, because the new client calls the function. A
failure then shows an error and changes nothing.

**Branch and PR title:** `fix/messages-respond-function`, "Send offer and viewing responses through a
database function".

### Phase 2: lock message writes

**Goal.** Close the forgeries: drop the permissive policies, limit direct updates to `is_read` and
`flagged`, and tighten inserts.

**Changes**

- `tests/db/messages-integrity.test.ts`: add the denied tests first and watch them fail.
- `supabase/migrations/20261030_messages_lock_writes.sql` (new):

  ```sql
  -- The FOR ALL policy overrode every narrower rule, because permissive policies are OR'd, and row
  -- policies cannot limit columns. Table-level UPDATE must go first because a column-level REVOKE
  -- does not affect a table-level grant.
  BEGIN;

  DROP POLICY IF EXISTS "Message participants only" ON public.messages;
  DROP POLICY IF EXISTS "Recipients can mark as read" ON public.messages;
  DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
  DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;

  CREATE POLICY "Participants can read messages"
    ON public.messages FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

  CREATE POLICY "Senders can insert messages"
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK (
      sender_id = auth.uid()
      AND ((kind = 'text' AND payload IS NULL)
        OR (kind IN ('offer', 'viewing_request') AND payload->>'status' = 'pending'))
    );

  CREATE POLICY "Participants can update messages"
    ON public.messages FOR UPDATE TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid())
    WITH CHECK (sender_id = auth.uid() OR recipient_id = auth.uid());

  CREATE POLICY "Participants can delete messages"
    ON public.messages FOR DELETE TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

  REVOKE UPDATE ON public.messages FROM anon, authenticated;
  GRANT UPDATE (is_read, flagged) ON public.messages TO authenticated;

  COMMIT;
  ```

  **Do not revoke `SELECT` from `anon`.** The profile read policy queries `messages`
  (`20261030_profiles_names_and_rows.sql:29-31`) with the caller's privileges, so a blanket revoke
  could break logged-out seller pages. RLS already gives anon no rows.

- `tests/db/support/schema-files.ts`: add the migration after the respond function migration.
- `supabase/MIGRATION_CHECKLIST.md`: add item 21, with a warning that it runs only after the new
  client is deployed. Renumber the seed items.

**Tests**

- Denied with `isDenied` (`it.each`): recipient and sender each changing `body`, `payload`,
  `recipient_id`, `sender_id`, `listing_id`, `kind`, `created_at`. This covers forgeries 1 to 3 from
  the investigation, including a sender self-accepting through `payload`.
- Denied with `isDenied`: anon updating any column.
- Zero rows: stranger updating `is_read` or `flagged`, stranger deleting, anon deleting. RLS returns
  no rows on UPDATE and DELETE rather than an error, so assert `rows` has length 0 and do not use
  `isDenied`.
- Blocked with a local `isBlocked` matching "row-level security": insert claiming another sender,
  including the recipient-as-forger case; insert of an offer or viewing with a non-pending status;
  insert of an offer with no payload; insert of a text message with a payload; anon insert.
- All Phase 1 guards stay green. They are what protects the inbox.
- `service_role` can still update and delete, which item 5 relies on.
- `profile-privacy.test.ts:69` and `:101` cover anon reads. Keep them green.

**Verification**

1. With the denied tests written and no migration, run `npm test`. Confirm each fails for the right
   reason: the forged write succeeded. Guards stay green.
2. Add the migration. `npm test` is green.
3. Checker sanity check: remove the lock migration from `APPLIED_FILES`, confirm the denied tests go
   red (the file-list guard also fails, as expected), then restore it. A clean run proves nothing
   until this has been seen.
4. `npm run format:check`.
5. Confirm Phase 1 is deployed, then merge. This PR changes only SQL, tests and the checklist.
6. Run the migration on production, then run the two step 0 queries again. Expected: the four new
   policies, and `authenticated` with no table-wide `UPDATE`. Column grants appear in
   `information_schema.column_privileges`, not `role_table_grants`.
7. As two real signed-in users on production, using the browser console or the REST API:
   - Denied: recipient changing `body`, sender changing `payload`, inserting with another
     `sender_id`, inserting an accepted offer.
   - Still works: mark read and unread, flag, delete a thread, send text, send an offer and a viewing,
     accept, counter, decline, confirm.
   - Logged out: a seller page still shows the seller's name.
8. Update the backlog memory note: mark item 2 done and keep its description accurate, as that file
   asks.

**Safe to merge because** nothing in this PR is applied by merging: the SQL is run by hand, and the
deployed client already uses the function.

**Rollback** if the inbox breaks on production:

```sql
GRANT UPDATE ON public.messages TO authenticated;
CREATE POLICY "Message participants only" ON public.messages FOR ALL
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
```

This reopens the hole on purpose, so use it only to restore service while the fault is found. Check
the original text at `supabase/schema.sql:355-357` before running it.

**Branch and PR title:** `fix/messages-lock-writes`, "Limit message updates to read and flag, and
validate inserts".

## 6. Risks

- **Rollout order.** Pushing to `main` deploys automatically (`README.md:138`) and SQL is run by hand.
  The order is: migration 1, merge Phase 1, confirm the deploy, merge Phase 2, migration 2. Running the
  lock first breaks every response on the old client, which also shows the status locally while
  only logging the failure. The two-PR split makes this order hard to get wrong.
- **PGlite is not Supabase.** Default function grants and the definer's RLS bypass can only be proven
  on production, which is why each phase ends there.
- **Stale tabs.** A tab open across the lock fails on respond and direct edits. Reloading fixes it.
  Few users are affected, and Phase 1's deploy comes first.
- **Live state may differ from the repo.** Step 0 catches this before any work, and Phase 2 recreates
  the read and insert policies rather than assuming them.
- **Re-running `messages_rls.sql`** would recreate "Recipients can mark as read" and the weaker insert
  policy. Column privileges still hold, but the insert check would be lost. Same class as item 14.
- **Existing rows.** Old forged data cannot be detected, since no history is kept. The insert check
  applies only to new rows, so old rows do not block the migration.
- **Item 3 will change the same INSERT policy.** It must keep the payload condition, and the tests
  here will fail if it does not. Do this item first.
- **Responses cannot be undone.** A mistaken accept is permanent until a new feature exists. This
  was chosen in open question 3.

## 7. Out of scope

For their own tickets:

- **New, from this spot-check:** inserts can still set `created_at`, `is_read` and `flagged`, so a
  sender can backdate a message. Terms cannot be forged this way, and a column-level `INSERT` grant
  would close it.
- `deleteThread` removes a conversation for both parties, including accepted offers (item 5).
- `flagged` is shared between parties, though it looks personal.
- Email and inbox text use `body` while the card uses `payload`, and a sender controls both at
  insert, so they can disagree. Fixing it means building `body` on the server.
- `onCounterSent` guesses the original offer as the latest pending one (`[userId].vue:569-576`).
- `acceptOffer` sets status before `startTransaction`, and a `startTransaction` failure is not
  reported to it, so an offer can read accepted with no transaction. Recheck under item 4.
- `startTransaction` ignores errors from the checklist insert (`[userId].vue:373-386`).
- The thread page subscribes to `INSERT` only (`[userId].vue:443`), so the other party sees a status
  change only after a reload.
- `README.md:94` says migrations run in any order, which is untrue for these files.
- `MIGRATION_CHECKLIST.md:4` claims every file is safe to re-run (item 14).
- Realtime publication settings are not in the repo.
- Offer payload contents are not validated on insert, for example a negative `offer_price`.
- Branch protection on `main` is still undecided, so a red test check warns but does not block.

## Recommendation

Start with Phase 1, and run step 0 before writing any code, since everything here assumes the FOR ALL
policy is live.

## Progress

- **Step 0: done 2026-10-30.** Missa ran the checks on production. All four expected policies are
  live, FOR ALL included, with no unknown policy. Grants are the Supabase defaults. `messages` has no
  triggers, an extra query added to step 0 because the two listed queries cannot show one.
- **Phase 1: done.** Merged as befa42b (PR #6), migration run, deployed. Production read-backs on
  2026-10-30, as one signed-in account, showed an offer countered, a counter-offer declined, an
  offer accepted with its note, a viewing declined and a viewing confirmed, with both accounts
  responding. Accepting created one transaction. Branch `fix/messages-respond-function`, from `main`
  at 82c9ccc. The failure message has not been seen on a live page.
  Added the function, its tests and guards, moved the thread page to `respondToMessage`, and updated
  `schema-files.ts`, `fixtures.ts` and the checklist. Tests, format and build ran locally. Verification
  steps 5 and 6 are still open: the production migration and grant check before merging, then the
  signed-in click-through after deploying.
- **Phase 2: done.** Merged as ab0a361 (PR #8), migration run. Production read-backs on 2026-10-30
  matched: the four new policies, no table-wide `UPDATE` for `anon` or `authenticated`, and column
  `UPDATE` on `flagged` and `is_read` only. Missa reported the step 7 checks working; the console
  output was not reviewed. Branch `fix/messages-lock-writes`, from `main` at d864808. Added
  `supabase/migrations/20261030_messages_lock_writes.sql` as written in this plan, the denied,
  zero-row, blocked and service role tests, the `APPLIED_FILES` entry, and checklist item 21. Tests,
  format and build ran locally.
  **Deviation:** added one test the plan did not list, a stranger insert with no `RETURNING`, because
  `RETURNING` applies the SELECT policy and hid the INSERT check. Also added a viewing with no payload.

# Plan: account deletion blocked by foreign keys (audit items 5 and 21)

Planned 2026-11-13 against `main` at `2b769d6`. Source: `investigation-account-deletion.md`.

## 1. Task

Original task text, verbatim:

> items 5 and 21 from today's audit

The two items, as the investigation records them:

- **Item 5 (blocking).** Account deletion fails for anyone who has messaged a seller: FK
  `messages_sender_id_fkey`. `transactions` and `transaction_checklists` have similar
  non-cascading keys. The `server/api/account/delete.post.ts` comment wrongly assumes cascades, and
  the privacy page promises deletion. Also: an auth deletion failure is swallowed, Cloudinary photos
  remain, and `deleteThread` in `inbox/index.vue` removes the thread for both parties.
- **Item 21 (blocking, reproduced in PGlite).** Item 5's FK error also blocks any auth-user delete,
  so ChoreQuest `DELETE /kids/:id` fails for anyone who has sent a Frula message.

**Definition of done.**

- In the repo's SQL (proved in the PGlite DB tests), deleting a profile or an `auth.users` row
  succeeds for a user who has sent and received messages, made and received offers, been buyer and
  seller on a transaction, owns a transaction checklist, and has a listing plan.
- Every other user's data ends in the state chosen below (Decisions 1 and 2), and the tests assert
  that state.
- `POST /api/account/delete` no longer swallows an auth-deletion failure, and its comments are
  accurate.
- The migration has been run on production (Missa runs it), and a query of `pg_constraint` shows the
  new delete actions there.

## 2. Source

`investigation-account-deletion.md`, written against `2b769d6`, which is still `main`.

**Spot-check confirmed (code matches the investigation):**

- `supabase/schema.sql:13` `profiles.id` cascades from `auth.users`.
- The six keys with no delete action: `schema.sql:217` `messages.sender_id`, `:218`
  `messages.recipient_id`, `:243` `transactions.seller_id`, `:244` `transactions.buyer_id`
  (nullable), `:290` `transaction_checklists.user_id`, `:303` `listing_plans.user_id`. A grep of
  `supabase/` finds nothing later that alters them.
- `supabase/migrations/20260421_cascade_fixes.sql:5-14` is the drop-and-re-add precedent.
- `apps/web/server/api/account/delete.post.ts`: false cascade comments at `:1-11` and `:33-36`,
  profile delete at `:37`, 500 at `:39-46`, `deleteUser` at `:49`, swallowed auth error at `:51-57`,
  `{ deleted: true }` at `:59`.
- `apps/web/app/pages/account.vue:480-494` caller; `apps/web/app/pages/privacy.vue:124-127` promise.
- `tests/db/support/schema-files.ts:7-32` `APPLIED_FILES` ends with
  `migrations/20261111_listings_address_checks.sql`.
- `tests/routes/support/fake-services.ts:119-164` handles only `GET /auth/v1/user`, GET reads on
  `messages|profiles|listings`, the claim RPC, `POST /rest/v1/notifications`, Resend, Census and
  Nominatim; anything else gets 404.
- No triggers or rules on `messages`, `transactions`, `transaction_checklists` or `listing_plans`
  would interfere with a cascade (grep of the 2026-10-30 migrations and RLS files). RLS does not
  apply to FK cascade actions.

**Drift and gaps found:**

- `supabase/MIGRATION_CHECKLIST.md:125-131` already uses steps 24 and 25 for optional seed data. The
  new step goes in as **24** in its own section before "Seed data", and the two seed steps are
  renumbered to 25 and 26. Nothing else in the repo refers to those step numbers (grep).
- `tests/db/support/database.ts:57-74`: `as()` runs exactly one statement and always rolls back, so
  it can't delete and then read the result. And `createTestDatabase()` (`:41-55`) always applies
  every file, so the investigation's "control without the new migration" needs a way to leave one
  file out. Both are small harness additions in Phase 1.
- `tests/db/support/fixtures.ts:30-40`: `seedPeople` already gives `BUYER` a message to `SELLER` on
  `ACTIVE_LISTING`, and a transaction on `DRAFT_LISTING` between `TXN_A` (seller) and `TXN_B`
  (buyer). Phase 1's test adds the rest of the references itself.

Nothing here invalidates the investigation.

## 3. Decisions and assumptions

Answers Missa gave to the investigation's open questions (all three took the recommendation):

1. **Other party's copy of shared records:** CASCADE `messages.sender_id` and
   `messages.recipient_id` (messages, offers and viewing requests go in both directions), and
   `SET NULL` on `transactions.buyer_id` (the seller keeps the transaction and their checklist).
   `transactions.seller_id` and `transaction_checklists.user_id` CASCADE.
2. **`listing_plans`:** CASCADE now. Revisit retention when Stripe lands in Phase 2 of the product.
3. **Order relative to item 20:** ship the migration first, on its own. Hold the route change and
   ship it together with item 20's fix.

**Reuse decision:** none needed. The investigation's Reuse options section found no new capability:
Postgres FK delete actions plus error handling in an existing route. No new dependency.

**Assumptions:**

- Production's constraint names are the Postgres defaults. Phase 1 makes Missa confirm this with a
  `pg_constraint` query before running, because a misnamed `DROP CONSTRAINT IF EXISTS` would silently
  leave the old key in place beside the new one.
- No `chore` schema table references `public.profiles` (ChoreQuest SQL was not read). The
  pre-migration `pg_constraint` query lists every key pointing at `profiles`, so a ChoreQuest one
  would show up there.
- Item 20's fix will be planned separately (no investigation file exists for it yet). Phase 2 waits
  on it.

## 4. Phase overview

1. **Profile delete actions** — new migration giving the six keys deliberate delete actions, its
   checklist step, and a PGlite test proving deletion now succeeds. Depends on nothing. Fixes item 21
   and the database half of item 5.
2. **Honest delete route** — accurate comments, an error instead of `{ deleted: true }` when the auth
   delete fails, route tests and fake-service handlers. Depends on Phase 1, and ships with item 20's
   fix.

Two phases, not one, because Decision 3 separates them in time. Not more than two, because the
migration, its checklist entry and its test are one reviewable unit, and so are the route change and
its test.

## 5. Phases

### Phase 1: Profile delete actions

**Goal.** Make every reference to `public.profiles(id)` carry a deliberate delete action, so deleting
a profile or an `auth.users` row always succeeds. This unblocks ChoreQuest kid deletes (item 21)
immediately, and makes Frula's delete route get past `delete.post.ts:37`. It stands alone because the
route already does the right sequence; only the database refused it.

**Changes.**

- **Create `supabase/migrations/20261113_profile_delete_actions.sql`** (use the actual merge date if
  later). Header comment explaining why: the six keys were `NO ACTION`, which refused any profile
  delete (and through `schema.sql:13`, any `auth.users` delete) while a surviving row still pointed
  at the profile; name audit items 5 and 21 and the chosen behavior. Wrap in `BEGIN;` ... `COMMIT;`
  like `migrations/20261030_profiles_names_and_rows.sql`. One `ALTER TABLE` per table in the
  `20260421_cascade_fixes.sql:5-14` style (`DROP CONSTRAINT IF EXISTS ..., ADD CONSTRAINT ...`):
  - `public.messages`: `messages_sender_id_fkey` and `messages_recipient_id_fkey` →
    `REFERENCES public.profiles(id) ON DELETE CASCADE`.
  - `public.transactions`: `transactions_seller_id_fkey` → `ON DELETE CASCADE`;
    `transactions_buyer_id_fkey` → `ON DELETE SET NULL`.
  - `public.transaction_checklists`: `transaction_checklists_user_id_fkey` → `ON DELETE CASCADE`.
  - `public.listing_plans`: `listing_plans_user_id_fkey` → `ON DELETE CASCADE`.
  - No `NOT VALID`: the tables are small, and re-validating is a brief lock (investigation section 7).
- **Do not edit `supabase/schema.sql`.** The repo's pattern is that later files alter earlier ones
  (`20260421_cascade_fixes.sql` didn't touch `schema.sql` either), and the PGlite harness applies
  both in order.
- **`supabase/MIGRATION_CHECKLIST.md`.** Insert a new section before "Seed data (optional, for
  testing)" (currently `:125`), titled "Account deletion (run after listing address rules)", with
  step **24** for the migration, following step 23's format (`:97-123`):
  - What it does, in one or two lines, and a ⚠️ note that it widens what an `auth.users` delete
    removes, including deletes made from ChoreQuest.
  - SQL block: (1) before running, the query below; expect the six named constraints with
    `confdeltype = 'a'`, and stop if any name differs from the migration; (2) run the migration;
    (3) re-run the query and expect `c` for the two message keys, `transactions_seller_id_fkey`,
    `transaction_checklists_user_id_fkey`, `listing_plans_user_id_fkey`, `n` for
    `transactions_buyer_id_fkey`, and exactly one key per column (no duplicates left beside a
    misnamed drop).

    ```sql
    select conname, conrelid::regclass, confdeltype
    from pg_constraint
    where confrelid = 'public.profiles'::regclass and contype = 'f'
    order by conrelid::regclass::text, conname;
    -- confdeltype: a = no action, c = cascade, n = set null
    ```
  - Renumber the seed steps from 24 and 25 to 25 and 26.
- **`tests/db/support/schema-files.ts`.** Append
  `'migrations/20261113_profile_delete_actions.sql'` to `APPLIED_FILES` after `:31`.
- **`tests/db/support/database.ts`.** Give `createTestDatabase` an optional parameter naming files to
  leave out (for example `createTestDatabase({ without: ['migrations/20261113_profile_delete_actions.sql'] })`),
  defaulting to none, so existing callers are unchanged. Needed for the control case. Also add a
  small helper (or do it inline in the test, whichever is shorter) that, as `service_role` inside one
  `BEGIN` ... `ROLLBACK`, runs a delete and then the follow-up reads, returning the delete's error or
  the reads' rows. `as()` can't do this because it runs one statement and rolls back
  (`database.ts:57-74`).
- **Create `tests/db/account-deletion.test.ts`**, following `tests/db/messages-integrity.test.ts`
  (named ID constants, `createTestDatabase`, fixtures). Seed with `seedPeople`, then add, for one
  departing user (use `BUYER`, renamed in a constant like `LEAVER` only if it reads better), rows
  covering every reference:
  - messages sent and received on someone else's listing (`BUYER` ↔ `SELLER` on `ACTIVE_LISTING`;
    one exists already, add the reply), including one `kind = 'offer'` row;
  - a transaction where `BUYER` is the buyer on `SELLER`'s listing, with a checklist owned by each
    party;
  - a transaction where `BUYER` is named `seller_id` on a listing they don't own (item 4's fabricated
    case);
  - a `listing_plans` row for `BUYER` on someone else's listing;
  - a listing `BUYER` owns, with a message from `STRANGER` on it.

  Tests (behavior names):
  - `deleting the auth user removes the profile` (item 21's path).
  - `deleting the profile directly succeeds` (item 5's path).
  - `removes the departed user's messages in both directions`.
  - `keeps the seller's transaction with no buyer` (`buyer_id` is null, seller's checklist and
    listing remain).
  - `removes the departed user's checklist, listing plans and fabricated seller transactions`.
  - `leaves other users' messages and listings alone` (`STRANGER`/`SELLER` rows unrelated to `BUYER`
    remain, apart from `STRANGER`'s message on `BUYER`'s own listing, which goes with the listing).
  - `a seller with only own-listing rows could already be deleted` (confirms the investigation's
    inferred end-of-statement behavior; run against the database *without* the migration).
  - Control: `without the migration, the same delete fails on a foreign key` — build the database
    with the new file left out and expect an error matching `violates foreign key constraint`. This
    shows the main tests can fail, so a pass means something.

**Tests.** The new `tests/db/account-deletion.test.ts` above. Existing DB tests must keep passing
(`setup.test.ts` checks that every file applies).

**Verification.**

- `npm test` from the repo root (`package.json:14` runs `vitest run`); expect all suites green,
  including the new file.
- Sanity-check the checker: temporarily change one action in the migration (for example
  `buyer_id` to `CASCADE`) and confirm the "keeps the seller's transaction" test fails; revert.
- Hand check (Missa, on production, per checklist step 24): run the `pg_constraint` query before
  and after the migration and compare against the expected `confdeltype` values.
- Optional, after production: in ChoreQuest, delete a throwaway kid who has a Frula message, and
  confirm `DELETE /kids/:id` succeeds.

**Safe to merge because.** Merging changes no running code: the migration only takes effect when
Missa runs it on production, and the app doesn't read delete actions. Once run, it only widens
behavior (deletes that failed now succeed); nothing that succeeds today starts failing. The route
already handles a successful profile delete correctly. See Risk 1 for what that widening exposes.

**Suggested branch and PR title.** `fix/profile-delete-actions` — "Let profile and auth-user deletes
cascade through messages and transactions".

### Phase 2: Honest delete route

**Goal.** Stop telling a user they're deleted when their auth account still exists, and make the
route's comments describe the real delete chain. Per Decision 3, this ships together with item 20's
fix (in the same PR, or merged right after it), so Frula account deletion is fixed once and the
route's auth call is settled before its error handling is.

**Changes.**

- **`apps/web/server/api/account/delete.post.ts`.**
  - Rewrite the header (`:1-11`) and the cascade comment (`:33-36`) to the real chain: profile delete
    cascades to listings (and through them photos, documents, plans, transactions, checklists,
    messages on those listings), the user's messages in both directions, saved listings, search
    alerts, notifications, their checklists and listing plans; `listing_views.viewer_id` and
    `transactions.buyer_id` are set to null. Point at the Phase 1 migration file by its exact name.
  - At `:51-57`, throw a 500 with a user-facing message (for example "Your data was deleted, but we
    couldn't close your sign-in. Please try again.") instead of falling through to
    `{ deleted: true }`. Keep the server log. Explain in a comment that a retry works: the profile
    delete at `:37` then matches 0 rows and succeeds, and `deleteUser` runs again.
  - Do not change which auth call is made here unless item 20's fix does so; that's item 20's call.
  - Check that `account.vue:491-492` shows the new message (`err.data?.message`). If Nitro puts
    `statusMessage` somewhere else, set `message` or `data` on the error so the page displays it;
    don't change the page unless it has to.
- **`tests/routes/support/fake-services.ts`.** Add a `DELETE /rest/v1/profiles` handler (records the
  call; can be told to fail) and a `DELETE /auth/v1/admin/users/{id}` handler (can be told to fail),
  using the existing toggles' style (`isClaimFailing`, `isResendFailing` at `:105-107`). The
  installed `@supabase/auth-js` sends `DELETE {auth url}/admin/users/{id}`
  (`node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js:716-725`); re-check that path when
  writing the handler.
- **Create `tests/routes/account-delete.test.ts`**, following `tests/routes/notifications-send.test.ts`.
  Use a fresh user per test, since the route allows 3 calls an hour per user (`delete.post.ts:23`).
  Cases:
  - `deletes the profile and then the auth user, and reports success` (assert both calls, in order).
  - `returns 500 and skips the auth delete when the profile delete fails`.
  - `returns an error, not success, when the auth delete fails` (the item 5 fix; fails on today's
    code).
  - `a retry after a failed auth delete succeeds`.
  - Logged-out calls: pin the current 500 as `notifications-send.test.ts` does for item 19, with a
    comment; don't assert 401.
  - Plus whatever item 20's fix requires of this route.

**Tests.** The new route test file above; the existing route tests must keep passing.

**Verification.**

- `npm test`; all green.
- Sanity-check: run the new "auth delete fails" test against the unchanged route first and confirm
  it fails, then apply the fix and confirm it passes.
- Hand check on a preview or local build with a throwaway account: delete it from `/account`, confirm
  sign-out and redirect, and confirm the auth user is gone in the Supabase dashboard. Hand check the
  failure message by pointing at the fake or forcing the error locally; don't break production auth.

**Safe to merge because.** The success path is unchanged; only the auth-failure path changes, from a
false success to an error the user can retry. Comments carry no behavior. It merges with item 20's
fix, so the route's auth behavior changes once.

**Suggested branch and PR title.** Fold into item 20's branch, or `fix/account-delete-honest-errors`
stacked on it — "Report a failed sign-in deletion instead of claiming the account is gone".

## 6. Risks

1. **Phase 1 alone makes item 20 happen more often.** Holding the route change (Decision 3) doesn't
   prevent this: once the migration runs, Frula account deletes that used to fail at
   `delete.post.ts:37` reach `deleteUser` at `:49`, and deleting the shared auth user cascades to
   `chore.users`. Accepted in Decision 3 because ChoreQuest kid deletes are broken today and the
   overlap is only people using both apps. Limit: plan and ship item 20 next.
2. **Irreversible data loss on the counterparty's side.** Deleting a buyer removes their offers from
   the seller's inbox, including accepted ones. Chosen deliberately (Decision 1); offers are
   expressions of interest, not binding. Phase 1's tests pin exactly what is removed and kept.
3. **Misnamed constraints on production** would leave a `NO ACTION` key beside the new one, and the
   delete would still fail. Limit: checklist step 24's before/after `pg_constraint` query, which also
   catches duplicates.
4. **Lock during re-validation.** Each re-added key scans its table. Small tables today; run it at a
   quiet time anyway.
5. **Realtime cascade deletes.** Open inboxes get DELETE events for vanished threads; how the inbox
   reacts wasn't checked. Limit: the Phase 2 hand check deletes a throwaway account while the other
   party's inbox is open, and anything odd becomes its own ticket.
6. **Harness change affects every DB test.** The `createTestDatabase` option defaults to applying
   everything, so existing tests are unaffected; the full suite run in Phase 1 confirms it.

## 7. Out of scope

Each belongs in its own ticket:

- **Item 20:** Frula `account/delete` deletes the shared auth user, which cascades to `chore.users`.
  Phase 2 waits on its fix.
- **Item 5 sub-points not on the failing path:** Cloudinary photos are never deleted when an account
  or listing goes; `deleteThread` (`apps/web/app/pages/inbox/index.vue:255`) deletes the thread for
  both parties.
- **Item 19:** logged-out calls to `account/delete` get 500, not 401.
- **Item 4:** fabricated transactions can name any user as `seller_id`. Phase 1's CASCADE limits the
  damage on delete but doesn't fix creation.
- **Item 22:** `handle_new_user` (`schema.sql:24-35`) gives every ChoreQuest user a Frula profile.
- **Item 7:** the route's rate limit (`delete.post.ts:23`) is per-instance memory.
- **Privacy page wording** (`privacy.vue:124-127`) already matches Decision 1; no change. Its lack of
  attorney review is a standing issue, not this change's.
- **`listing_plans` retention** once Stripe payments exist.

## Recommendation

Start with Phase 1. It is self-contained, unblocks ChoreQuest's kid deletes today, and its control
test proves the fix. After it merges, Missa runs checklist step 24 on production, and item 20 should
be investigated next so Phase 2 can ship with it.

## Progress

- **Phase 1:** done, committed (`4d873c2`) and pushed. PR #16 (https://github.com/melissapula/frula/pull/16) merged to `main` on 2026-11-13 as `923f79f`. Migration run on production 2026-11-13 by Missa; the after-check showed the five keys as `c`, `transactions_buyer_id_fkey` as `n`, one key per column and no `a` key left (the before-check was skipped, which the after-check covers). ChoreQuest kid-delete check not done. Branch `fix/profile-delete-actions`, based on `main` at
  `2b769d6` (#15). Added `supabase/migrations/20261113_profile_delete_actions.sql` (six keys:
  CASCADE on both message keys, `transactions.seller_id`, `transaction_checklists.user_id`,
  `listing_plans.user_id`; SET NULL on `transactions.buyer_id`; one transaction), listed it in
  `schema-files.ts`, added checklist step 24 (seed steps renumbered 25 and 26), gave
  `createTestDatabase` a `without` option and added `readAfterDelete` in `database.ts`. 9 tests in
  `tests/db/account-deletion.test.ts`; full suite 330 passed. Deviations:
  - **The investigation's end-of-statement inference is wrong.** Without the migration, deleting a
    seller whose rows all sit on their own listings also fails (`messages_recipient_id_fkey`), even
    with only one received message. Postgres queues the listing cascade's message deletes behind
    the NO ACTION check on `profiles`, so the check still sees the messages. By Missa's decision the
    planned test became `a seller with only own-listing rows also fails today`, and
    `deleting a seller with only own-listing rows succeeds` was added after the migration. So today
    any seller who has received a message can't delete their account either; the migration fixes
    both cases.
  - `readAfterDelete` runs as the database owner, not `service_role`. The stand-in grants
    `service_role` nothing on `auth.users` (Supabase deletes it as its own auth admin role), and
    FK actions don't depend on the caller's role.
  - Sanity check went beyond the plan: besides `buyer_id` → CASCADE (1 test failed), leaving
    `listing_plans.user_id` as NO ACTION failed 6 tests.
  - Production step 24 (before/after `pg_constraint` query) not done yet.
- **Phase 2:** shipped in `plan-shared-auth-delete.md` Phase 2, merged as `811d2fc` (PR #18,
  2026-11-13). The route errors on a failed auth delete instead of reporting success, and its
  comments describe the real delete chain. Its hand check was not run (no throwaway accounts).

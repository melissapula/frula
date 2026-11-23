# Investigation: account deletion blocked by foreign keys (audit items 5 and 21)

Investigated 2026-11-13 against `main` at `2b769d6`. Read-only; nothing was run against production or
ChoreQuest, and no tests were run.

## 1. Task

Original task text, verbatim:

> items 5 and 21 from today's audit

The two items, as recorded in the audit notes (item 5 from the 2026-10-30 audit, item 21 from the
2026-11-13 audit of the Supabase project shared with ChoreQuest):

- **Item 5 (blocking).** Account deletion fails for anyone who has messaged a seller: FK
  `messages_sender_id_fkey`. Tested for messages only; `transactions` and `transaction_checklists`
  have similar non-cascading keys (read, not tested). The `server/api/account/delete.post.ts` comment
  wrongly assumes cascades, and the privacy page promises deletion. Also: an auth deletion failure is
  swallowed, Cloudinary photos remain, and `deleteThread` in `inbox/index.vue` removes the thread for
  both parties.
- **Item 21 (blocking, reproduced in PGlite).** Item 5's FK error also blocks any auth-user delete, so
  ChoreQuest `DELETE /kids/:id` fails for anyone who has sent a Frula message.

**Restatement.** Some foreign keys that point at `public.profiles(id)` have no `ON DELETE` action.
When the referenced profile is deleted, Postgres refuses the delete. That happens when Frula's delete
route deletes the profile, and when anyone deletes an `auth.users` row, because the profile cascades
from it. Give every one of those keys a deliberate delete action in a new migration, so that deleting
a user always succeeds. Then make the Frula delete route report failures honestly.

**Definition of done.**

- In the repo's SQL (proved in the PGlite DB tests), deleting a profile or an `auth.users` row
  succeeds for a user who has sent and received messages, made and received offers, been buyer and
  seller on a transaction, owns a transaction checklist, and has a listing plan.
- Every other user's data ends in the state chosen in Open question 1, and the tests assert that
  state.
- `POST /api/account/delete` no longer swallows an auth-deletion failure, and its comment is
  accurate.
- The migration has been run on production (Missa runs it), and a query of `pg_constraint` shows the
  new delete actions there.

**Ambiguity in the task.**

- Item 5 bundles four sub-problems: the FKs, the swallowed auth error, Cloudinary photos left behind,
  and `deleteThread` deleting for both parties. Only the first two are on the deletion path that
  fails. Section 10 recommends splitting out the other two.
- Item 21's wording ("anyone who has sent a Frula message") is narrower than the real cause. Any
  NO ACTION reference blocks the delete, and receiving a message, being on a transaction, or owning
  a checklist or listing plan blocks it too.
- What happens to the *other* party's copy of shared records (a thread, a transaction) is a product
  and privacy decision. It is not settled anywhere in the repo (Open question 1).

## 2. Where it lives

| File | Role |
| --- | --- |
| `supabase/schema.sql` | Creates every table and the FKs at issue; `profiles.id` cascades from `auth.users` |
| `supabase/migrations/20260421_cascade_fixes.sql` | Precedent: an earlier migration that redefined FKs (the `listing_id` keys) |
| `supabase/listing_views.sql`, `supabase/notifications.sql` | Precedent for `SET NULL` and `CASCADE` on profile references |
| `supabase/MIGRATION_CHECKLIST.md` | The ordered list Missa follows to run SQL on production |
| `apps/web/server/api/account/delete.post.ts` | Frula's delete route: deletes the profile, then the auth user |
| `apps/web/app/pages/account.vue` | The "Delete account" button that calls the route |
| `apps/web/app/pages/privacy.vue` | Promises what deletion removes |
| `chore-app/backend/src/kids/kids.service.ts` (sibling repo) | ChoreQuest's kid delete, which calls `auth.admin.deleteUser` |
| `tests/db/support/*`, `tests/db/*.test.ts` | PGlite harness that applies the repo's real SQL; where the FK tests go |
| `tests/routes/support/fake-services.ts`, `tests/routes/*.test.ts` | Route-test harness with a fake Supabase and Resend |

## 3. How it works today

**In short.** `profiles` cascades from `auth.users`. Most tables cascade from `profiles` or from
`listings`, but six columns reference `profiles(id)` with no `ON DELETE` clause, which means
`NO ACTION`. If any row still points at the profile when the delete statement ends, the whole delete
is refused. That one rule produces both items: Frula's route fails at the profile delete (item 5),
and ChoreQuest's auth-user delete fails at the cascaded profile delete (item 21).

**The delete chain.**

- `supabase/schema.sql:13`: `profiles.id` is `REFERENCES auth.users(id) ON DELETE CASCADE`, so
  deleting an auth user deletes the profile in the same statement.
- References to `profiles(id)` with **no delete action** (all from `grep -n -i references` over
  `supabase/`; nothing later alters them):
  - `supabase/schema.sql:217` `messages.sender_id` (NOT NULL)
  - `supabase/schema.sql:218` `messages.recipient_id` (NOT NULL)
  - `supabase/schema.sql:243` `transactions.seller_id` (NOT NULL)
  - `supabase/schema.sql:244` `transactions.buyer_id` (nullable)
  - `supabase/schema.sql:290` `transaction_checklists.user_id` (NOT NULL)
  - `supabase/schema.sql:303` `listing_plans.user_id` (NOT NULL)
- References that already handle deletion: `listings.user_id` CASCADE (`schema.sql:42`),
  `saved_listings.user_id` CASCADE (`:231`), `search_alerts.user_id` CASCADE (`:316`),
  `notifications.user_id` CASCADE (`notifications.sql:12`), `listing_views.viewer_id` SET NULL
  (`listing_views.sql:14`), `checklist_progress.user_id` CASCADE to `auth.users`
  (`checklist_progress.sql:15`).
- Listing-scoped children cascade from `listings`: `messages.listing_id` (`schema.sql:216`),
  `transactions.listing_id` and `listing_plans.listing_id` (redefined as CASCADE in
  `migrations/20260421_cascade_fixes.sql:5-14`), and `transaction_checklists.transaction_id`
  (`schema.sql:289`).

**Who is blocked, and who isn't.** `NO ACTION` is checked at the end of the statement, after all
cascades have run (Postgres semantics; inferred from documented behavior, not tested here). A seller
whose only messages and transactions are on their *own* listings can therefore be deleted, because
the listing cascade removes those rows first. A user is blocked when a row that survives the cascade
still points at them:

- they messaged, or were messaged about, someone else's listing (`sender_id` or `recipient_id`);
- they are the buyer on a transaction for someone else's listing (`buyer_id`), or own that buyer's
  checklist (`transaction_checklists.user_id`);
- they are named `seller_id` on a transaction for a listing they don't own, which is possible today
  through item 4 (fabricated transactions);
- they hold a `listing_plans` row on a listing they don't own (not created by app code today;
  inferred from a grep that found no `listing_plans` writes in `apps/web/app`).

**Frula's route** (`apps/web/server/api/account/delete.post.ts`):

- `:17-20` requires a session, and `:23-29` rate-limits to 3 calls an hour.
- `:1-11` and `:33-36`: the comments claim the profile delete "cascades to ... messages ...
  transactions". That is false for the six columns listed above.
- `:37` deletes the profile with the service role. For a blocked user this returns the FK error, and
  `:39-46` turns it into a 500 ("Failed to delete account data. Please try again."). Nothing is
  deleted, so retrying never helps.
- `:49` calls `admin.auth.admin.deleteUser(user.id)`. In the installed `@supabase/auth-js` 2.103.3
  this is `DELETE {auth url}/admin/users/{id}` (`node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js:716-725`).
- `:51-57`: if that fails, the error is logged and the route still returns `{ deleted: true }`
  (`:59`). The user is told they're deleted while their auth account still exists and can sign in.
- `apps/web/app/pages/account.vue:486-489`: the client signs out and redirects home on success, and
  shows `err.data?.message` on failure (`:491-492`).

**What the privacy page promises.** `apps/web/app/pages/privacy.vue:124-127`: "Deleting your account
removes your profile, listings, saved homes, and message history. Some records may be retained for
legal or anti-abuse reasons (e.g. messages reported as harassment)." Line 27 says "you delete your
account, we delete your data."

**ChoreQuest's path (item 21).** `chore-app/backend/src/kids/kids.service.ts:224` calls
`service.auth.admin.deleteUser(kidId)`, and `:225` turns any error into a `BadRequestException` that
carries the database message. Deleting the auth user cascades to the Frula profile (`schema.sql:13`),
so the same NO ACTION references refuse it. `handle_new_user` (`schema.sql:24-35`) gives every
ChoreQuest user, kids included, a Frula profile. A kid who signed in to Frula and messaged a seller
can't then be removed in ChoreQuest. `kids.service.ts:90` (rollback of a failed kid create) and
`chore-app/backend/test/e2e-harness.ts:157` (test cleanup) use the same call; they're only affected
if that user has Frula rows.

## 4. What needs to change

1. **New migration** `supabase/migrations/<date>_profile_delete_actions.sql`. In one transaction,
   drop and re-add each of the six constraints with an explicit delete action, as
   `20260421_cascade_fixes.sql` does. The recommended actions (Open question 1 decides the first two):
   - `messages_sender_id_fkey`, `messages_recipient_id_fkey` → `ON DELETE CASCADE`. This is what the
     privacy page promises (`privacy.vue:125-126`), and it matches what already happens to every
     message on a deleted seller's own listings through `messages.listing_id`.
   - `transactions_buyer_id_fkey` → `ON DELETE SET NULL`. The column is already nullable
     (`schema.sql:244`), and the seller keeps their transaction and checklist. The pages already
     tolerate a null buyer (`transaction/[id].vue:197` filters it out; `transactions.vue:125` falls
     back to "buyer" only when `seller_id` is not the caller).
   - `transactions_seller_id_fkey` → `ON DELETE CASCADE`. A real seller's transactions already go
     with their listing, so this only changes the fabricated case from item 4.
   - `transaction_checklists_user_id_fkey` → `ON DELETE CASCADE`. It is that user's own checklist.
   - `listing_plans_user_id_fkey` → `ON DELETE CASCADE`. Stripe isn't connected yet, so there are no
     payment records to keep (see Open question 2).
   - **Check production's constraint names first.** The names above are Postgres defaults, and the
     audit reproduced `messages_sender_id_fkey`. Use `DROP CONSTRAINT IF EXISTS` as the precedent
     does, but a misnamed drop would leave the old key in place next to the new one. Before running,
     confirm the names with
     `select conname, conrelid::regclass, confdeltype from pg_constraint where confrelid = 'public.profiles'::regclass;`
     (`confdeltype`: `a` = no action, `c` = cascade, `n` = set null).
2. **`supabase/MIGRATION_CHECKLIST.md`.** Add the migration as a new numbered step after step 23.
   Include the `pg_constraint` query to run before and after, with the expected `confdeltype` values.
3. **`tests/db/support/schema-files.ts:7-32`.** Append the migration to `APPLIED_FILES` so the PGlite
   harness applies it.
4. **New `tests/db/account-deletion.test.ts`.** Seed a user who has every kind of reference
   (`seedPeople` and the fixtures in `tests/db/support/fixtures.ts` already provide `SELLER`,
   `BUYER`, `STRANGER` and listings). Assert, as `service_role`:
   - deleting their `auth.users` row succeeds (item 21's path) and the profile is gone;
   - deleting only the profile succeeds (item 5's path);
   - each other table ends in the chosen state: their messages gone in both directions,
     `buyer_id` null on the seller's transaction, their checklist gone, the counterparty's own
     checklist and listing still present;
   - a control: run the same delete against the schema *without* the new migration and expect the FK
     error. This shows the test can fail, so a pass means something.
5. **`apps/web/server/api/account/delete.post.ts`.**
   - Rewrite the header (`:1-11`) and cascade comment (`:33-36`) so they describe the real chain.
   - At `:51-57`, return an error instead of `{ deleted: true }` when `deleteUser` fails, so the user
     is not told they're gone while they can still sign in. A retry still works: the profile delete
     at `:37` matches 0 rows and succeeds, and `deleteUser` runs again.
   - Do **not** change which auth call is made here; that's item 20 (Out of scope).
6. **Route test `tests/routes/account-delete.test.ts`** (new), plus additions to
   `tests/routes/support/fake-services.ts`. The fake handles only GET table reads and a few POSTs
   (`fake-services.ts:113-164`), so it needs a `DELETE /rest/v1/profiles` handler and a
   `DELETE /auth/v1/admin/users/{id}` handler that can be told to fail. Cases: success returns
   `{ deleted: true }`; a profile-delete error returns 500; an auth-delete error now returns an error,
   not success. Logged-out calls return 500 rather than 401 because of item 19
   (`serverSupabaseUser` throws first). Don't assert on that in this change; at most, pin the current
   500 the way `tests/routes/notifications-send.test.ts` does.

## 5. Patterns to follow

- **FK redefinition:** `supabase/migrations/20260421_cascade_fixes.sql:5-14`. It uses
  `ALTER TABLE ... DROP CONSTRAINT IF EXISTS ..., ADD CONSTRAINT ... FOREIGN KEY ... ON DELETE ...`
  as one statement per table.
- **Transactional migrations with a header explaining why:** the 2026-10-30 migrations, for example
  `supabase/migrations/20261030_profiles_names_and_rows.sql`, which ends in `COMMIT;` (`:41`).
- **Checklist entries with a warning and verification SQL:** `supabase/MIGRATION_CHECKLIST.md:97-123`
  (step 23).
- **DB tests on the real SQL:** `tests/db/messages-integrity.test.ts` (`createTestDatabase`, `as`,
  fixtures, and named constants for IDs).
- **Route tests against the fake services:** `tests/routes/notifications-send.test.ts`, which also
  pins the item 19 status.

## 6. Reuse options

No new capability; nothing to reuse. The fix changes FK delete actions, which Postgres already
provides, plus error handling in an existing route. Channels checked: the repo (precedent migration,
existing test harnesses) and the installed `@supabase/auth-js` for `deleteUser` behavior. No package
or open-source search was needed.

## 7. Risks and blast radius

- **Shared database.** These keys sit on the `auth.users` → `profiles` cascade, so the migration also
  changes what a ChoreQuest user delete removes from Frula. The change is a widening: deletes that
  failed now succeed. Nothing that succeeds today will start failing.
- **Data loss is the point, and it's irreversible.** With CASCADE on messages, deleting a buyer also
  removes their offers from the seller's inbox. The seller loses the record of an accepted offer.
  Offers are "expressions of interest, not binding" (CLAUDE.md, Legal Notes), so this is consistent,
  but it's Missa's call (Open question 1).
- **Item 20 gets easier to trigger.** Once deletion works, Frula account deletion actually reaches
  `auth.admin.deleteUser`. Because `chore.users` cascades from `auth.users`, it then also erases that
  person's ChoreQuest account. Today the FK error stops many users *before* that line (`:37` fails
  first). Fixing item 5 alone therefore *increases* how often item 20 happens. See Open question 3.
- **Constraint names on production** may differ from the defaults (section 4, step 1).
- **Lock time.** Re-adding an FK validates every existing row, which takes a lock on the table. The
  tables are small today (inferred: early-stage product), so this should be brief. `NOT VALID` plus
  `VALIDATE CONSTRAINT` isn't worth it at this size.
- **Realtime.** Rows removed by a cascade emit DELETE events on `messages` (Realtime is enabled for
  messages per CLAUDE.md). How an open inbox reacts to a vanished thread was not checked.
- **Other callers of the route:** only `account.vue:486`.

## 8. Verified vs. inferred

**Verified by reading code:**

- Every FK definition and its delete action (`grep -n -i references` over `supabase/`). Nothing after
  `schema.sql` changes the six keys.
- The route's flow, its false comments, and the swallowed auth error (`delete.post.ts:1-59`).
- The client caller (`account.vue:480-494`) and the privacy-page wording (`privacy.vue:27`,
  `:124-127`).
- What `deleteUser` sends, in the installed auth-js (`GoTrueAdminApi.js:716-725`).
- ChoreQuest's kid delete and its error handling (`chore-app/backend/src/kids/kids.service.ts:224-225`).
- The test harnesses and what the fake services handle today.
- The tolerance for a null `buyer_id` in `transaction/[id].vue:197` and `transactions.vue:125`.

**Taken from the audit notes, not re-run here:** that the FK error reproduces in PGlite for messages
(item 5) and through an auth-user delete (item 21). The test in section 4, step 4 will reproduce it
again as its control.

**Inferred, not confirmed:**

- Production constraint names and current delete actions. Production wasn't queried; run the
  `pg_constraint` query in section 4.
- That `NO ACTION` lets a seller with only own-listing rows delete successfully (end-of-statement
  check after cascades). The new test should cover this case explicitly.
- That no `chore` schema table references `public.profiles`. ChoreQuest's SQL wasn't read; only its
  `deleteUser` callers were grepped.
- That `listing_plans` has no rows on production. No app code writes it, but the data wasn't checked.
- How the inbox behaves when Realtime delivers cascade deletes.

## 9. Open questions

1. **What happens to the other party's copy of shared records when a user deletes their account?**
   *Recommendation: CASCADE messages in both directions, and SET NULL on `transactions.buyer_id`.*
   That keeps the privacy page's "removes ... message history" promise. It matches what already
   happens to every message on a deleted seller's listings, and it needs no "Deleted user" handling
   in the UI. The alternative is to make `sender_id`/`recipient_id` nullable and SET NULL. That keeps
   the counterparty's history, but `buildThreads` (`apps/web/app/composables/useMessages.ts:71`), the
   thread page and `send.post.ts` all assume both IDs exist. It would also need privacy-page changes,
   and that copy has no attorney review (memory: no attorney as of 2026-10-30).
2. **Should `listing_plans` rows survive the user?** *Recommendation: CASCADE now.* Stripe isn't
   connected, so there are no payment records. When Phase 2 adds payments, retention for tax purposes
   becomes a real question for that ticket.
3. **Order relative to item 20.** Fixing item 5 lets more Frula deletions reach `deleteUser`, which
   erases ChoreQuest accounts (section 7). *Recommendation: ship the migration first anyway.* It
   unblocks ChoreQuest kid deletes (item 21), which are broken today. Hold the route change, or ship
   it together with item 20's fix, so that Frula account deletion stops removing the shared auth
   user. If that's too slow, the route can ship now; a user deleting their Frula account is already
   asking for deletion, and the ChoreQuest overlap is limited to people who use both apps.

## 10. Pre-existing problems (own tickets)

- **Item 5 sub-points that aren't on the failing path:** Cloudinary photos are never deleted when an
  account or listing goes. `deleteThread` (`apps/web/app/pages/inbox/index.vue:255`) deletes the
  thread for both parties.
- **Item 20:** Frula `account/delete` deletes the shared auth user, which cascades to `chore.users`.
- **Item 19:** logged-out calls to `account/delete` get 500, not 401 (`serverSupabaseUser` throws).
- **Item 4:** fabricated transactions can name any user as `seller_id`. The CASCADE above limits the
  damage on delete but doesn't fix creation.
- **Item 22:** `handle_new_user` (`schema.sql:24-35`) gives every ChoreQuest user, kids included, a
  Frula profile, which is why item 21 can happen at all.
- **The route's rate limit** (`delete.post.ts:23`) uses the per-instance memory limiter from item 7.

## Recommendation

Phase it in two steps. First, ship the migration and its PGlite test on their own. That fixes item 21
for ChoreQuest immediately and makes item 5's delete succeed at the database. Run the `pg_constraint`
query on production before and after. Second, ship the route change (honest error, correct comments,
route test) together with item 20's decision, so Frula account deletion is fixed once rather than
half-fixed. Get answers to Open questions 1 and 3 before writing the migration.

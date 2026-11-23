# Investigation: Frula account delete erases the person's ChoreQuest account (audit item 20)

Investigated 2026-11-13 against `main` at `923f79f` (#16). Read-only; nothing was run against
production or ChoreQuest, and no tests were run.

## 1. Task

Original task text, verbatim:

> item 20

Item 20 as recorded in the 2026-11-13 audit (shared-database section):

> 20. Blocking, read only. Frula `account/delete` calls `auth.admin.deleteUser`; `chore.users`
> cascades from auth.users, so deleting a Frula account also erases that person's ChoreQuest
> account.

**Restatement.** Frula and ChoreQuest (the sibling `chore-app` repo) share one Supabase project and
one `auth.users` table. Frula's "Delete my account" removes the shared sign-in, and ChoreQuest's user
row cascades from it, so a person who uses both apps loses their ChoreQuest account (and, for a
parent, their place in the household) when they delete Frula. Deleting a Frula account should remove
only Frula's data.

**Definition of done.**

- Deleting a Frula account for a person who also has a ChoreQuest account (`chore.users` row) leaves
  their `auth.users` row and everything in the `chore` schema untouched, and removes all their Frula
  data.
- Deleting a Frula account for a Frula-only person still removes the `auth.users` row, as today.
- After a Frula delete that kept the sign-in, the person can still sign in to Frula and use it like a
  new user (no broken state from a missing profile).
- Proved in tests: the DB side in the PGlite harness, the route side in the route harness.
- Ships with Phase 2 of `plan-account-deletion.md` (Decision 3 there), which changes the same route's
  auth-failure handling.

**Ambiguity in the task.**

- "Erases the ChoreQuest account" was read from code, not reproduced on production. Whether any real
  person currently has both a ChoreQuest account and Frula data is unknown (see section 8 for a query).
- The reverse direction (ChoreQuest deleting an auth user wipes their Frula data) is item 21, already
  decided in `plan-account-deletion.md` Decision 1 and merged. Not in scope here.
- Whether a kept sign-in still honours the privacy page's "we delete your data" is a wording and legal
  question for Missa (Open question 3).

## 2. Where it lives

| File | Role |
| --- | --- |
| `apps/web/server/api/account/delete.post.ts` | Frula's delete route: deletes the profile, then the auth user |
| `apps/web/app/pages/account.vue` | Only caller of the route (`:486`), and the delete UI copy (`:290-305`) |
| `apps/web/app/pages/privacy.vue` | Deletion promises (`:27`, `:124-127`) |
| `supabase/schema.sql` | `profiles.id` cascades from `auth.users` (`:13`); every Frula table hangs off `profiles` |
| `supabase/migrations/20261030_profiles_names_and_rows.sql` | Current `handle_new_user` trigger (`:10-17`), profile grants (`:38-39`) |
| `supabase/migrations/20261113_profile_delete_actions.sql` | Item 21 fix: every key to `profiles` now has a delete action |
| `chore-app/supabase/migrations/0001_initial_schema.sql` (sibling repo) | `chore.users.id` cascades from `auth.users` (`:58`); households and the rest hang off it |
| `chore-app/backend/src/kids/kids.service.ts` (sibling repo) | ChoreQuest's only `deleteUser` callers (`:90`, `:224`) |
| `tests/db/support/database.ts` | PGlite harness; stands in `auth.users` (`:19-24`) |
| `tests/routes/support/fake-services.ts` | Fake Supabase/Resend/Census for route tests |
| `plan-account-deletion.md` | Phase 2 (honest delete route) waits on this item |

## 3. How it works today

**High level.** One person, one `auth.users` row, two apps' data hanging off it by `ON DELETE
CASCADE`. Frula's delete route removes that row. Postgres then removes everything that cascades from
it, in both apps.

**The route** (`apps/web/server/api/account/delete.post.ts`):

1. `:17-20` gets the signed-in user; `:23` rate-limits to 3 per hour.
2. `:31` builds a service-role client.
3. `:37` deletes `public.profiles` where `id = user.id`. Since `20261113_profile_delete_actions.sql`
   this cascades through all Frula data (listings and their children, messages both ways,
   transactions as seller, checklists, plans, saved listings, alerts, notifications; `buyer_id` and
   `listing_views.viewer_id` set null).
4. `:49` calls `admin.auth.admin.deleteUser(user.id)`. In the installed `@supabase/auth-js` 2.103.3
   this sends `DELETE {auth}/admin/users/{id}` with `should_soft_delete: false`
   (`node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js:716-725`), a hard delete of the
   `auth.users` row.
5. `:51-57` logs and ignores an auth failure; `:59` returns `{ deleted: true }` (that is Phase 2 of
   `plan-account-deletion.md`, not this item).

The route has no awareness of ChoreQuest. Its only history is the commit that created it
(`c6de5e4`), written when, per `chore-app/CLAUDE.md:69-72`, "Frula has no users" and sharing auth
was considered harmless.

**What the auth delete takes with it, in ChoreQuest.** `chore.users.id` is
`references auth.users (id) on delete cascade` (`chore-app/supabase/migrations/0001_initial_schema.sql:58`).
Everything else in `chore` references `chore.users` or `households`. So the person's ChoreQuest user
row and whatever cascades from it are removed (for a kid: their chores' assignment is set null via
`chores.assigned_kid_id ... on delete set null`, `0001_initial_schema.sql:88`, inferred to extend to
instances, ledger and quests; the full cascade map of the `chore` schema was not traced). The
household row itself survives, since it doesn't reference users.

**Who is affected.**

- Any ChoreQuest parent who also signs in to Frula.
- Any ChoreQuest user at all who clicks Frula's delete: per audit item 22, `handle_new_user`
  (`20261030_profiles_names_and_rows.sql:10-17`) gives every new `auth.users` row a Frula profile,
  including ChoreQuest kids (`<username>@choreq.local`, `chore-app/supabase/migrations/0005_kid_username.sql:4-7`),
  and those credentials sign in to Frula.

**Why item 21's fix made this more likely.** Before `20261113_profile_delete_actions.sql`, the
profile delete at `:37` failed for anyone who had sent or received a message, so they never reached
`:49`. Now it succeeds, so every delete reaches `deleteUser` (`plan-account-deletion.md`, Risk 1).

**What a signed-in user with no profile hits today** (relevant to any fix that keeps the sign-in but
removes the profile). Nothing recreates a profile after signup: the trigger is `AFTER INSERT ON
auth.users` only (`schema.sql:33-35`). Users can't insert profiles themselves (insert revoked,
`20261030_profiles_names_and_rows.sql:38-39`). Every user-owned table references `profiles(id)`
(`schema.sql:42, 217-218, 231, 243, 290, 303, 316`, `notifications.sql:12`), so listing creation
(`sell.vue:892`), saving (`useSaved.ts:78`), alerts (`dream-home.vue:756`), messages and offers
(`OfferModal.vue:313`, `ViewingModal.vue:214`, `inbox/[listingId]/[userId].vue:281+`) would all fail
with a foreign-key error. The welcome route returns `Profile not found` (`welcome.post.ts:53-55`).

## 4. What needs to change

Recommended shape (Open question 1 has the alternatives): one database function decides and does the
Frula side atomically; the route deletes the auth user only when the function says no other app uses
it.

1. **New migration `supabase/migrations/<date>_close_frula_account.sql`.** One transaction.
   - `public.close_frula_account(p_user uuid) RETURNS boolean`, `LANGUAGE plpgsql SECURITY DEFINER
     SET search_path = ''`, matching `handle_new_user`'s style.
     - Read `email` from `public.profiles` (or `auth.users`) for the re-insert.
     - `DELETE FROM public.profiles WHERE id = p_user` (cascades all Frula data, per the item 21
       migration).
     - If the person has another app's account, re-insert a blank profile
       `(id, email)` and return `false` ("keep the sign-in"). Otherwise return `true` ("safe to delete
       the sign-in").
     - The ChoreQuest check must not fail where the `chore` schema doesn't exist (the PGlite harness,
       a fresh project): guard with `to_regclass('chore.users') IS NOT NULL` and run the lookup with
       `EXECUTE ... USING`. PL/pgSQL resolves static table references at first execution, so a
       static `chore.users` would also work only where the schema exists (inferred from PL/pgSQL's
       plan-at-execute behavior; confirm in the test).
     - Re-inserting the blank profile returns the person to exactly the state every ChoreQuest-only
       user is in today (item 22), so Frula keeps working if they sign in again.
   - `REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated; GRANT EXECUTE ... TO service_role;`
     (precedent: `claim_message_notification` in `20261030_messages_recipient_rule.sql`).
2. **`apps/web/server/api/account/delete.post.ts`.** Replace the profile delete at `:37` with
   `admin.rpc('close_frula_account', { p_user: user.id })`. Keep the existing 500 on error. Call
   `deleteUser` at `:49` only when the result is `true`. Update the header comment (`:1-11`) to say
   the sign-in is shared with ChoreQuest and is only removed when no other app uses it. Coordinate with
   Phase 2 of `plan-account-deletion.md`, which rewrites the same comments and the `:51-57` error
   handling; doing both in one branch avoids two rewrites.
   Return something the page can use, for example `{ deleted: true, signInKept: boolean }`.
3. **`apps/web/app/pages/account.vue`.** After success it signs out and redirects (`:486-489`), which
   still fits. If Missa wants the person told their sign-in still works for ChoreQuest, show that
   (Open question 2). The copy at `:292-293` ("Permanently delete your account") may need a line for
   that case.
4. **`apps/web/app/pages/privacy.vue`** `:27` and `:124-127`: only if Missa decides the wording must
   mention a shared sign-in (Open question 3).
5. **`tests/db/support/schema-files.ts`.** Append the new migration to `APPLIED_FILES`.
6. **New `tests/db/close-frula-account.test.ts`** (PGlite), following
   `tests/db/account-deletion.test.ts`:
   - Frula-only user: returns `true`, profile and all Frula rows gone.
   - User with a stub `chore.users` row (the test creates `CREATE SCHEMA chore; CREATE TABLE
     chore.users (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE)`): returns
     `false`, Frula rows gone, a blank profile exists with the same id and email, `chore.users` row
     intact, `auth.users` row intact.
   - The re-created profile has no name, no `welcomed_at`, role `user`.
   - Database with no `chore` schema: works (the default harness).
   - `anon` and `authenticated` can't execute it; `service_role` can.
   - Control: a test that fails without the `chore` branch (for example run the Frula-only expectation
     against the ChoreQuest user) to show the check is what keeps the row.
7. **Route tests** (with Phase 2's new `tests/routes/account-delete.test.ts`):
   `fake-services.ts` needs a `POST /rest/v1/rpc/close_frula_account` handler that can return
   `true`, `false` or an error, and the `DELETE /auth/v1/admin/users/{id}` handler Phase 2 already
   plans. Cases: `true` → auth delete called; `false` → auth delete not called, success returned; RPC
   error → 500, no auth delete.
8. **`supabase/MIGRATION_CHECKLIST.md`.** New step 25 for the migration (seed steps become 26 and
   27), with a read-back: the function exists, `service_role` only.
9. **ChoreQuest side, optional and separate:** `chore-app/CLAUDE.md:71-72` says sharing auth "is fine
   since Frula has no users", which is no longer true. A doc note belongs in a ChoreQuest ticket.

## 5. Patterns to follow

- **Security-definer function called by the service role from a route:** `claim_message_notification`
  in `supabase/migrations/20261030_messages_recipient_rule.sql`, called from
  `apps/web/server/api/notifications/send.post.ts` via `admin.rpc(...)`; its fake handler in
  `tests/routes/support/fake-services.ts` (the claim RPC, toggled by `isClaimFailing`).
- **Function style:** `handle_new_user` in `20261030_profiles_names_and_rows.sql:10-17`
  (`SECURITY DEFINER SET search_path = ''`, `NULLIF(TRIM(...))`).
- **DB test layout:** `tests/db/account-deletion.test.ts` and `tests/db/support/database.ts`
  (`createTestDatabase`, `readAfterDelete`).
- **Route test layout:** `tests/routes/notifications-send.test.ts`.
- **Migration header and checklist step:** step 24 in `supabase/MIGRATION_CHECKLIST.md`.

## 6. Reuse options

The new capability is "know whether another app still uses this sign-in".

- **Repo:** nothing tracks app membership. `profiles` can't serve, since every auth user gets one
  (item 22). Neither app uses app metadata to mark membership: a grep for `app_metadata` and
  `app_meta_data` over `fsbo-platform/apps/web`, `fsbo-platform/supabase` and ChoreQuest's
  `backend/src`, `frontend/app` and `supabase` finds only a seed insert (`supabase/seed_listings.sql:45`).
- **Installed dependencies:** `@supabase/auth-js` 2.103.3 `deleteUser(id, shouldSoftDelete)`
  (`GoTrueAdminApi.js:716`). Soft delete keeps the `auth.users` row, so `chore.users` would not
  cascade, but (from Supabase docs as remembered, not checked against this version) a soft-deleted
  user can't sign in to either app. It doesn't solve the problem.
- **Supabase features:** `auth.users.raw_app_meta_data` could hold an `apps` list that each app adds
  itself to. That needs ChoreQuest changes and a backfill. A heavier, cleaner long-term option.
- **Packages / open source:** not searched; this is a two-app-specific rule, not a general library
  concern.

**Recommendation: build** the small SQL function. It's the only option that needs no ChoreQuest
change, is atomic, and is testable in the existing PGlite harness. Revisit `app_metadata` if a third
app ever joins the project.

## 7. Risks and blast radius

- **Coupling Frula to ChoreQuest's table name.** The function names `chore.users`. If ChoreQuest
  renames or moves it, the guard makes the check silently return "no other app" and Frula deletes
  the sign-in again. Limit: a comment in both repos, and a ChoreQuest ticket noting the dependency.
- **Kept sign-ins keep the email in `auth.users`.** For ChoreQuest users, Frula's delete no longer
  removes their email from the project. That's required for ChoreQuest to work, but it changes what
  "delete your account" means for them (Open question 3).
- **Re-created blank profile.** Same shape as every ChoreQuest user's profile today. It isn't visible
  to other users (the read policy at `20261030_profiles_names_and_rows.sql:23-34` needs an active
  listing, a message or a transaction). `welcomed_at` is null, so the welcome route
  (`welcome.post.ts`) would send a welcome email if they hit `/confirm` again (inferred; `/confirm`
  only runs after an email confirmation link).
- **Race.** A person joining ChoreQuest between the function and `deleteUser` would still be erased.
  The window is one request; accepted.
- **Phase 2 overlap.** Both changes edit `delete.post.ts`. Ship them in one branch.
- **Callers.** Only `account.vue:486` calls the route. ChoreQuest's `deleteUser` callers
  (`kids.service.ts:90`, `:224`) are unaffected.

## 8. Verified vs. inferred

**Verified by reading code:**

- The route's sequence and the hard `deleteUser` call (`delete.post.ts:37-59`,
  `GoTrueAdminApi.js:716-725`, auth-js 2.103.3).
- `chore.users` cascades from `auth.users` (`chore-app/supabase/migrations/0001_initial_schema.sql:58`).
- `handle_new_user` fires only on insert and creates `(id, email, full_name)`
  (`20261030_profiles_names_and_rows.sql:10-17`, `schema.sql:33-35`); users can't insert profiles
  (`:38-39`).
- Every Frula user-owned table references `profiles(id)` (grep of `supabase/`).
- The PGlite harness has no `chore` schema (`tests/db/support/database.ts:19-24`).
- ChoreQuest calls `deleteUser` only for kids (`kids.service.ts:90`, `:224`).

**Inferred, not confirmed:**

- That any real person currently has both a ChoreQuest account and Frula data. Production wasn't
  queried. Missa can check with:

  ```sql
  select count(*) as both_apps,
         count(*) filter (where exists (select 1 from public.listings l where l.user_id = c.id)
                            or exists (select 1 from public.messages m
                                       where m.sender_id = c.id or m.recipient_id = c.id)) as with_frula_activity
  from chore.users c;
  ```
- The full cascade map inside the `chore` schema (only `users`, `households` and `chores` were read).
- Soft-delete behavior (from memory of Supabase docs, not this version's docs).
- That the `chore` schema is exposed to PostgREST (stated in `chore-app/DEPLOY.md:10`); only matters
  if the route queried it directly, which the recommendation avoids.

## 9. Open questions

1. **How Frula decides another app uses the sign-in.** Options: (a) SQL function checks
   `chore.users` (recommended: no ChoreQuest change, atomic, testable); (b) the route queries
   `admin.schema('chore').from('users')` directly (same coupling, not atomic, harder to test); (c) an
   `apps` list in `app_metadata` maintained by both apps (cleanest, needs ChoreQuest work and a
   backfill); (d) Frula never deletes the auth user (leaves Frula-only users' email behind; not
   recommended). **Recommendation: (a).**
2. **What the person is told when the sign-in is kept.** Recommendation: a short line after deletion,
   "Your Frula data is deleted. Your sign-in stays because ChoreQuest uses it." Missa's call whether
   naming ChoreQuest on Frula is wanted.
3. **Privacy page wording.** `privacy.vue:27` says "we delete your data". With a kept sign-in, the
   email stays in the shared `auth.users`. No attorney exists to ask; this is Missa's decision.
   Recommendation: add one sentence that a sign-in shared with another app Missa runs is kept until
   deleted there.
4. **Ship together with `plan-account-deletion.md` Phase 2?** Recommendation: yes, one branch, as
   Decision 3 there intends; this item's plan becomes the base and Phase 2's route changes fold in.

## 10. Pre-existing problems

Each belongs in its own ticket:

- **`chore-app/CLAUDE.md:71-72`** says shared auth "is fine since Frula has no users". Out of date.
- **Item 22:** every ChoreQuest signup and kid gets a Frula profile and can sign in to Frula. This
  item's fix relies on that state being harmless; it doesn't fix it.
- **No ChoreQuest parent self-delete** was found (`deleteUser` only for kids). Not a Frula issue.
- **Item 19:** logged-out calls to the route get 500, not 401 (`serverSupabaseUser` throws).
- **Item 7:** the route's rate limit (`delete.post.ts:23`) is per-instance memory.

## Recommendation

Plan this together with Phase 2 of `plan-account-deletion.md` as one branch, in two steps: first
the `close_frula_account` migration with its PGlite tests (including a stub `chore.users`), then
the route change, which calls the function, deletes the sign-in only when it returns `true`, and
takes Phase 2's honest error handling, with route tests covering both. Before merging, have Missa
run the section 8 count on production so the real exposure is known, and settle Open questions 2
and 3, because they change user-facing copy.

# Plan: Frula account delete erases the person's ChoreQuest account (audit item 20)

Planned 2026-11-13 against `main` at `923f79f` (#16). Source: `investigation-shared-auth-delete.md`.
Folds in Phase 2 ("Honest delete route") of `plan-account-deletion.md`.

## 1. Task

Original task text, verbatim:

> item 20

Item 20 as recorded in the 2026-11-13 audit:

> 20. Blocking, read only. Frula `account/delete` calls `auth.admin.deleteUser`; `chore.users`
> cascades from auth.users, so deleting a Frula account also erases that person's ChoreQuest
> account.

Frula and ChoreQuest (sibling `chore-app` repo) share one Supabase project and one `auth.users`
table. `chore.users.id` cascades from `auth.users`, so Frula's hard `deleteUser` removes the
person's ChoreQuest account too.

**Definition of done.**

- Deleting a Frula account for a person who also has a `chore.users` row leaves their `auth.users`
  row and everything in the `chore` schema untouched, and removes all their Frula data.
- Deleting a Frula account for a Frula-only person still removes the `auth.users` row.
- After a delete that kept the sign-in, the person can sign in to Frula again and use it like a new
  user (a blank profile exists, so nothing fails on a foreign key).
- The person whose sign-in was kept is told so, naming ChoreQuest.
- The privacy page says a sign-in shared with ChoreQuest is kept.
- From `plan-account-deletion.md` Phase 2: the route no longer reports success when the auth delete
  fails, and its comments describe the real delete chain.
- Proved in tests: the DB side in the PGlite harness, the route side in the route harness.
- The migration has been run on production (Missa runs it) and read back.

## 2. Source

`investigation-shared-auth-delete.md`, written against `923f79f`, which is still `main`.

**Spot-check confirmed:**

- `apps/web/server/api/account/delete.post.ts`: header `:1-11`, cascade comment `:33-36`, profile
  delete `:37`, 500 `:39-46`, `deleteUser` `:49`, swallowed auth error `:51-57`, `{ deleted: true }`
  `:59`.
- `apps/web/app/pages/account.vue`: delete UI `:288-305` (copy at `:292-293`), `deleteAccount`
  `:480-494`, error read from `err.data?.message` at `:490-491`. No route middleware on the page
  (only `definePageMeta({ layout: false })` at `:343`).
- `apps/web/app/pages/privacy.vue`: "we delete your data" at `:26-27`; "Your rights" paragraph at
  `:123-128`.
- `supabase/migrations/20261030_profiles_names_and_rows.sql`: `handle_new_user` `:10-17`
  (`SECURITY DEFINER SET search_path = ''`), profile write revoke `:38-39`.
- `supabase/migrations/20261030_messages_recipient_rule.sql:49-50`: the
  `REVOKE ... FROM PUBLIC, anon, authenticated; GRANT ... TO service_role` precedent for
  `claim_message_notification`.
- `tests/db/support/schema-files.ts:7-33`: `APPLIED_FILES` ends with
  `migrations/20261113_profile_delete_actions.sql`.
- `tests/db/support/database.ts`: `auth.users` stand-in at `:20` (no `chore` schema);
  `createTestDatabase({ without })` at `:43-52`; `readAfterDelete` at `:84-86`.
- `tests/routes/support/fake-services.ts`: toggles `:104-105`, claim RPC handler `:136-142`, 404
  fall-through `:170`, controls returned `:181-199`. No delete handlers yet.
- `supabase/MIGRATION_CHECKLIST.md`: step 24 "Account deletion" section at `:125-156`; seed steps
  25 and 26 at `:157-162`. The new step is **25**; seeds become 26 and 27 (matches the
  investigation).

**Drift:** none that matters. One detail to note: `plan-account-deletion.md` Phase 2 planned a
`DELETE /rest/v1/profiles` fake handler; the route will call the RPC instead, so that handler is not
needed.

## 3. Decisions and assumptions

Missa's answers to the investigation's open questions (all took the recommendation):

1. **Detection:** a SQL function, `public.close_frula_account(p_user uuid) RETURNS boolean`, checks
   `chore.users`. No ChoreQuest change.
2. **Notice:** after a kept-sign-in delete, show "Your Frula data is deleted. Your sign-in stays
   because ChoreQuest uses it."
3. **Privacy page:** add one sentence saying a sign-in shared with ChoreQuest is kept.
4. **Bundling:** item 20's route change and `plan-account-deletion.md` Phase 2 ship in one branch.

**Reuse decision: build.** The investigation's Reuse options found nothing in the repo that tracks
app membership, `deleteUser`'s soft delete would block sign-in to both apps, and `app_metadata`
needs ChoreQuest work. A small SQL function, no new dependency.

**Assumptions:**

- The re-created profile is `(id, email)` only, with the email from `auth.users`: no `full_name`,
  `welcomed_at` null, default role. This is stricter than `handle_new_user`, which copies
  `full_name` from metadata; a person who asked to delete their Frula data shouldn't get their name
  back on Frula.
- `privacy.vue:26-27` ("we delete your data") stays; the sentence goes in "Your rights" at
  `:123-128`. Wording is a draft for Missa (no attorney, per memory).
- The ChoreQuest check uses `to_regclass('chore.users') IS NOT NULL` plus `EXECUTE ... USING`, so it
  works where `chore` doesn't exist (PGlite, a fresh project).
- Merging to `main` deploys the web app. So Phase 2 must not merge until Missa has run Phase 1's
  migration on production (see Risk 1).

## 4. Phase overview

1. **`close_frula_account` function** — migration, checklist step 25, PGlite tests. Depends on
   nothing. Unused by the app until Phase 2.
2. **Delete route keeps shared sign-ins, and reports failures honestly** — route calls the
   function, deletes the auth user only on `true`, errors on auth failure; account page notice;
   privacy sentence; route tests. Depends on Phase 1 being merged **and run on production**.

Two phases because the function must exist in production before the route calls it. Not more: the
route, its page and its tests are one reviewable unit, and Decision 4 keeps the honest-error change
with it.

## 5. Phases

### Phase 1: `close_frula_account` function

**Goal.** Put the decision "delete Frula data, and say whether the sign-in can go" in one atomic
database function, proved in PGlite. Stands alone because nothing calls it yet.

**Changes.**

- **Create `supabase/migrations/<merge date>_close_frula_account.sql`** (for example
  `20261114_close_frula_account.sql`). Header comment: Frula and ChoreQuest share `auth.users`;
  `chore.users` cascades from it (`chore-app/supabase/migrations/0001_initial_schema.sql:58`);
  audit item 20; the function's contract. Wrap in `BEGIN;` ... `COMMIT;`.
  - `CREATE OR REPLACE FUNCTION public.close_frula_account(p_user uuid) RETURNS boolean`,
    `LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''`. Body:
    1. Read `email` from `auth.users` where `id = p_user` into a variable.
    2. `DELETE FROM public.profiles WHERE id = p_user;` (cascades all Frula data via
       `20261113_profile_delete_actions.sql`).
    3. If `to_regclass('chore.users') IS NOT NULL`, run
       `EXECUTE 'SELECT EXISTS (SELECT 1 FROM chore.users WHERE id = $1)' INTO v_has_chore USING p_user;`.
    4. If `v_has_chore`: `INSERT INTO public.profiles (id, email) VALUES (p_user, v_email);` and
       `RETURN false` (keep the sign-in). Otherwise `RETURN true` (safe to delete it).
    - Comment in the body naming `chore.users` as a cross-app dependency: if ChoreQuest renames it,
      the guard returns `true` and Frula deletes the sign-in again.
  - `REVOKE EXECUTE ON FUNCTION public.close_frula_account(uuid) FROM PUBLIC, anon, authenticated;`
    `GRANT EXECUTE ON FUNCTION public.close_frula_account(uuid) TO service_role;` (precedent
    `20261030_messages_recipient_rule.sql:49-50`).
- **`tests/db/support/schema-files.ts`.** Append the new file to `APPLIED_FILES` after `:32`.
- **`supabase/MIGRATION_CHECKLIST.md`.** Under the "Account deletion" section (`:125`), add step
  **25** after step 24, in step 24's format: what it does; that it is required before deploying
  Phase 2 (the route calls it); SQL block that (1) runs the migration, (2) reads back:

  ```sql
  select has_function_privilege('anon', 'public.close_frula_account(uuid)', 'execute') as anon,
         has_function_privilege('authenticated', 'public.close_frula_account(uuid)', 'execute') as authed,
         has_function_privilege('service_role', 'public.close_frula_account(uuid)', 'execute') as service;
  -- expect false, false, true
  ```

  and (3) the exposure count from the investigation, for the record:

  ```sql
  select count(*) as both_apps,
         count(*) filter (where exists (select 1 from public.listings l where l.user_id = c.id)
                            or exists (select 1 from public.messages m
                                       where m.sender_id = c.id or m.recipient_id = c.id)) as with_frula_activity
  from chore.users c;
  ```

  Renumber the seed steps (`:159`, `:162`) from 25 and 26 to 26 and 27.
- **Create `tests/db/close-frula-account.test.ts`**, following `tests/db/account-deletion.test.ts`
  (fixtures, `createTestDatabase`, `readAfterDelete` or a sibling helper that calls the function and
  reads back in one rolled-back transaction as the owner). For the ChoreQuest cases, create a stub in
  the test: `CREATE SCHEMA chore; CREATE TABLE chore.users (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE);`
  and insert a row for the user. Tests:
  - `returns true and removes all Frula data for a Frula-only user` (profile, listing, messages,
    saved listing gone; `auth.users` row still there, since the function doesn't touch it).
  - `returns false for a ChoreQuest user and keeps their chore and auth rows`.
  - `removes the ChoreQuest user's Frula data` (listing, messages both ways gone).
  - `recreates a blank profile with the same id and email` (no `full_name`, `welcomed_at` null,
    role `user`).
  - `works when the chore schema does not exist` (the default harness).
  - `works when called again after the profile is already gone` (retry path for Phase 2: returns
    `true` for Frula-only, `false` and one profile for ChoreQuest).
  - `only service_role can execute it` (`anon` and `authenticated` refused via `as()`;
    `service_role` allowed).
  - Control: `deleting the auth user still erases the chore row` — delete the ChoreQuest user's
    `auth.users` row directly and see the stub `chore.users` row gone, proving the stub reproduces
    the cascade the function is avoiding.

**Tests.** The new file above; every existing suite must stay green (`setup.test.ts` checks that
every applied file runs).

**Verification.**

- `npm test` at the repo root; all green, including the new file.
- Sanity-check the checker: temporarily remove the `chore` branch from the function (always
  `RETURN true`, no re-insert) and confirm the "returns false" and "recreates a blank profile" tests
  fail; revert.
- Hand check (Missa, production, checklist step 25): run the migration and the read-back; expect
  `false, false, true`. Record the exposure count.

**Safe to merge because.** Nothing in the app calls the function, and the migration only takes
effect when Missa runs it. Creating a service-role-only function changes no existing behavior.

**Suggested branch and PR title.** `fix/close-frula-account-function` — "Add a database function
that closes a Frula account without touching ChoreQuest".

### Phase 2: Delete route keeps shared sign-ins and reports failures honestly

**Goal.** The route deletes Frula data through the function and deletes the sign-in only when no
other app uses it; an auth-delete failure becomes an error instead of a false success
(`plan-account-deletion.md` Phase 2). The page tells a ChoreQuest user their sign-in stays. Ships
only after Phase 1's migration runs on production.

**Changes.**

- **`apps/web/server/api/account/delete.post.ts`.**
  - Rewrite the header `:1-11`: Frula data goes through `public.close_frula_account`; the sign-in
    is shared with ChoreQuest and is removed only when the function returns `true`. Name both
    migration files exactly (`20261113_profile_delete_actions.sql` for the cascade chain, the new
    one for the function).
  - Replace `:33-46` with `admin.rpc('close_frula_account', { p_user: user.id })`. On error, keep
    the server log and the existing 500 ("Failed to delete account data. Please try again.").
    Replace the cascade comment with the real chain: listings and their children, messages in both
    directions, saved listings, alerts, notifications, their checklists and listing plans;
    `listing_views.viewer_id` and `transactions.buyer_id` set to null.
  - If the result is `false`, return `{ deleted: true, signInKept: true }` without calling
    `deleteUser`.
  - Otherwise call `deleteUser` (`:49`). Replace `:51-57`: keep the log and throw a 500 with
    "Your data was deleted, but we couldn't close your sign-in. Please try again." Comment that a
    retry works: the function finds no profile, returns `true`, and `deleteUser` runs again.
  - Return `{ deleted: true, signInKept: false }`.
  - Confirm the error text reaches `account.vue:491` (`err.data?.message`); if Nitro carries
    `statusMessage` elsewhere, set `message` or `data` on the error rather than changing the page.
- **`apps/web/app/pages/account.vue`.** In `deleteAccount` (`:480-494`), read `signInKept` from the
  response. If `false`, keep today's sign-out and redirect. If `true`, sign out and show, in place
  of the account content, "Your Frula data is deleted. Your sign-in stays because ChoreQuest uses
  it." with a link home (a `ref` such as `isSignInKept`). Check at implementation how the page
  renders when signed out and pick the smallest change that keeps the notice visible. Leave the
  pre-delete copy at `:292-293` alone.
- **`apps/web/app/pages/privacy.vue`.** Add to "Your rights" (`:124-127`) a draft sentence for
  Missa to approve, for example: "If you also use ChoreQuest, which shares Frula's sign-in, deleting
  your Frula account keeps your sign-in (email and password) so ChoreQuest keeps working; contact us
  to remove it." Don't promise ChoreQuest self-delete; none exists (investigation section 10).
- **`tests/routes/support/fake-services.ts`.**
  - `POST /rest/v1/rpc/close_frula_account` handler with a result toggle
    `'deleted' | 'kept' | 'error'` (returns `true`, `false`, or 500), default `'deleted'`.
  - `DELETE /auth/v1/admin/users/{id}` handler, with a failure toggle, default success. Check the
    path against `node_modules/@supabase/auth-js/dist/main/GoTrueAdminApi.js:716-725` when writing
    it.
  - Expose the toggles beside `failClaim` (`:191-193`), in the same style.
- **Create `tests/routes/account-delete.test.ts`**, following `tests/routes/notifications-send.test.ts`.
  Fresh user per test (rate limit 3/hour, `delete.post.ts:23`). Cases:
  - `closes the Frula account and deletes the sign-in for a Frula-only user` (RPC then auth delete,
    in order; `signInKept: false`).
  - `keeps the sign-in when ChoreQuest uses it` (RPC returns `false`; no auth delete call;
    `signInKept: true`).
  - `returns 500 and skips the auth delete when closing the account fails`.
  - `returns an error, not success, when the auth delete fails` (fails on today's code).
  - `a retry after a failed auth delete succeeds`.
  - Logged-out call: pin today's 500 with a comment pointing at item 19, as
    `notifications-send.test.ts` does; don't assert 401.

**Tests.** The new route test file; existing route and DB suites stay green.

**Verification.**

- Before writing the fix, run the new route tests against today's route and confirm the "keeps the
  sign-in" and "auth delete fails" tests fail. Then implement and confirm they pass.
- `npm test`; all green.
- Lint and typecheck the web app with the repo's existing scripts.
- Hand check, local or preview build against production data only with throwaway accounts:
  1. A throwaway Frula-only account: delete from `/account`; sign-out and redirect happen; the user
     is gone from Auth in the Supabase dashboard.
  2. A throwaway ChoreQuest kid or parent created in ChoreQuest: sign in to Frula, create a saved
     listing or message, delete from `/account`; the ChoreQuest notice shows; the Auth user and
     `chore.users` row remain; the person can still sign in to ChoreQuest and to Frula; Frula shows
     no old data.
  Don't break production auth to see the failure message; the route test covers it.

**Safe to merge because.** Phase 1's function is already on production (merge is gated on
checklist step 25). For Frula-only users the success path is unchanged; for ChoreQuest users the
only change is that the sign-in is kept. The auth-failure path moves from a false success to a
retryable error.

**Suggested branch and PR title.** `fix/account-delete-keeps-shared-sign-in` — "Keep a sign-in
ChoreQuest still uses, and report a failed sign-in deletion".

## 6. Risks

1. **Phase 2 deployed before the migration runs.** The RPC returns an error and every delete 500s
   (no data lost, but deletion is broken). Limit: checklist step 25 says it's required first, and
   the Phase 2 PR description should state "run step 25 before merging".
2. **Coupling to `chore.users`.** If ChoreQuest renames or moves it, the guard returns `true` and the
   bug returns silently. Limit: comment in the function; a ChoreQuest ticket noting the dependency
   (out of scope here).
3. **Kept sign-ins keep the email in `auth.users`.** Required for ChoreQuest; disclosed by the
   privacy sentence (Decision 3).
4. **Re-created blank profile.** Same shape as every ChoreQuest user's profile today (item 22), not
   visible to others under the read policy (`20261030_profiles_names_and_rows.sql:23-35`).
   `welcomed_at` is null, so a later `/confirm` could send a welcome email (inferred). Phase 1 tests
   pin the profile's shape.
5. **Race.** Someone joining ChoreQuest between the function and `deleteUser` is still erased. One
   request wide; accepted in the investigation.
6. **Notice after sign-out.** The page may render a signed-out state that hides the notice. Limit:
   hand check 2.

## 7. Out of scope

Each belongs in its own ticket:

- **Item 22:** `handle_new_user` gives every ChoreQuest user and kid a Frula profile and Frula
  sign-in. This fix relies on that state being harmless.
- **`chore-app/CLAUDE.md:71-72`** says shared auth is fine "since Frula has no users". Out of date;
  a ChoreQuest ticket, which should also record the `chore.users` dependency (Risk 2).
- **No ChoreQuest parent self-delete** (`deleteUser` only for kids, `kids.service.ts:90`, `:224`).
- **Item 19:** logged-out calls get 500, not 401.
- **Item 7:** the route's rate limit is per-instance memory.
- **Item 5 leftovers:** Cloudinary photos never deleted; `deleteThread`
  (`apps/web/app/pages/inbox/index.vue:255`) deletes for both parties.
- **`app_metadata` app membership:** revisit if a third app joins the project.
- **Updating `plan-account-deletion.md`'s Progress** to say Phase 2 shipped here — do it when
  Phase 2 merges.

## Recommendation

Start with Phase 1. It is self-contained, invisible to users, and its tests settle the one
uncertain technical point (the `to_regclass` guard and `EXECUTE` working with and without a `chore`
schema). After it merges, Missa runs checklist step 25 on production and records the exposure
count, then Phase 2 can merge.

## Progress

- **Phase 1: done, merged to `main` as `08cb4d2` (PR #17, 2026-11-13).** Branch `fix/close-frula-account-function` off `main` at
  `923f79f`. Added `supabase/migrations/20261114_close_frula_account.sql`, appended it to
  `APPLIED_FILES`, added checklist step 25 and renumbered the seed steps to 26 and 27, and added
  `tests/db/close-frula-account.test.ts` (11 tests). Deviations: the test file uses a local
  `closeThenRead` helper instead of `readAfterDelete`, to capture the function's return value; it
  adds a `leaves other users alone` test; the privilege test is three tests (anon, authenticated,
  service_role). Checklist step 25 run on production 2026-11-13: privileges `false, false, true`; 7 people use both apps, 2 of them with Frula listings or messages.
- **Phase 2: done, merged to `main` as `811d2fc` (PR #18, squash, 2026-11-13).** Hand checks 1 and 2
  were not run: Missa had no throwaway accounts and chose to merge, with anyone unable to delete their
  account emailing her. Local dev server with production's public Turnstile site key did pass the
  captcha on localhost; the preview build has no site key, so it can't sign in. Commits before squash:
  `3dacf51`, `d91313e`, `f561b8a`. Branch `fix/account-delete-keeps-shared-sign-in` off `main` at
  `08cb4d2`. The route calls `close_frula_account`, deletes the auth user only when it returns
  `true`, and returns `signInKept`; a failed auth delete is now a 500 ("Your data was deleted, but
  we couldn't close your sign-in. Please try again."). `account.vue` signs out and shows the
  ChoreQuest notice in place of the account content when `signInKept` is true. `privacy.vue` "Your
  rights" has the draft sentence. Fakes added for the RPC (`setCloseAccountResult`) and the admin
  user delete (`failAuthDelete`), plus `callOrder()` for the ordering check;
  `tests/routes/account-delete.test.ts` has 6 tests. Deviations: none in behavior. The route
  comment lists the cascade as the `20261113` migration defines it (it also removes transactions
  where the user is the seller). Hand checks 1 and 2 not yet run. Decision 3 reversed on
  2026-11-13: Missa chose no privacy-page sentence, so `privacy.vue` is unchanged from `main` (the
  sentence was removed after the PR opened). Also on 2026-11-13, at Missa's call, the route keeps the sign-in
  unless the function returns exactly `true` (`!== true` rather than the plan's `=== false`), with a
  7th route test for a null answer.

# Plan: public email and phone on `profiles` (audit item 1)

Written 2026-10-30 against `main` at a6d9dbe. Nothing here has been executed. All SQL is a draft.

## 1. Task

Original task: "item 1 in project_audit_2026_10_30_backlog.md". The item's text, verbatim:

> 1. Email and phone are public. `supabase/schema.sql:341` policy "Public profiles are viewable" is
>    `USING (true)`, and no file drops it; a logged-out visitor read both fields from every profile. RLS
>    filters rows, not columns, so `messages_rls.sql` would not fix it. Fix: move contact fields to a
>    private table or expose a safe view, then update `inbox/index.vue:201` and `transaction/[id].vue`,
>    which read email directly. Also reproduced: a user can set their own `role` to admin (`role` looks
>    unused by app code today).

Backlog rules that apply: re-verify against current code and confirm live database state before
starting; database changes go in a new migration; opening a PR or posting anywhere needs Missa's
separate confirmation for that step.

**Done means:**

- `anon` and `authenticated` cannot read `email`, `phone` or the other non-public columns of any
  profile through the Supabase API.
- A user cannot change `role` or any other `profiles` column.
- Inbox, transaction page, seller page and all server routes still work, and people see a name
  rather than "Unknown user".
- Proven by a check that fails before the SQL and passes after it, then by the same check against
  production.

## 2. Source

Investigation: `investigation-public-profile-pii.md`.

**Spot-check result: no drift.** `main` is still a6d9dbe. Re-read and confirmed:

- `supabase/schema.sql:12-21`, `:24-31`, `:341-342`
- `supabase/messages_rls.sql:30-39`
- `apps/web/app/pages/inbox/index.vue:72-73`, `:201`, `:261`
- `apps/web/app/pages/transaction/[id].vue:131`, `:156`, `:198-202`
- `apps/web/app/composables/useMessages.ts:58-62`
- `apps/web/app/pages/seller/[id].vue:39`, `:58-63`, `:94-98`
- `apps/web/app/pages/signup.vue:131`
- `apps/web/app/pages/privacy.vue:33-39`
- `apps/web/server/api/notifications/send.post.ts:94-104`, `:122`
- the full list of `.from('profiles')` callers, and no `GRANT`, `REVOKE` or view on `profiles`

**Added by this spot-check, not in the investigation:**

- No OAuth or magic-link sign-in exists and the signup name field is `required`
  (`signup.vue:24`), so the metadata backfill should reach nearly everyone. Fallback strings stay for
  the rest.
- No `listings`, `messages` or `transactions` policy references `profiles`, confirmed by searching
  every `.sql` file, so the new row policy cannot recurse.
- The row policy's subqueries run with the caller's privileges, so `anon` needs `SELECT` on
  `listings`, `messages` and `transactions` or every anon read of `profiles` errors. Added to step 0.
- `send.post.ts:28-32` types `email` as required on `ProfileRow`, so the sender read needs a narrower
  type once its select drops `email`.
- `schema.sql` has no index on `listings.user_id`. See Risks.

## 3. Decisions and assumptions

**Open questions, answered by Missa:**

1. Column privileges, not a private table or safe view.
2. Sellers with an active listing show their full name publicly, disclosed by one line each on the
   privacy page and signup. Counterparties see names in threads and transactions. Non-sellers are
   never listed publicly.
3. Past exposure: Missa checks Supabase API logs for bulk `profiles` reads. This is a manual step,
   not code, and was not assessed legally here. Correction, 2026-10-30: this said an attorney was
   already reviewing the policy. There is no attorney. Whether notice is needed is undecided.
4. The PGlite check stays throwaway, outside the repo. Committed tests belong to backlog item 13.

**Reuse decision:** adopt Postgres column privileges and the existing RLS pattern. Nothing is built
beyond one migration pair and small app edits. No new project dependency.

**Change from the investigation:** it recommended one PR with one migration. This plan uses two
phases, because a single migration forces one of two bad orders: app first gives "Unknown user" until
the SQL runs, and SQL first silently blanks names until the app deploys. Splitting also closes the
`role` hole and bulk listing of the whole table without touching the app. Backfilling and
restricting rows in the same transaction means names are never exposed under the open policy.

**Assumptions:** production matches the repo, which step 0 confirms before any change. Supabase's
default grants apply to `anon` and `authenticated`; this was inferred, and step 0 confirms it.

**Prerequisites, all manual, all Missa's:**

**A. Past exposure.** Do this first, because log retention runs out regardless of this work.

**B. Step 0, read-only, in the Supabase SQL Editor.** Paste the results into the Phase 1 PR notes.

```sql
select tablename, policyname, cmd, roles, qual from pg_policies
 where schemaname = 'public' and tablename = 'profiles';

select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'profiles'
   and grantee in ('anon', 'authenticated');

select prosrc from pg_proc where proname = 'handle_new_user';

select count(*) total, count(full_name) with_name, count(phone) with_phone
  from public.profiles;

select tablename from pg_publication_tables
 where pubname = 'supabase_realtime' and tablename = 'profiles';

select r.role, t.tbl, has_table_privilege(r.role, t.tbl, 'SELECT') can_select
  from (values ('anon'), ('authenticated')) r(role),
       (values ('public.listings'), ('public.messages'), ('public.transactions')) t(tbl);
```

Expected: the three policies this plan drops and no others, full grants, the two-column trigger,
`with_name` near zero, `with_phone` zero, no publication row, and every `can_select` true.

Stop and re-plan if `can_select` is false anywhere, if `profiles` is in the publication, or if
`with_phone` is above zero and those numbers came from real users. An unexpected extra policy is
added to the `DROP`s in Phase 1 rather than stopping.

## 4. Phase overview

1. **Fill in names, restrict rows, remove writes.** No app reads change. Depends on prerequisites A
   and B.
2. **Stop reading email, then lock the columns.** Depends on Phase 1 being merged and its SQL run.

## 5. Phases

### Phase 1: fill in names, restrict rows, remove writes

**Goal.** Close the `role` hole, stop bulk listing of non-sellers, and put real names in `profiles`,
while leaving every current query working. Stands alone because the table-level `SELECT` stays, so
the app's `email` reads still succeed.

After this phase, email stays readable for sellers with active listings and for counterparties, so
the leak is narrowed, not closed. Do not stop here.

**Changes.**

`supabase/migrations/20261030_profiles_names_and_rows.sql` (new, style of
`supabase/migrations/20260421_cascade_fixes.sql`):

```sql
-- Names were kept only in auth metadata, the open read policy exposed every
-- profile, and the update policy let users set their own role.
BEGIN;

UPDATE public.profiles p
   SET full_name = NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '')
  FROM auth.users u
 WHERE u.id = p.id AND p.full_name IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles visible to self, for sellers, and to counterparties"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.listings l
               WHERE l.user_id = profiles.id AND l.status = 'active')
    OR EXISTS (SELECT 1 FROM public.messages m
               WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
                  OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.transactions t
               WHERE (t.seller_id = profiles.id AND t.buyer_id = auth.uid())
                  OR (t.buyer_id = profiles.id AND t.seller_id = auth.uid()))
  );

-- Nothing in the app writes profiles as a user. Server routes use the service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles FROM anon, authenticated;

COMMIT;
```

- `supabase/messages_rls.sql`: delete lines 30-39. The checklist runs this file late, so otherwise a
  fresh setup brings back an open read policy. Line 32 is redundant with `schema.sql:327`.
- `supabase/MIGRATION_CHECKLIST.md`: add the migration as the last schema step, after
  `transactions_rls.sql`, and say it must run after the RLS patches. The checklist lists no migrations
  today, and `README.md:94` says "any order", which is wrong for this file. Backlog item 14 owns
  fixing the README.
- `apps/web/app/pages/privacy.vue`: after line 39's list item, add an item: "Your name appears on your
  public seller page while you have an active listing, and to people you message or transact with."
- `apps/web/app/pages/signup.vue`: under the Full name input (after line 28), add a hint in the page's
  existing small slate text style: "Shown on your seller page if you list a home, and to people you
  message."

**Tests.** Rebuild the PGlite harness in the session scratchpad, outside the repo. Stub `auth.users`
and `auth.uid()`, create `anon`, `authenticated` and `service_role` with Supabase-style table grants,
swap geography for text, and apply the repo's SQL in checklist order. Assertions:

- `UPDATE ... SET role = 'admin'` on your own row is denied.
- Updating your own `email` is denied.
- `anon` gets no row for a user with no active listing.
- `anon` reads `full_name` of a user with an active listing.
- A user with no shared thread or transaction gets no row for a non-seller.
- A buyer and seller who share a message each get the other's row.
- Parties to a transaction each get the other's row.
- A user always gets their own row.
- The service role can still read everything.
- A new `auth.users` row with `full_name` metadata gets a filled `profiles.full_name`.
- A new `auth.users` row with blank or missing metadata still signs up, with a null name.
- The backfill leaves an existing non-null `full_name` alone.

Run it before the migration and confirm the assertions that should fail do fail, so a clean result
means something. It proves what the repo's SQL does, not what production has.

**Verification.**

1. `npm run build` and `npm run format:check`. Lint and typecheck do not work today (backlog item
   13), so say so in the PR rather than implying they passed.
2. Merge, wait for the Cloudflare deploy so the disclosure is live, then run the migration in the SQL
   Editor straight away.
3. Re-run step 0's first four queries. Expect one SELECT policy, no UPDATE policy, only `SELECT`
   grants, a three-column trigger, and `with_name` near `total`.
4. Logged out with the anon key, `GET /rest/v1/profiles?select=id` returns only sellers.
5. With a test account's token, `PATCH` its own row to `role=admin` and expect a permission error.
6. Create a test account and confirm its name lands in `profiles`, since this trigger is on the
   signup path.
7. Click through inbox, a transaction and a seller page. The seller page should show a real name.

**Safe to merge because** the merge itself changes only copy and an unrun SQL file. The SQL is one
transaction and removes nothing the app uses: no user-session code writes `profiles`, and every
user-session read is of self, a seller, or a counterparty.

**Branch:** `fix/profiles-rows-and-names`

**PR title:** `Restrict profile rows and writes, and backfill names`

### Phase 2: stop reading email, then lock the columns

**Goal.** Finish the fix. The app stops selecting `email`, then column privileges make `email`, `phone`,
`role`, `welcomed_at` and `updated_at` unreachable for `anon` and `authenticated`. Stands alone because
the app edit is safe with or without the SQL, and the SQL runs only after the app is live.

**Changes.**

`supabase/migrations/20261030_profiles_column_privileges.sql` (new):

```sql
-- Row policies cannot hide columns. Table-level access must go first because a
-- column-level REVOKE does not affect a table-level grant.
BEGIN;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, created_at)
  ON public.profiles TO anon, authenticated;

COMMIT;
```

- `apps/web/app/pages/inbox/index.vue`: line 201 selects `id, full_name`. Remove the email fallback at
  line 73 and inside the string at line 261. 'Unknown user' and 'this user' stay.
- `apps/web/app/composables/useMessages.ts`: remove `email` from `other_user` (line 61).
- `apps/web/app/pages/transaction/[id].vue`: line 200 selects `id, full_name`; remove `email` from the
  type at line 131 and the fallback at line 156. 'Seller' and 'Buyer' stay.
- `apps/web/server/api/notifications/send.post.ts`: line 122 becomes
  `const senderName = sender?.full_name || 'A buyer'`, so part of a sender's address no longer reaches a
  stranger. Drop `email` from the sender select at line 102 and type that read
  `Pick<ProfileRow, 'id' | 'full_name'>`. The recipient select keeps `email`.
- `supabase/MIGRATION_CHECKLIST.md`: add this migration after the Phase 1 migration, and note that it
  must run last.

**Tests.** Extend the same harness. Run before this SQL and confirm these fail:

- `anon` selecting `email` or `phone` is denied.
- `authenticated` selecting another user's `email`, and their own, is denied.
- `role` and `welcomed_at` are denied for both.
- `select=*` is denied for both.
- `id, full_name, created_at` reads still work for both, which is what the seller page needs.
- The inbox and transaction queries, as edited, return rows.
- The service role still reads `email`, so notification, welcome, alert and delete routes keep working.

Re-run every Phase 1 assertion too.

**Verification.**

1. `npm run build` and `npm run format:check`, with the same note about lint and typecheck.
2. Search `apps/web/app` for `\.email` and for `profiles` reads, and confirm no client read of
   `profiles.email` remains. Session-based `user.email` is fine.
3. Merge and wait for the deploy. Confirm inbox and a transaction page still show names.
4. Run the migration in the SQL Editor.
5. Logged out with the anon key, `GET /rest/v1/profiles?select=email`, then `select=phone`, then
   `select=*`. Expect a permission error each time. First try the same request with `select=full_name`
   and expect success, so the failures are shown to come from the columns and not a bad key.
6. Repeat step 5 with a logged-in test token.
7. Re-run step 0's grants query. Expect column-level access only, nothing at table level.
8. Click through inbox, a transaction and a seller page, signed in and signed out. Send a test message
   and confirm the notification email arrives with the sender's name.
9. Mark item 1 closed in `project_audit_2026_10_30_backlog.md`, record the name-data finding and that
   items 3 and 4 are what fully seal the row policy, and change the file's `description` and its
   `MEMORY.md` line in the same edit, since both count open and blocking items.

**Safe to merge because** selecting fewer columns works under Phase 1's privileges, and the migration
file does nothing until it is run by hand. Browser tabs left open across the SQL step keep the old
bundle, so their name read fails quietly until a refresh, which is cosmetic.

**Branch:** `fix/profiles-column-privileges`

**PR title:** `Stop reading profile email and lock contact columns`

Branch from `main` after Phase 1 merges. This is not a stacked PR, so no base retargeting is needed.

## 6. Risks

- **Partial exposure between phases.** After Phase 1, active sellers' and counterparties' emails stay
  readable. Limit this by doing Phase 2 in the same or next sitting.
- **Row policy is bypassable until items 3 and 4 close.** Any user can message anyone or fabricate a
  transaction, creating a "counterparty" and revealing that person's full name given their UUID. Only
  the name is exposed. After Phase 2, email stays protected regardless, because column privileges do
  not depend on rows.
- **Real names go public, which is deliberate but not reversible for anyone who sees them.** Phase 1
  deploys the disclosure before the SQL runs. Sellers already signed up did not see the new line.
- **`full_name` is user-controlled.** Anyone can set metadata to any string at signup. Vue escapes it
  on pages, and `send.post.ts` escapes it in emails (backlog item 16 covers its double-escaping). It
  previously never reached a public page, so nothing new is trusted, but it can hold offensive text
  until moderation exists (backlog item 12).
- **Signup path.** A bug in `handle_new_user` blocks all signups. `search_path = ''` is safe only
  because the function fully qualifies `public.profiles`. Phase 1 tests this in the harness and on
  production with a test account.
- **Policy cost.** Three subqueries per row, and `listings.user_id` has no index in `schema.sql`. Reads
  are by id, so this should be negligible at current size, but it is untested on real data. If a page
  slows down, add the index in its own change.
- **Sellers who go inactive.** Their page shows "Seller not found" rather than the empty state at
  `seller/[id].vue:58-63`. Past threads still resolve through the message clause.
- **Leftover dashboard policies.** Step 0 catches these. Rows would widen; after Phase 2, columns would
  stay protected.
- **Future table-level grants** would silently undo Phase 2. Re-run step 0's grants query after any
  later migration on `profiles`.
- **Rollback.** If Phase 1's rows break a screen, widen the policy rather than restoring `USING (true)`.
  If Phase 2 breaks something, `GRANT SELECT ON public.profiles TO anon, authenticated;` restores reads
  at once and reopens email for visible rows, so use it only briefly. Nothing is restored for writes,
  because nothing needs them.
- **The PGlite harness is not Supabase.** It uses mimicked grants and no PostGIS. The production
  checks in each phase are the real proof.
- **Past exposure cannot be undone**, and this work does not show whether anyone scraped the data.

## 7. Out of scope

Pre-existing problems, each for its own ticket:

- Inbox and transaction profile reads ignore errors (`inbox/index.vue:205`,
  `transaction/[id].vue:198-202`), so a permissions failure looks like missing names.
- `profiles.email` is copied once at signup and never updated if an auth email changes. The same now
  applies to `full_name`, since nothing syncs a later metadata change.
- `send.post.ts:122` falls back to 'A buyer' even when the sender is the seller.
- `seller/[id].vue:92` fetches in `onMounted`, so cached HTML and crawlers get empty SEO tags and no
  listings.
- `README.md:94` says migrations run in any order, while `MIGRATION_CHECKLIST.md` omits them (overlaps
  item 14).
- `CLAUDE.md` says Realtime is enabled, but no SQL file records it.
- The privacy page promises "edit your profile" (`privacy.vue:120`), but no edit screen exists. Adding
  one means `GRANT UPDATE (full_name, avatar_url)` and an update policy.
- `schema.sql` keeps its old trigger and policies, since database changes go in new migrations. A fresh
  setup is correct only after the checklist's last steps.

Related work deliberately left out:

- Sealing the row policy: items 3 and 4.
- Committed tests and CI: item 13.
- Account deletion: item 5, unaffected because it uses the service role.
- Moving contact data to a private table, which can still follow later without undoing this.

## Recommendation

Start with Phase 1, after prerequisite A (logs, since retention is running out) and prerequisite B
(step 0, which can stop the plan). Phase 2 should follow in the same or next sitting.

## Progress

**Phase 1:** done, PR #1 merged as a452f51, migration run on production 2026-10-30. After it, 8 of 14
profiles have names, and logged out the API returns 6 profiles, matching 6 active-listing owners.
Signup tests and click-through still open. Branch `fix/profiles-rows-and-names`, base `main` at
a6d9dbe.
Added the migration, removed the open policy from `messages_rls.sql`, added the migration to
`MIGRATION_CHECKLIST.md`, and added the disclosure lines to `privacy.vue` and `signup.vue`. The
migration has not been run anywhere but the PGlite harness.

Deviations:

- Built before prerequisites A and B, by Missa's decision. Both must be done before merge, and an
  unexpected policy from step 0 gets added to the migration's `DROP`s.
- The checklist's seed entries were renumbered 19 and 20 to make room for the migration.
- The harness has 8 checks beyond the plan's 12: user inserts and deletes of profiles, bulk listing,
  service-role writes, user inserts of listings and messages, backfill filling a name, backfill with
  blank metadata, policy count, and re-running `messages_rls.sql`.

Found after PR #1 opened, not covered by the plan: ChoreQuest (`chore-app`) shares this Supabase project,
so `handle_new_user` also runs for its signups and kid accounts, and `profiles` likely holds those
users. Step 0's counts and the exposure question must account for them, and the post-merge signup test
should include a ChoreQuest signup and adding a kid. ChoreQuest's code does not reference
`public.profiles`.

**Phase 2:** merged as 3bfc4db (PR #3), migration run on production 2026-10-30. Logged out with the
anon key on production: `full_name` and `id` return 6 rows; `email`, `phone`, `role`, `welcomed_at`,
`updated_at`, `*` and filtering on `email` each return 42501 permission denied. Still open: the same
checks with a logged-in token, the grants query, click-through signed in and out, and a test
notification email. Branch `fix/profiles-column-privileges`, base `main` at a452f51.
Added the migration, stopped reading `email` in inbox and the transaction page, removed it from the
`other_user` type, dropped the sender's address from `send.post.ts`, and added the migration to
`MIGRATION_CHECKLIST.md` as step 19. The migration has not been run anywhere but the PGlite harness,
so email stays readable on visible rows until it runs on production, after the app deploys.

Deviations:

- The checklist's seed entries were renumbered 20 and 21 to make room for the migration.
- The harness has checks beyond the plan: `updated_at` denied, filtering on `email` denied, the old
  query with `email` denied, and a signup with no name still working.
- Not in the plan: 6 of 14 production profiles had no name after Phase 1. With no email fallback,
  those people now show as "Unknown user", "Seller" or "Buyer", and as "A buyer" in emails.

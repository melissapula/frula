# Investigation: public email and phone on `profiles` (audit item 1)

Investigated 2026-10-30 against `main` at a6d9dbe. This was read-only: nothing was run against any
database, local or production. All line references were read on that date.

## 1. Task

Original task: "item 1 in project_audit_2026_10_30_backlog.md". The item's text, verbatim:

> 1. Email and phone are public. `supabase/schema.sql:341` policy "Public profiles are viewable" is
>    `USING (true)`, and no file drops it; a logged-out visitor read both fields from every profile. RLS
>    filters rows, not columns, so `messages_rls.sql` would not fix it. Fix: move contact fields to a
>    private table or expose a safe view, then update `inbox/index.vue:201` and `transaction/[id].vue`,
>    which read email directly. Also reproduced: a user can set their own `role` to admin (`role` looks
>    unused by app code today).

The backlog also says: before starting an item, re-verify it against current code and confirm the
live database state; database changes go in a new migration; opening a PR or posting anywhere needs
Missa's separate confirmation for that step. Its evidence note says items 1-5 were reproduced on
PGlite with the repo's SQL, which proves what the repo's SQL does, not what production has.

**Restatement.** Anyone holding the public anon key (every visitor, logged in or not) can read every
user's email and phone from `public.profiles`, and any user can change their own `role`. Close both,
without breaking the screens that show a person's name.

**Done means:**

- `anon` and `authenticated` cannot read `email`, `phone` or the other non-public columns of any
  profile through the Supabase API.
- A user cannot change `role` (or any profile column they should not own).
- Inbox, transaction page, seller page and all server routes still work, and people still see a name
  rather than "Unknown user".
- Proven by a test that fails before the migration and passes after it, then by the same check
  against production.

**Ambiguity in the task:**

- The item prescribes "private table or safe view". A third option, column privileges, is smaller
  and is recommended here (section 6). That is a change from the written fix, so it is Open question 1.
- The item does not say whether full names should stay public. See Open question 2.

## 2. Where it lives

| File | Role |
| --- | --- |
| `supabase/schema.sql` | Defines `profiles` (12-21), signup trigger (24-35), the open policies (341-342) |
| `supabase/messages_rls.sql` | Adds a second open SELECT policy on `profiles`, authenticated only (34-39) |
| `supabase/profiles_welcomed_at.sql` | Adds `welcomed_at` (11-12) |
| `supabase/MIGRATION_CHECKLIST.md` | Manual order of SQL files; does not list `supabase/migrations/` |
| `README.md` | Says app deploys on push to `main` (124) and migrations are run by hand, any order (94) |
| `apps/web/app/pages/inbox/index.vue` | Client read of `email` (201), displayed at 73 and 261 |
| `apps/web/app/pages/transaction/[id].vue` | Client read of `email` (198-202), displayed at 156 |
| `apps/web/app/composables/useMessages.ts` | `Thread.other_user` type includes `email` (58-62) |
| `apps/web/app/pages/seller/[id].vue` | Public read of `id, full_name, created_at` (94-98) |
| `apps/web/app/pages/signup.vue` | Stores full name in auth metadata only (131) |
| `apps/web/server/api/notifications/send.post.ts` | Service-role reads (94-104); email prefix used as a name (122) |
| `apps/web/server/api/notifications/welcome.post.ts` | Service-role read and write (47-49, 89) |
| `apps/web/server/api/alerts/process.post.ts` | Service-role read (119-121) |
| `apps/web/server/api/account/delete.post.ts` | Service-role delete (37) |

## 3. How it works today

**The leak.** The browser holds the anon key and talks directly to Supabase. Row Level Security
decides which rows a role sees; ordinary Postgres privileges decide which columns. `profiles` has an
open row policy with no role restriction (`schema.sql:341`) and the repo contains no `GRANT` or
`REVOKE` at all, so column access is whatever Supabase's defaults give (inferred: full table access
for `anon` and `authenticated`; the audit's PGlite run mimicked this). No SQL file drops the policy:
every `DROP POLICY` in `supabase/` was listed, and none touches "Public profiles are viewable".

`messages_rls.sql:34-39` adds a second `USING (true)` policy for `authenticated`. Its comment says
"public profile fields", but a policy cannot limit fields. Policies are permissive, so dropping one
leaves the other open: both must go.

**The privilege problem.** `schema.sql:342` allows a user to update their own row with no column
limit, so `role` is writable. The check constraint permits `admin` (`schema.sql:18`). Nothing reads
`role` from `profiles` today; every other `role` match in the code is a checklist or paperwork role.

**The finding the audit did not record: `profiles.full_name` is almost certainly empty.**

- Signup puts the name only in auth metadata: `signup.vue:131`, `data: { full_name: fullName.value }`.
- The trigger copies only id and email: `schema.sql:27-28`.
- No code writes `profiles.full_name`. The only `profiles` write in the app is `welcomed_at`
  (`welcome.post.ts:89`). The only other supplier is seed SQL (`seed_listings.sql:74`).
- Nothing writes `phone` either, so real phone values should be absent unless added by hand. Email is
  the data actually exposed. Phone numbers buyers share go in message text
  (`inbox/[listingId]/[userId].vue:269-275`), protected by message RLS.

Consequences today, if production matches the repo:

- Inbox and transaction names are emails: `inbox/index.vue:72-73`, `transaction/[id].vue:156`.
- Seller pages say "Frula Homes Seller": `seller/[id].vue:39`.
- Notification emails use the part of the sender's address before the `@`: `send.post.ts:122`.

Removing `email` alone would turn every inbox row into "Unknown user". **The name data has to be
fixed in the same change.**

**Who reads `profiles`.** Complete list from a search for `profiles` across `apps/web/app`,
`apps/web/server`, `scripts` and `supabase`. There are no `select('*')` reads and no embedded
`profiles(...)` joins.

| Caller | Client | Columns | Affected by the fix |
| --- | --- | --- | --- |
| `inbox/index.vue:201` | browser/SSR user session | `id, full_name, email` | Yes, must drop `email` |
| `transaction/[id].vue:198-201` | browser user session | `id, full_name, email` | Yes, must drop `email` |
| `seller/[id].vue:94-98` | browser, possibly anon | `id, full_name, created_at` | No |
| `send.post.ts`, `welcome.post.ts`, `process.post.ts`, `delete.post.ts` | service role | various | No, the service role keeps its own grants |

Both affected reads ignore the error (`inbox/index.vue:205`, `transaction/[id].vue:198-202`). If the
privileges change before the app does, they fail quietly: pages load, names vanish.

The user's own email comes from the session (`account.vue:233`, `AuthNav.vue`, `MobileMenu.vue`), not
from `profiles`.

## 4. What needs to change

SQL below is a draft and has not been executed.

**0. Check production first.** Run in the Supabase SQL Editor (read-only):

```sql
select tablename, policyname, cmd, roles, qual from pg_policies
 where schemaname = 'public' and tablename = 'profiles';

select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'profiles'
   and grantee in ('anon', 'authenticated');

select prosrc from pg_proc where proname = 'handle_new_user';

select count(*) total,
       count(full_name) with_name,
       count(phone) with_phone
  from public.profiles;

select tablename from pg_publication_tables
 where pubname = 'supabase_realtime' and tablename = 'profiles';
```

Expected: the policies from section 3, full grants, the two-column trigger, `with_name` near zero,
`with_phone` zero, and no publication row. The last matters because the repo has no
`supabase_realtime` statement at all, so publication membership is unknown from code.

**1. New migration `supabase/migrations/20261030_profiles_private_contact.sql`.**

```sql
-- Names stored in auth metadata were never copied to profiles.
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

-- Rows: see Open question 2.
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

-- Columns: table-level access must go first, because a column-level REVOKE
-- does not affect a table-level grant.
REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, created_at) ON public.profiles TO anon, authenticated;
```

No write grant is given back: nothing in the app writes `profiles` as a user, so users simply cannot
update it. That closes the `role` hole, and also `email`, `id` and `welcomed_at`, which a self-update
could reach. A future "edit my name" feature would add `GRANT UPDATE (full_name, avatar_url)` and an
update policy.

**2. `supabase/messages_rls.sql`.** Delete lines 30-39. The checklist runs this file late, so
otherwise a fresh setup brings back an open read policy.

**3. `supabase/MIGRATION_CHECKLIST.md`.** Add the new migration as the last schema step. It lists no
migrations today, so a fresh setup following it would stay exposed.

**4. `apps/web/app/pages/inbox/index.vue`.** Line 201 selects `id, full_name`. Remove the email
fallback at 73 and 261; the existing 'Unknown user' and 'this user' strings remain.

**5. `apps/web/app/composables/useMessages.ts`.** Remove `email` from `other_user` (line 61).

**6. `apps/web/app/pages/transaction/[id].vue`.** Line 200 selects `id, full_name`; remove `email`
from the type at 131 and the fallback at 156 (the 'Seller' / 'Buyer' fallback remains).

**7. `apps/web/server/api/notifications/send.post.ts`.** Line 122 becomes
`sender?.full_name || 'A buyer'`, so part of a sender's address no longer goes to a stranger. Drop
`email` from the sender select at 102. The recipient select must keep it.

**8. Test.** The repo has no tests, so rebuild the PGlite harness the audit used. Run it in the
scratchpad (it is not a new project dependency unless Missa says so; backlog item 13 owns test
infrastructure). Apply the repo's SQL, then assert, per her rule of proving the checker works, by
**running it before the migration and confirming these fail**:

- `anon` selecting `email` or `phone` is denied.
- `authenticated` selecting another user's `email`, and their own, is denied.
- `select=*` is denied for both.
- `anon` reads `full_name` of a user with an active listing.
- `anon` gets no row for a user with no active listing.
- A logged-in buyer gets the seller's name, and vice versa, once a message exists.
- A user with no shared thread gets no row for a non-seller.
- `UPDATE ... SET role = 'admin'` on your own row is denied.
- Service role still reads email.
- A new auth user with `full_name` metadata gets a filled-in `profiles.full_name`.

## 5. Patterns to follow

- Migration naming and style: `supabase/migrations/20260421_cascade_fixes.sql` (date prefix, short
  comment saying why, `DROP ... IF EXISTS`).
- Policy formatting and explicit `TO` roles: `supabase/transactions_rls.sql:12-17`.
- `EXISTS` subquery on a related table: `supabase/listings_rls.sql:46-50`.
- Reading contact data server-side with the service role: `send.post.ts:94-99`.
- The fallback-name style already in place: `transaction/[id].vue:156`.

## 6. Reuse options

**Hiding columns.** Channels checked: repo (no views, grants or `security_invoker` anywhere),
installed packages (not applicable, this is database behavior), Supabase and PostgreSQL docs.
`gh` and npm were not searched, since no package solves this. The context7 server was unavailable,
so docs were fetched directly.

- **Column privileges: adopt.** One migration, no change to the four service-role routes, and future
  columns default to private. A stray `select('*')` fails loudly rather than leaking. The docs confirm
  the table-level grant must be revoked first and that `select *` then fails. Note that Supabase's
  docs call this an advanced feature and steer most users toward RLS plus a dedicated table.
- **Private table: reject for now.** Supabase's general suggestion, and the audit's first option, but
  it also changes the trigger, four service-role routes and the delete flow, and needs a data move, so
  it adds risk to an urgent fix. It still needs the privilege revoke to stop `role` writes.
- **Safe view: reject.** `email` stays on a table `anon` can reach unless privileges are revoked
  anyway, and a view is one more thing to keep in step.

**Everything else.** Name backfill and app edits are plain edits, so no new capability is needed.
No new dependency is proposed.

## 7. Risks and blast radius

- **Deploy order.** `main` deploys automatically (`README.md:124`) while SQL is run by hand, so they
  cannot be atomic. Merge the app first, then run the migration straight after. Between the two, the
  app shows "Unknown user" until the backfill lands, which is cosmetic. The reverse order is safe
  too (reads fail quietly) but leaves names missing just the same.
- **Names become visible.** Backfilling puts real names on public seller pages that currently say
  "Frula Homes Seller". This is a user-facing privacy change. See Open question 2.
- **The row policy is bypassable until items 3 and 4 close.** Any user can message anyone or create
  a fake transaction naming someone, which creates a "counterparty" and reveals that person's full
  name. Only the name is exposed, and it needs the target's UUID. Email stays protected regardless,
  because column privileges do not depend on rows. Listing the whole table logged-out stops working.
- **Sellers who go inactive.** Their page shows "Seller not found" rather than the empty state at
  `seller/[id].vue:58-63`. Past threads still resolve through the message clause.
- **Policy cost.** The policy runs three subqueries per row. Reads here are by id, so this should be
  negligible, but it is untested on real data. Recursion should not occur because no `listings`,
  `messages` or `transactions` policy references `profiles` (read for all three).
- **Leftover policies.** A dashboard-created policy would be missed by the `DROP`s. Rows would widen;
  columns would stay protected. Step 0 catches it.
- **Future grants.** A later table-level `GRANT` would silently undo this. Add the step 0 grants query
  to the post-deploy check.
- **`handle_new_user` is on the signup path.** A bug there blocks all signups, so test it. The
  `search_path = ''` hardening is safe only because the function fully qualifies `public.profiles`.
- **Item 5 (account deletion)** is unaffected: it uses the service role. It does not improve either.
- **Past exposure cannot be undone.** Closing this does not reveal whether anyone already scraped
  the data. See Open question 3.

## 8. Verified vs. inferred

**Verified by reading code:** every line reference here; the full list of `profiles` readers; no
`select('*')` or embedded joins; no app code writes `profiles.full_name` or `phone`; no `GRANT`,
`REVOKE` or view in `supabase/` other than an unrelated function grant; no SQL drops the open policy;
installed `@supabase/supabase-js` 2.103.3 and `@nuxtjs/supabase` 1.6.2.

**Verified from documentation (fetched 2026-10-30):** PostgreSQL's GRANT page says access is the
union of table and column privileges, and a column-level operation leaves a table-level grant
unaffected. Supabase's column-level security page confirms the revoke-then-grant approach for
`authenticated` and that `select *` fails.

**Reproduced by the earlier audit, not re-run here:** the logged-out read of both fields and the
`role` self-update, on PGlite with mimicked grants.

**Inferred or not confirmed:**

- Production state. Nothing was queried, deliberately: step 0 does this. All statements about real
  users having empty `full_name` or `phone` assume production matches the repo.
- Supabase's default grants to `anon` and `authenticated` in this project.
- Whether `profiles` is in the Realtime publication.
- That the draft SQL works: it has not been executed, on purpose, under this read-only investigation.
- Supabase's docs examples cover `authenticated`; applying the same to `anon` is inferred from
  Postgres behavior.

## 9. Open questions

1. **Column privileges rather than the audit's "private table or safe view"?** Recommend yes, for
   the reasons in section 6. A private table can still follow later without undoing anything.
2. **Should real names appear publicly?** Signup says only "Full name" (`signup.vue:18-21`) and the
   privacy page says "display name" and that active listings are public, without saying the name is
   shown (`privacy.vue:33-39`). Recommend: show the name to counterparties in threads and transactions
   (needed), and keep the row policy above so non-sellers are never listed publicly. For sellers,
   show the name and add one line to the privacy page and signup. If you would rather not publish
   sellers' full names, the seller page can show first name only, but the column is still readable
   through the API, which would need a separate approach.
3. **Do you need to look at past exposure?** Recommend checking the Supabase API logs for bulk
   `profiles` reads for whatever retention your plan offers, and asking the attorney already reviewing
   the policy whether notice is needed if real users exist. I have not assessed legal obligations.
4. **Keep the PGlite test throwaway or commit it?** Recommend throwaway for this ticket, and commit
   real tests under item 13, so this ticket stays focused.

## 10. Pre-existing problems (own tickets, not this change)

- Inbox and transaction profile reads ignore errors (`inbox/index.vue:205`,
  `transaction/[id].vue:198-202`), so a permissions failure looks like missing names.
- `profiles.email` is copied once at signup and never updated if an auth email changes.
- `send.post.ts:122` falls back to 'A buyer' even when the sender is the seller.
- `seller/[id].vue:92` fetches in `onMounted`, so the 10-minute cached HTML (`nuxt.config.ts:97`) and
  crawlers get empty SEO tags and no listings. The sitemap advertises these pages.
- `README.md:94` says migrations run in any order, while `MIGRATION_CHECKLIST.md` omits them. This
  overlaps backlog item 14.
- `CLAUDE.md` says Realtime is enabled, but no SQL file records it, so a fresh setup would not get it.
- The privacy page promises "edit your profile" (`privacy.vue:120`), but no profile edit screen
  exists; `account.vue` only displays the name.

## Recommendation

Do this as one ticket and one PR, in this order:

1. Run step 0 in production and confirm it matches this report.
2. Settle Open questions 1 and 2.
3. Build the PGlite check and watch it fail against the current SQL.
4. Write the migration and make the app edits, then watch the check pass.
5. Merge, then immediately run the migration in the SQL Editor.
6. Confirm with a logged-out request for `profiles?select=email` using the anon key (expect a
   permission error), then click through inbox, a transaction and a seller page.
7. Mark item 1 closed in the backlog, with the name-data finding, and note that items 3 and 4 are
   what fully seal the row policy.

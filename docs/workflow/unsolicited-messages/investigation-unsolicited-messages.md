# Investigation: any user can message any user (audit item 3)

Investigated 2026-10-30. The checkout was on `fix/messages-lock-writes` at efb97cd with a clean tree.
`git diff HEAD origin/main` is empty, so these files match `origin/main` (ab0a361, PR #8) even though
the commit hashes differ. Local `main` is behind at d864808, so start from a fresh `origin/main`.

This was read-only: no tests, builds or migrations ran, and no database, local or production, was
touched. All line references were read on this date.

## 1. Task

Original task text: `audit`.

That word alone is ambiguous. I read it as the next open item in the backlog memory note
`project_audit_2026_10_30_backlog.md`, whose agreed order is items 2-5 next, with items 1 and 2
already fixed. `project_test_infra_next.md` also says "item 3 is next". Item 3, verbatim:

> 3. Any user can message any user. RLS checks only `sender_id`, then `server/api/notifications/send.post.ts`
>    emails the content from the Frula domain. The route can also be replayed for one message. Fix:
>    require recipient to be the listing owner or already in the thread; send each message's email once.

The same note adds: "Item 3 changes the same INSERT policy and must keep the payload condition",
re-verify against current code and confirm the live database state before starting, database changes
go in a new migration, and opening a PR or posting anywhere needs Missa's separate confirmation.

**Restatement.** A signed-in user can start a conversation with anyone, about any listing, and have
Frula's domain email their text to that person. They can also resend the email repeatedly for one
message. Limit who can be messaged, and make each message produce at most one email.

**Done means:**

- A user can only start a conversation with the owner of an active listing, about that listing.
- A user can only message a non-owner who has already written to them on that listing.
- Nobody can message themselves.
- All eight legitimate insert paths in section 3 still work.
- The payload condition from item 2 still holds.
- One message produces at most one email and one bell notification, including messages that exist
  before this change.
- Tests fail before the fix and pass after it, then the same checks pass on production.

**Ambiguity in the task:**

- "Already in the thread" could mean either party has written, or that the recipient has written to
  the sender. Open question 1.
- The item does not say what happens to rows already in production that break the new rule. Open
  question 3.
- It does not say whether a failed email may be retried. Open question 2.

## 2. Where it lives

| File | Role |
| --- | --- |
| `supabase/migrations/20261030_messages_lock_writes.sql` | Current INSERT policy (15-21), and the column grants (32-33) |
| `supabase/migrations/20261030_messages_respond_function.sql` | The security-definer function precedent |
| `supabase/migrations/20261030_profiles_names_and_rows.sql` | Profile read policy that trusts `messages` rows (29-31) |
| `supabase/schema.sql` | `messages` table (214-222), `listings.status` values (45-46) |
| `supabase/MIGRATION_CHECKLIST.md` | Manual run order; the last migration is item 21, seeds are 22-23 |
| `apps/web/server/api/notifications/send.post.ts` | Email and bell notification for one message |
| `apps/web/server/utils/rateLimit.ts` | In-memory limiter used by the route |
| `apps/web/app/composables/useNotificationEmail.ts` | Client call to the route; swallows failures (12-22) |
| `apps/web/app/pages/inbox/[listingId]/[userId].vue` | Thread page: four of the insert paths |
| `apps/web/app/components/OfferModal.vue`, `ViewingModal.vue` | Offer, counter and viewing inserts |
| `apps/web/app/pages/transaction/[id].vue` | Checklist note insert (245-250) |
| `apps/web/app/pages/listing/[id]/index.vue` | Entry points; passes the owner as recipient (380, 390, 589) |
| `tests/db/messages-integrity.test.ts` | Existing insert tests to extend |
| `tests/db/support/fixtures.ts`, `database.ts`, `schema-files.ts` | PGlite harness; every new SQL file must be listed in `schema-files.ts` |

## 3. How it works today

**Sending.** Every path inserts directly into `messages` from the browser, then most call `notify`.

The INSERT policy (`20261030_messages_lock_writes.sql:15-21`) checks that `sender_id` is the caller
and that `kind` and `payload` are valid. It says nothing about `recipient_id` or whether they relate
to `listing_id`. So `recipient_id` can be any profile, and `listing_id` any listing.

**The eight legitimate insert paths**, with who the recipient is:

| # | Path | Sender to recipient | Passes the proposed rule because |
| --- | --- | --- | --- |
| 1 | `sendFirstMessage`, `[userId].vue:279` | Buyer to owner (route set by `listing/[id]/index.vue:589`) | Owner of an active listing |
| 2 | `send`, `[userId].vue:476` | Either party | Owner, or the other party has written |
| 3 | Offer, `OfferModal.vue:311` from `listing/[id]/index.vue:380` | Buyer to owner | Owner of an active listing |
| 4 | Viewing, `ViewingModal.vue:212` from `listing/[id]/index.vue:390` | Buyer to owner | Owner of an active listing |
| 5 | Counter, `OfferModal.vue:311` with `counterContext.recipientId`, set at `[userId].vue:560` | Recipient of an offer back to its sender | The other party wrote the offer |
| 6 | `dropSystemMessage`, `[userId].vue:526` | Seller answering an offer or viewing | Same |
| 7 | `startTransaction` note, `[userId].vue:390` | Either party in a thread | Owner, or the other party has written |
| 8 | Checklist note, `transaction/[id].vue:245` | Either transaction party | Depends on a thread still existing; see section 7 |

The UI never lets an owner contact their own listing: `contactSeller` and `requireLoginThen` return
early (`listing/[id]/index.vue:588`, `:600`), so banning self-messages breaks nothing.

**Notifying.** `send.post.ts` requires a signed-in user (51-54), limits to 5 calls a minute per user
(57), loads the message with the service role (74-78), and requires the caller to be its sender
(86-91). It then inserts a bell notification (149-156) and emails through Resend (209-222).

Nothing records that a message was already handled. A sender can POST the same `messageId` again and
get another email and another bell row, once per allowed call. The rate limit is the only brake, and
that limit is per server instance (`rateLimit.ts:5`).

Email content is escaped in the body (`send.post.ts:320`), so this is an abuse problem, not an HTML
injection one. The email does carry Frula's sender address and branding.

**A side effect on privacy.** The profile read policy lets a user read any profile they share a
message with (`20261030_profiles_names_and_rows.sql:29-31`). Today a stranger can insert one message
to a target and then read that person's profile row. The new rule closes this route. The matching
route through `transactions` (32-34) stays open until item 4.

## 4. What needs to change

Order matters: tests first, then the migration, then the route.

1. **`tests/db/support/fixtures.ts`**: export `DRAFT_LISTING`, and add a listing owned by `SELLER`
   with a non-active status such as `sold`.
2. **`tests/db/messages-integrity.test.ts`**: add a `who can be messaged` block. Use the no-`RETURNING`
   form as well as the normal one, because the existing comment at 259 explains that `RETURNING` adds
   the SELECT policy's check and can hide a gap.
   - Blocked: stranger to a non-owner on `ACTIVE_LISTING`, seller to someone who never wrote, buyer to
     the owner of a draft or sold listing with no history, a user to themselves, and an offer to a
     non-owner (shows the rule covers every `kind`).
   - Allowed: a buyer to the owner, a seller replying to a buyer who wrote, and a counter offer back
     to the buyer.
   - A stranger with no shared message cannot read a non-seller's profile row.
   - `can_message` cannot be executed by `anon`. Copy `canExecute` at 63-65.
   - Claim function: first call returns true, second returns false, and `anon` and `authenticated`
     cannot execute it.
3. **New migration**, for example `supabase/migrations/20261030_messages_recipient_rule.sql`:
   - Add `public.can_message(target_listing uuid, target_recipient uuid) RETURNS boolean`, `STABLE
     SECURITY DEFINER SET search_path = ''`. True if the recipient owns that listing and it is
     `active`, or the recipient has already sent the caller a message on that listing.
   - Revoke EXECUTE from `PUBLIC, anon, authenticated`, then grant it to `authenticated`. RLS policies
     run functions as the querying role, so `authenticated` must keep it.
   - Drop and recreate "Senders can insert messages", keeping the existing conditions and adding
     `recipient_id <> sender_id AND public.can_message(listing_id, recipient_id)`.
   - Add `messages.notified_at TIMESTAMPTZ`, and backfill existing rows with `created_at`. **Without
     the backfill every old message could be replayed for one more email.**
   - Add `public.claim_message_notification(message_id uuid) RETURNS boolean`: one `UPDATE` setting
     `notified_at = NOW()` where `id` matches and `notified_at IS NULL`, returning whether a row
     changed. Grant EXECUTE to `service_role` only.
4. **`tests/db/support/schema-files.ts`**: add the migration after `20261030_messages_lock_writes.sql`.
5. **`supabase/MIGRATION_CHECKLIST.md`**: add it as item 22 and renumber the seeds.
6. **`apps/web/server/api/notifications/send.post.ts`**: straight after the missing-recipient check
   at 116-120 and before the bell insert at 149, call the claim through `admin.rpc`. If it returns
   false, return `{ sent: false, reason: 'Already notified' }`. If it errors, throw a 500; the client
   swallows that (`useNotificationEmail.ts:18-21`), and failing closed means no duplicate emails.
   Update the header comment at 1-13.

No client change is needed. A blocked insert shows Postgres's raw message
(`[userId].vue:292`, `OfferModal.vue:335`), but only someone forging a URL or request can reach it.

## 5. Patterns to follow

- **Security-definer function:** `20261030_messages_respond_function.sql:4-28`, including
  `SET search_path = ''`, fully qualified names, and revoke-then-grant.
- **Comment style in migrations:** a short explanation of why, at the top of the file.
- **Policy replacement:** `DROP POLICY IF EXISTS`, then `CREATE POLICY`, inside `BEGIN`/`COMMIT`
  (`20261030_messages_lock_writes.sql`).
- **Test tables and helpers:** `it.each`, `expectBlocked`, `insertMessage` and `canExecute` in
  `tests/db/messages-integrity.test.ts`.
- **Route behavior:** return `{ sent: false, reason }` for no-ops (`send.post.ts:119`).

## 6. Reuse options

- **Recipient rule.** Repo: nothing existing. No maintained package applies, because this is a
  business rule in a Postgres policy, so packages and open source were not searched. **Build** a
  small function, mirroring `respond_to_message`.
- **Send once.** Repo: `profiles.welcomed_at` is a similar timestamp idea (`profiles_welcomed_at.sql`
  and `server/api/notifications/welcome.post.ts`; both seen in file listings, and their contents were
  not read). Resend's idempotency keys would stop duplicate emails but not duplicate bell rows, and
  were not checked against current docs. **Build** a claim column, since Postgres gives an atomic
  check-and-set for free.
- **Route tests.** `@nuxt/test-utils` is not installed. `project_test_infra_next.md` left it for "a
  first real need (item 3)". **Do not adopt it yet**: moving the claim into a database function lets
  PGlite test the logic that matters. Open question 4.

context7 failed to connect this session, so no library docs were checked through it.

## 7. Risks and blast radius

- **Same-table reads in a policy.** A policy on `messages` that queries `messages` directly is
  expected to raise "infinite recursion detected in policy". This is why the check sits in a security
  definer function. Recalled from Postgres behavior, not run here.
- **Security definer and `auth.uid()`.** `can_message` takes no sender argument and reads
  `auth.uid()`, so a caller cannot ask on another person's behalf. Its answer reveals only whether
  the caller could message someone, and it checks ownership only for active, already public listings.
- **Deleted threads.** `deleteThread` removes both parties' messages (`inbox/index.vue:264-270`).
  After that, a seller cannot message the buyer until the buyer writes again, even mid-transaction.
  The checklist note at `transaction/[id].vue:245` would fail silently because its error is unchecked
  (item 18). A buyer can still write while the listing is active.
- **Buyer with no reply, listing no longer active.** Under the recommended rule, that buyer cannot
  follow up. Open question 1.
- **Allowing `transactions` as a third route is unsafe for now.** It would fix both cases above, but
  item 4 means anyone can fabricate a transaction, which would reopen this hole. Revisit after item 4.
- **Deploy order.** Run the migration before the route deploys, or the route's RPC fails and all
  emails stop. The old route with the new migration keeps working.
- **`notified_at` on insert.** A sender could set it on their own insert. That only suppresses their
  own email, so it needs no rule. Users cannot update it because of the column grants at
  `20261030_messages_lock_writes.sql:32-33`.
- **Lost emails.** Claiming before sending means a Resend failure loses that email. The client never
  retries today, so this matches current behavior, and the bell row and inbox message still exist.
- **Shared Supabase project.** ChoreQuest shares this project (`project_shared_supabase_chorequest.md`).
  Confirm neither new function name exists there before running the migration.

**This does not stop bulk contact.** Any signed-in user can still message every active seller with
any text, emailed from Frula's domain. Inserts have no rate limit, the email route's limit is
per-instance, and `body` has no length limit. That belongs to item 7 and item 12.

## 8. Verified vs. inferred

**Verified by reading code:** the INSERT policy, the eight insert paths and their recipients, the
route's checks and lack of any send record, the profile policy's dependency on `messages`, and that
`tests/db/profile-privacy.test.ts` does not mention `messages`. `git diff HEAD origin/main` is empty,
and `gh pr list` shows PR #8 merged.

**Not verified:**

- Nothing ran, so the proposed SQL and the existing tests' behavior under it are untested. Reading
  says the existing insert tests still pass, since they use `BUYER` to `SELLER` on `ACTIVE_LISTING`
  and the fixture seeds a buyer message before any seller reply. That is inferred.
- The recursion error in section 7 is from memory.
- The production policy, grants and columns were not read. PR #8's migrations are recorded as run in
  the backlog note only.
- The route has no automated test, before or after this plan. Only a two-account production check
  covers it.
- Whether production holds rows that break the new rule is unknown.
- Whether ChoreQuest uses `messages` or those function names is unknown.

## 9. Open questions

1. **What does "already in the thread" mean?** Recommendation: the recipient must have written to the
   sender. It needs no data cleanup, because an old forged row gives its sender nothing. The cost is
   the buyer-with-no-reply case in section 7, which is small. Letting either party count would also
   let an old forged thread continue.
2. **Retry a failed email?** Recommendation: no. Keep at-most-once, because duplicates are the bug
   being fixed and nothing retries today.
3. **Existing rows that break the rule?** Recommendation: run a read-only count first and leave the
   rows alone unless it finds abuse. They stop mattering for sending under question 1's rule, though
   each one still opens the profile policy between that pair.

   ```sql
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
   ```

4. **Add `@nuxt/test-utils` for the route?** Recommendation: no, as section 6 explains. The route's
   call to the claim stays covered only by the production check.

## 10. Pre-existing problems

These belong in their own tickets, not this change.

- `save.post.ts` has no replay protection: one user can POST repeatedly for one listing and add a
  "Someone saved your home" bell row each time, up to 10 a minute (60-67). It also never checks that
  the listing was really saved. Not in the audit backlog.
- The bell insert at `send.post.ts:149` ignores its error. Same family as item 18.
- The route uses raw `readBody` with no UUID check on `messageId` (65-69). A malformed id gives a
  misleading 404.
- `send.post.ts:122` calls every unnamed sender "A buyer", including sellers replying. Related to
  item 17.
- Offer and viewing `body` text is client-written and is what gets emailed, so it can disagree with
  `payload`, for example a body saying $1M and a payload saying $1. Not in the audit backlog.
- `CLAUDE.md` still lists message features as described before items 1 and 2, and is covered by the
  existing nit about it being stale.

## Recommendation

Do this as one PR from a fresh `origin/main`, test-first, as item 2 was:

1. Answer the open questions, and run the read-only production count.
2. Write the failing tests, then the migration, then the route change.
3. Confirm the tests can fail: remove the new migration from `schema-files.ts`, and see the new block
   and the file-list guard go red, then restore it.
4. Have Missa run the migration in the SQL Editor before the route deploys, and read back the policy
   and grants with `pg_policies`, `information_schema.column_privileges` and `has_function_privilege`.
5. Check production with two accounts: every path in section 3, a blocked stranger insert, and one
   replayed `messageId` that produces no second email or bell row.

Opening the PR is a separate decision for Missa. When item 3 closes, update
`project_audit_2026_10_30_backlog.md`, including its description line.

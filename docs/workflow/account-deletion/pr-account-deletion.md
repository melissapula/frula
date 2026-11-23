🐛 Let profile and auth-user deletes cascade through messages and transactions
## 📝 Description
- Deleting an account currently fails for anyone who has sent or received a message, made an offer, been on a transaction, owns a checklist or has a listing plan. Six keys that point at `profiles` have no delete action, so Postgres refuses the delete while any of those rows exist.
- Because Frula and ChoreQuest share one Supabase project, an auth-user delete hits the same wall. ChoreQuest's kid delete fails for anyone who has sent a Frula message.
- This gives each of those keys a deliberate action. The departing user's messages, offers and viewing requests go in both directions, along with their checklists, their listing plans and any transaction naming them as seller. A transaction where they were the buyer stays with the seller, with no buyer.
- This also covers sellers. Today a seller who has received even one message on their own listing can't be deleted either: Postgres runs the "nothing still points here" check before the listing cascade has removed those messages.

## 🔗 Related Issue(s)
- Audit items 5 and 21 from the 2026-11-13 audit (not tracked as GitHub issues). This is the database half of item 5. The delete route's error handling is a separate follow-up.

## 🏷️ Type of Change
- ✅ 🐛 Bug fix (non-breaking change which fixes an issue)
- ⬜ ✨ New feature (non-breaking change which adds functionality)
- ⬜ 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- ⬜ ♻️ Refactoring / Tech debt
- ⬜ 📚 Documentation update

## 🛠️ Changes Made
- **Migration** `supabase/migrations/20261113_profile_delete_actions.sql`: drops and re-adds the six keys in one transaction. CASCADE on `messages.sender_id`, `messages.recipient_id`, `transactions.seller_id`, `transaction_checklists.user_id` and `listing_plans.user_id`. SET NULL on `transactions.buyer_id`. `schema.sql` is left alone, following the existing `20260421_cascade_fixes.sql` pattern.
- **Runbook** `supabase/MIGRATION_CHECKLIST.md`: new step 24 with a `pg_constraint` query to run before and after, and a warning that ChoreQuest deletes now remove more. The seed steps are renumbered to 25 and 26.
- **Test harness** `tests/db/support/database.ts`: `createTestDatabase({ without })` can leave one SQL file out, so a test can build today's schema. `readAfterDelete` runs a delete and a follow-up read in one transaction that rolls back. `schema-files.ts` lists the new migration.
- **Tests** `tests/db/account-deletion.test.ts`: 9 tests. One departing user is seeded with every kind of reference, then the tests check what's removed and what's kept, plus two tests against the schema without the migration.

## 🎯 Definition of Done
- ✅ Deleting an `auth.users` row succeeds for a user with messages in both directions, an offer, transactions as buyer and as named seller, a checklist, a listing plan and their own listing — `deleting the auth user removes the profile`
- ✅ Deleting the profile directly succeeds for the same user — `deleting the profile directly succeeds`
- ✅ A seller whose rows all sit on their own listings can be deleted — `deleting a seller with only own-listing rows succeeds`
- ✅ The departed user's messages are removed in both directions — `removes the departed user's messages in both directions`
- ✅ The seller keeps the transaction, their checklist and the listing, with the buyer cleared — `keeps the seller's transaction with no buyer`
- ✅ The departed user's checklist, listing plans and any transaction naming them as seller are removed — `removes the departed user's checklist, listing plans and fabricated seller transactions`
- ✅ Other users' messages, listings, transactions and profiles are untouched — `leaves other users' messages and listings alone`
- ✅ The tests can fail: without the migration, both the buyer and the seller deletes fail on a foreign key — `without the migration, the same delete fails on a foreign key`, `a seller with only own-listing rows also fails today`. Changing `buyer_id` to CASCADE failed 1 test, and leaving `listing_plans.user_id` with no action failed 6.
- ⬜ The migration has been run on production and `pg_constraint` shows the new actions — runs after merge, following checklist step 24
- ⬜ A ChoreQuest kid who has sent a Frula message can be deleted — optional production check after the migration runs

## 🧪 How to Test
1. `git fetch && git switch fix/profile-delete-actions`, then `npm ci` at the repo root. No env or running services needed; the database tests run on in-memory PGlite.
2. `npx vitest run tests/db/account-deletion.test.ts` — expect 9 passed.
3. To see the tests catch a wrong action: in the migration, change `ON DELETE SET NULL` to `ON DELETE CASCADE` and rerun. Expect `keeps the seller's transaction with no buyer` to fail. Revert.
4. Read `supabase/MIGRATION_CHECKLIST.md` step 24 and check that the six constraint names match the migration.
5. After merge, on production: run step 24's query and expect the six keys with `confdeltype = 'a'`. Run the migration, rerun the query, and expect `c` for five keys, `n` for `transactions_buyer_id_fkey`, and one key per column.
6. `npm test` — expect all suites green (330 tests).

## ✅ Checklist
- ⬜ My code follows the style guidelines of this project — Prettier passes; ESLint can't run on this repo yet (already broken on `main`)
- ⬜ I have performed a self-review of my own code — not done separately from writing it
- ✅ I have commented my code, particularly in hard-to-reach areas
- ✅ I have added tests that prove my fix is effective or that my feature works
- ✅ New and existing unit tests pass locally with my changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

🐛 Keep a sign-in ChoreQuest still uses, and report a failed sign-in deletion

## 📝 Description
- Frula and ChoreQuest share one `auth.users` table, and ChoreQuest's `chore.users` cascades from it. Deleting a Frula account removed the `auth.users` row, which also deleted the person's ChoreQuest account.
- The delete route now closes the Frula account through `close_frula_account` (added in #17) and deletes the sign-in only when the function says no other app uses it. A ChoreQuest user keeps their sign-in and is told why.
- The route also stops reporting success when the sign-in delete fails. It returns an error the person can retry instead.
- **Before merging:** `supabase/MIGRATION_CHECKLIST.md` step 25 must already have run on production, because merging deploys a route that calls the function. It ran on 2026-11-13.

## 🔗 Related Issue(s)
- Audit item 20 (2026-11-13 audit): Frula account delete erases the person's ChoreQuest account
- Builds on #17 (merged)

## 🏷️ Type of Change
- ✅ 🐛 Bug fix (non-breaking change which fixes an issue)
- ⬜ ✨ New feature (non-breaking change which adds functionality)
- ⬜ 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- ⬜ ♻️ Refactoring / Tech debt
- ⬜ 📚 Documentation update

## 🛠️ Changes Made
- **Route** `apps/web/server/api/account/delete.post.ts`: calls `rpc('close_frula_account')` instead of deleting the profile directly. Unless it returns exactly `true`, the route responds `{ deleted: true, signInKept: true }` and doesn't call `deleteUser`, so an unexpected answer keeps the sign-in rather than risk erasing a ChoreQuest account. On `true` it calls `deleteUser`; a failure now throws a 500 ("Your data was deleted, but we couldn't close your sign-in. Please try again.") instead of being logged and swallowed. A retry is safe: the function finds no profile, returns `true`, and `deleteUser` runs again. The header and cascade comments now describe the real delete chain.
- **Account page** `apps/web/app/pages/account.vue`: when `signInKept` is true, it signs out and shows "Your Frula data is deleted. Your sign-in stays because ChoreQuest uses it." with a home link, in place of the account content. The page stays put after sign-out because the auth redirect only runs on navigation. The Frula-only path is unchanged (sign out, then redirect home).
- **Tests**:
  - `tests/routes/support/fake-services.ts` adds fakes for the function call (set to return true, return false, return null or fail) and for the admin user delete (can be set to fail), plus `callOrder()`.
  - `tests/routes/account-delete.test.ts` adds 7 route tests.

## 🎯 Definition of Done
- ✅ For a Frula-only user, the route closes the Frula account and then deletes the sign-in, in that order, and returns `signInKept: false` — `closes the Frula account and deletes the sign-in for a Frula-only user`
- ✅ When ChoreQuest uses the sign-in, the route never calls the auth delete and returns `signInKept: true` — `keeps the sign-in when ChoreQuest uses it`
- ✅ The database function keeps `auth.users` and `chore.users`, removes all Frula data, and leaves a blank profile so Frula keeps working for that sign-in — DB tests from #17 (`tests/db/close-frula-account.test.ts`)
- ✅ An unexpected answer from the function (anything but `true`) keeps the sign-in — `keeps the sign-in when closing the account gives no answer`
- ✅ If closing the account fails, the route returns 500 and doesn't touch the sign-in — `returns 500 and skips the auth delete when closing the account fails`
- ✅ A failed sign-in delete is reported as an error, not success, and the message reaches the field the page shows — `returns an error, not success, when the auth delete fails` (failed against the old route)
- ✅ Retrying after a failed sign-in delete succeeds — `a retry after a failed auth delete succeeds`
- ✅ The route's comments describe the real delete chain and name both migrations — `apps/web/server/api/account/delete.post.ts:1-13`, `:35-38`
- ✅ The migration ran on production and was read back (privileges `false, false, true`) — checklist step 25, 2026-11-13
- ⬜ A ChoreQuest user sees the notice after deleting, and can still sign in to both apps — the code is in `apps/web/app/pages/account.vue:12-25`, but it hasn't been checked in a browser yet; it's hand check 2 below
- ⬜ A Frula-only user's sign-in is gone from Supabase Auth after a real delete — hand check 1 below, not yet run

## 🧪 How to Test
1. `git fetch && git checkout fix/account-delete-keeps-shared-sign-in && npm install`
2. `npx vitest run tests/routes/account-delete.test.ts`: expect 7 passed.
3. Optional: in `delete.post.ts`, remove the `if (isSignInDeletable !== true)` block and rerun step 2. Expect `keeps the sign-in when ChoreQuest uses it` to fail. Revert.
4. Hand check 1 (Frula-only), with a throwaway account against a local or preview build: sign up, open `/account`, choose Delete my account and confirm. Expect sign-out and a redirect to `/`, and the user gone from Authentication in the Supabase dashboard.
5. Hand check 2 (ChoreQuest), with a throwaway ChoreQuest parent or kid created in ChoreQuest: sign in to Frula with it, save a listing or send a message, then delete from `/account`. Expect the "Your sign-in stays because ChoreQuest uses it" notice. The Auth user and the `chore.users` row should remain, the person should still be able to sign in to ChoreQuest and Frula, and Frula should show none of the old data.
6. `npm test`: expect 11 files and 348 tests passed.

## ✅ Checklist
- ⬜ My code follows the style guidelines of this project — Prettier passes, but lint can't run: `apps/web/eslint.config.mjs` imports `.nuxt/eslint.config.mjs`, which isn't generated because `@nuxt/eslint` isn't in the `nuxt.config.ts` modules
- ✅ I have performed a self-review of my own code
- ✅ I have commented my code, particularly in hard-to-reach areas
- ✅ I have added tests that prove my fix is effective or that my feature works
- ✅ New and existing unit tests pass locally with my changes

Typecheck note: `vue-tsc` fails repo-wide because the repo has no generated Supabase types. This PR adds one error of the same kind at `delete.post.ts:39`, the same one the existing `rpc()` call at `send.post.ts:126` gets.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

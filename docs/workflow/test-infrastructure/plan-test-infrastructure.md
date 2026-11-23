# Plan: test infrastructure

## 1. Task

There was no separate task text. The ticket comes from the approved scope recorded on 2026-10-30:

> Test infrastructure moves ahead of audit item 2, and Vitest and PGlite may be added as dev
> dependencies. Scope: Vitest and PGlite as dev dependencies; the harness moved into the repo as a
> reusable setup plus readable test files, with profile privacy as the first suite; a root
> `npm test`; a GitHub Actions `pull_request` check.

**Definition of done**

- `npm test` at the repo root runs the database tests against the repo's real SQL.
- All 35 checks from the throwaway profile privacy harness exist as named tests and pass.
- Removing `20261030_profiles_column_privileges.sql` from the setup makes exactly the 19 column
  checks fail, locally and on a pull request.
- Every `.sql` file under `supabase/` is either applied by the setup or listed as skipped with a
  reason, and a test fails if a new file is neither.
- A pull request shows a test check that needs no secrets.

## 2. Source

**No investigation exists for this ticket.** `investigation-public-profile-pii.md` is the only one on
disk, and it covers audit item 1. It deferred committed tests to this ticket (line 320). This plan is
built from three other sources instead:

- the memory note `project_test_infra_next.md`
- the harness `profile-privacy-harness.mjs` in the same memory directory
- a read of the current repo

**Spot-check results, all on `main` at 3bfc4db:**

| Claim | Result |
| --- | --- |
| No tests, no test dependency | Confirmed. No `test` script in `package.json:8-15`, and Vitest and PGlite are absent from the lockfile. |
| No PR CI | Confirmed. The only workflow is `.github/workflows/link-health-check.yml`, on a schedule. |
| Versions: vitest 5.0.5, pglite 0.5.13, Node 24 | Confirmed with `npm view`. Local Node is 24.13.1. |
| Harness proves 19 failing, then 35 of 35 | The counts match the harness source: 19 checks in `phase2Checks`, 16 in `regressionChecks`. Not re-run, because this planning step does not run tests. |

**Drift and gaps found:**

1. **The harness applies only 10 of the repo's 23 non-seed SQL files.** It skips
   the `listings_*` column files, `listing_views.sql`, `zip_market_data.sql`,
   `checklist_progress.sql`, `functions.sql`, and all four April migrations. That was fine for one
   table, but it is not fine for a reusable setup. See decision 3.
2. **`supabase/migrations/20260419_security_rls.sql` cannot run after `schema.sql`.** It re-creates
   policies that `supabase/schema.sql:368-389` already creates. That is audit item 14, and the setup
   must skip the file.
3. **`supabase/functions.sql:100-110` adds triggers that call PostGIS** on any listing row with
   `lat` and `lng`. `supabase/listings_radius.sql` is a `LANGUAGE sql` function, so its body is
   checked when created. Both must be skipped without PostGIS.
4. **Harness fixtures are inserted before the profile migrations**, so its backfill runs
   (`profile-privacy-harness.mjs:47`). A reusable setup should not work this way. See decision 5.
5. **The harness `service role reads all rows` check expects exactly 5 rows** and passes only because
   it runs before the signup check adds 2 users. Order dependence has to go. See Phase 1.

**Corrections to what the project docs say** (not for this ticket to change):

- `CLAUDE.md` says the GitHub repo is private. The GitHub API reports `private: false`.
- `main` has no branch protection (the API returned 404).

## 3. Decisions and assumptions

**Reuse.** Adopt Vitest and PGlite, both approved. Wrap them in a small repo-owned setup, built from
the existing harness rather than written fresh. No other dependency is added.

- `@electric-sql/pglite-postgis` exists on npm (0.2.13), which might remove the PostGIS workaround.
  It was not approved and no ticket needs it yet, so it stays out. Item 10 is the first ticket
  that might want it.
- `@nuxt/test-utils`, component tests, ESLint and typecheck stay out, as already agreed.

**Decisions made here:**

1. **Tests live in `tests/db/` at the repo root, with Vitest and PGlite as root dev dependencies.**
   The SQL they test sits in `supabase/`, which is not a workspace. Route tests can later add
   a Vitest project for `apps/web`, and that second use is when any shared structure gets designed.
2. **A database per test file.** Each file calls `createTestDatabase()` in `beforeAll`. PGlite's
   `clone()` is the documented way to speed this up, but it stays out until startup time is measured
   as a real problem.
3. **The setup applies every schema file that can run, in `MIGRATION_CHECKLIST.md` order.** Items 2
   to 5 are about messages, transactions and foreign keys, so a partial schema could pass or fail
   for the wrong reason. Order and skips are listed in Phase 1.
4. **A guard test covers the file list.** Any `.sql` file in `supabase/` or `supabase/migrations/`
   that is neither applied nor explicitly skipped fails the suite, so a new migration can't be
   silently left out of testing.
5. **Fixtures load after all SQL has run.** The name backfill was a one-time data change and has
   already run on production, so it no longer needs coverage. Signup coverage of `full_name` stays.
   This drops the backfill's implicit coverage on purpose.
6. **Two phases, tests before CI.** Phase 1 is useful alone and Phase 2 needs `npm test` to exist.
7. **`npm ci --ignore-scripts` in CI.** The tests need no Nuxt. `apps/web/package.json:10` runs
   `nuxt prepare` after install, and this avoids that and `husky` in the `prepare` script. It also
   stops dependency install scripts from running in CI.
8. **No branch filter on the workflow.** Filtering to `main` would skip stacked pull requests, whose
   base is another branch.

**Assumptions:**

- `listing_views.sql`, `zip_market_data.sql`, `checklist_progress.sql`, the `listings_*` column files
  and the three applied April migrations have never been run on PGlite. A search found no PostGIS or
  Supabase-only features in them, but Phase 1 is where that gets proven.
- The test-first direction is agreed, but no wording is approved. **This plan adds no standing rule**
  to `CLAUDE.md` or any rule file.

**Teaching note: what these tests can and can't prove.** PGlite is real Postgres compiled to run
inside Node. The setup fakes the Supabase parts: the `anon` and `authenticated` roles, `auth.users`,
`auth.uid()` and default grants. So a pass proves what the repo's SQL does under those fakes. It says
nothing about what production has. Production checks stay part of every fix.

## 4. Phase overview

1. **Test harness and profile privacy suite.** Adds Vitest, PGlite, the reusable setup, the 35 tests
   and `npm test`. Depends on nothing.
2. **Pull request check.** Adds the GitHub Actions workflow and proves it goes red. Depends on Phase 1.

## 5. Phases

### Phase 1: test harness and profile privacy suite

**Goal.** Anyone can run `npm test` and get a meaningful result against the real SQL. It stands alone
because local tests are useful before CI exists, and item 2 could start from it.

**Changes**

- `package.json`
  - Add `vitest@^5.0.5` and `@electric-sql/pglite@^0.5.13` to root `devDependencies`, using
    `npm i -D` at the root with no `-w` flag.
  - Add scripts `"test": "vitest run"` and `"test:watch": "vitest"`.
  - Add `"tests/**/*.ts": ["prettier --write"]` to `lint-staged`. The current patterns at
    `package.json:24-29` would not format the new directory.
- `package-lock.json`: updated by the install. Check it still contains `linux-x64` entries, because
  CI runs on Linux and this lockfile is generated on Windows.
- `vitest.config.ts` (new, repo root):

  ```ts
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
      test: {
          include: ['tests/**/*.test.ts'],
          // Starting PGlite and applying the schema takes far longer than Vitest's default.
          hookTimeout: 30_000,
      },
  })
  ```

  Vitest 5 no longer searches parent directories for a config, so tests run from the repo root.

- `tests/db/support/schema-files.ts` (new): two exported lists, in order.

  **Applied, in this order:**

  1. `schema.sql` (PostGIS swapped out)
  2. `listings_features.sql`
  3. `listings_terrain.sql`
  4. `listings_more_fields.sql`
  5. `listings_dedupe.sql`
  6. `messages_kinds.sql`
  7. `messages_flagged.sql`
  8. `notifications.sql`
  9. `listing_views.sql`
  10. `profiles_welcomed_at.sql`
  11. `zip_market_data.sql`
  12. `checklist_progress.sql`
  13. `listings_rls.sql`
  14. `messages_rls.sql`
  15. `transactions_rls.sql`
  16. `migrations/20260421_cascade_fixes.sql`
  17. `migrations/20260421_message_indexes.sql`
  18. `migrations/20260421_three_quarter_baths.sql`
  19. `migrations/20261030_profiles_names_and_rows.sql`
  20. `migrations/20261030_profiles_column_privileges.sql`

  The April migrations are not in `MIGRATION_CHECKLIST.md`, so their position here is a judgment
  call: after the files they alter and before the 2026-10-30 migrations, which must run last.

  **Skipped, each with its reason in the file:**

  | File | Reason |
  | --- | --- |
  | `functions.sql` | Triggers call PostGIS on listing inserts |
  | `listings_radius.sql` | Body needs PostGIS at creation |
  | `migrations/20260419_security_rls.sql` | Duplicates policies already in `schema.sql` (item 14) |
  | `seed.sql` | Seed data |
  | `seed_listings.sql` | Seed data |
  | `seed_mock_listings.sql` | Seed data, needs PostGIS |
  | `seed_test_listings.sql` | Seed data, needs PostGIS |

- `tests/db/support/database.ts` (new): from `profile-privacy-harness.mjs`, with the hardcoded repo
  path replaced by a path resolved from `import.meta.url`.
  - `createTestDatabase()`: runs the Supabase stand-in block (harness lines 19-32), then applies the
    list, rethrowing any failure with the file name in the message.
  - `as(db, role, userId, sql)`: harness lines 77-88, unchanged in behaviour.
  - `isDenied(result)`: harness line 96.
  - The PostGIS swap (harness lines 13-17) is applied to `schema.sql` only.
- `tests/db/support/fixtures.ts` (new): the named users, listings, message and transaction from
  harness lines 48-72, inserted through a `seedPeople(db)` function after the schema is applied.
- `tests/db/profile-privacy.test.ts` (new): the 35 checks as `it` and `it.each` blocks with their
  existing behavior names, grouped into `describe` blocks for hidden columns, reads, rows, writes,
  service role and signup.
  - Move the service role row check to count the fixture users by ID, or otherwise remove the
    dependency on run order.
  - Run signup inserts inside a transaction that rolls back, so they can't affect other tests.
- `tests/db/setup.test.ts` (new):
  - Guard test from decision 4.
  - `as()` really drops privileges: `SELECT current_user` returns `anon`. PGlite connects as a
    superuser, which ignores row rules, so without this check every RLS test could be meaningless.
- `README.md`: a short "Testing" section with the two commands and the PGlite limit from the teaching
  note. It describes the tools only and states no rule about when to write tests.

**Tests.** The phase is the tests. Expected total is 37: the 35 ported checks plus the 2 in
`setup.test.ts`.

**Verification**

1. `npm test`: expect 37 passing. Note the time taken and whether `beforeAll` is near the timeout.
2. **Break it on purpose:** remove `20261030_profiles_column_privileges.sql` from the applied list.
   Expect the 19 column checks to fail. The `setup.test.ts` guard fails too, because the file is now
   unlisted, so expect 20 failures. Restore it.
3. **Break the guard alone:** add an empty `supabase/zz_test.sql`, and confirm the guard names it.
   Delete it.
4. **Break the privilege check:** temporarily remove `SET LOCAL ROLE` from `as()`, and confirm the
   `current_user` test fails. Restore it.
5. `npx prettier --check tests vitest.config.ts`, and `npm ls vite` to confirm one Vite 7 install
   satisfies Vitest (the lockfile has 7.3.2 and the peer range allows it).
6. `npm run build` still succeeds, because the root dependencies changed.

**Safe to merge because** it adds dev dependencies and new files only. No app code or SQL changes,
and nothing runs in production.

**Branch:** `test-infra-vitest-pglite`
**PR title:** Add Vitest and PGlite database tests with profile privacy suite

### Phase 2: pull request check

**Goal.** Every pull request runs `npm test` automatically, so a broken database rule shows on the PR
itself before merge. It stands alone as a single workflow file.

**Changes**

- `.github/workflows/test.yml` (new):

  ```yaml
  name: Tests

  on:
      pull_request:

  permissions:
      contents: read

  jobs:
      test:
          runs-on: ubuntu-latest
          steps:
              - name: Checkout
                uses: actions/checkout@v4

              - name: Setup Node
                uses: actions/setup-node@v4
                with:
                    node-version: 24
                    cache: npm

              - name: Install dependencies
                run: npm ci --ignore-scripts

              - name: Run tests
                run: npm test
  ```

**GitHub mechanics.**

- `pull_request` runs against a temporary merge of the PR branch into its base, so it tests the
  result of merging, not just the branch. It re-runs on every push to the PR.
- A workflow added by a PR runs on that same PR, so this PR tests itself.
- The trigger has no branch filter (decision 8), so stacked PRs are covered.
- The workflow uses no secrets. The repo is public, and PRs from forks don't receive secrets anyway.
- With no branch protection on `main`, a red check warns but doesn't block the merge button.

**Tests.** No new tests. This phase runs the Phase 1 suite somewhere new.

**Verification** (needs a pushed branch and an open PR, each confirmed separately by Missa)

1. The check appears on the PR and passes. Confirm in the log that all 37 tests actually ran on
   Linux, and that `npm ci --ignore-scripts` worked without the skipped scripts.
2. **Break it on purpose:** push a commit that removes the column privileges migration from the
   applied list. Confirm the check goes red with the same 20 failures as local. Revert that commit
   and confirm green.

**Safe to merge because** it only adds a check. It changes nothing deployed, and it can't block
merges until branch protection is turned on.

**Branch:** `test-infra-pr-check`
**PR title:** Run tests on pull requests

## 6. Risks

| Risk | Limit |
| --- | --- |
| A newly loaded SQL file fails on PGlite | Phase 1 reports the file by name. If one can't run, skip it with a reason and flag it, rather than editing the SQL. Changing `supabase/` is out of scope here. |
| Tests pass but production differs | The April migrations are not in the checklist, so production's real state is unconfirmed. Keep a production check in every fix, starting with the `pg_policies` query for item 2. |
| Supabase stand-ins drift from real behavior | The stand-ins are in one block, and the README states the limit. No file loaded today uses `auth.jwt()` or `auth.role()`, so `auth.uid()` is enough for now. |
| Lockfile lacks Linux packages after a Windows install | Checked in Phase 1, and Phase 2's first run proves it. |
| Vitest and PGlite interaction | Not run in this planning step. Library docs were checked for config and `exec`/`query`, but the pair has not been run together. If it fails, stop and raise it before changing the approach. |
| A test passes for the wrong reason | Each phase includes break-it-on-purpose checks, and `setup.test.ts` covers privilege dropping. |
| CI time on a public repo | Standard GitHub-hosted runners are free for public repos. |

## 7. Out of scope

- **Audit items 2 to 16.** Item 2 is the first fix done test-first.
- **Route, component and end-to-end tests**, ESLint and typecheck (item 13).
- **Fixing `20260419_security_rls.sql`** and the rest of item 14. Skipped here with a reason.
- **Any standing test-first rule.** That needs Missa's approval of the wording.
- **`format:check` in CI.** Whether the repo currently passes it is unknown.
- **Turning on branch protection.** This is a repo settings change for Missa to decide. Without it,
  a red check does not stop a merge. Recommended once the check has proved stable.

**Pre-existing problems found, each for its own ticket:**

- **`CLAUDE.md` calls the repo private, but it is public.** Check that this is intended. The local
  `.env` is gitignored, and the audit's history scan covered only three token patterns.
- **`Paperwork Link Health Check` is dead.** GitHub shows it as `disabled_inactivity`. Its last 5
  runs, up to 2026-07-24, all failed, and the logs have expired, so the cause is unknown. It also
  uses Node 20.
- **`MIGRATION_CHECKLIST.md` omits the four April migrations**, in addition to the
  `checklist_progress.sql` gap already in item 14.

## Recommendation

Start with Phase 1. Its break-it-on-purpose checks are what make every later green result trustworthy.

## Progress

- **Phase 1: done, merged as PR #4.** Branch `test-infra-vitest-pglite`, based on `main` at 3bfc4db.
  Added Vitest 5.0.5, PGlite 0.5.13, `npm test`, `npm run test:watch`, `vitest.config.ts`,
  `tests/db/` (reusable setup, 35 ported checks, 2 setup checks) and a README Testing section. All
  20 listed SQL files applied on PGlite with no new skips. Deviations from the plan:
  - `as()` drops the harness's unused `affected` field.
  - Some assertions are stricter than the harness: `anon lists only the active seller` checks the
    ID, the service role read checks the seller's contact values, and signup compares the rows.
  - `schema-files.ts` also exports `SUPABASE_DIR`, and `database.ts` exports the `Role` and
    `QueryResult` types.
  - The install also moved `es-module-lexer` 2.0.0 to 2.3.2 and `tinyexec` 1.1.1 to 1.3.1, which
    Nuxt tooling shares. `npm run build` still succeeds.
- **Phase 2: done, merged as PR #5.** Branch `test-infra-pr-check`, based on `main` at
  b799204. Added `.github/workflows/test.yml` exactly as planned. Check runs on Linux: 41098933635
  passed 37, 41099284672 failed 20 with the migration removed on purpose (6454d01), and 41099405691
  passed 37 after the revert (acde8f9).

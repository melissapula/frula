# Investigation: address field validation

## 1. Task

Original task text, verbatim:

> adding validation to address fields

**Restatement.** The sell form (`/sell`, both new and `?edit=<id>`) accepts any non-empty text for street address, city and ZIP. Add validation so malformed values are caught before they are saved, and add a database-side rule so the same values can't be saved by any other path. The trigger was a production listing saved with city `Tecopa, CA`. That listing also failed to geocode, so it has no map pin.

**Definition of done (proposed, needs confirming in Open questions):**
- The sell form normalizes the address fields (trims whitespace, strips trailing commas) and rejects malformed values. Each failing field shows a message next to it, and Publish stays disabled until they're fixed.
- A migration adds `CHECK` constraints on `public.listings` for ZIP format, state code and city shape. A direct Supabase write that breaks them fails.
- DB tests in `tests/db/` prove the constraints reject bad values and accept good ones. Unit tests prove the client rules.
- The existing production rows that break the new rules are fixed, with Missa's approval, before the constraints are validated.

**Ambiguity in the task itself:**
- "Validation" could mean **format** checks (shape of ZIP, no state in the city field) or **verification** that the address really exists. Verification is a geocoding problem: Nominatim fails on real addresses, and the US Census geocoder succeeded on 3 of 4 failures. This report covers format checks and treats verification as a separate ticket (Open question 1).
- "Address fields" could mean only street/city/ZIP, or also state and county. State is already a `<select>` (`apps/web/app/pages/sell.vue:47`). County is optional free text (`apps/web/app/pages/sell.vue:64-71`).

## 2. Where it lives

| File | Role |
|---|---|
| `apps/web/app/pages/sell.vue` | The only UI that creates or edits listings: form, required-field gate, geocode call, insert/update |
| `apps/web/app/components/Field.vue` | Label wrapper for each input; renders the red `*` for required fields; no error slot |
| `apps/web/app/composables/useStates.ts` | `US_STATES` list (50 states + DC) used by the State select |
| `apps/web/server/api/geocode.get.ts` | Nominatim proxy the form calls with the joined address string |
| `apps/web/app/utils/captcha.ts` | Only existing client utility module; the pattern a new `address.ts` utility would follow |
| `supabase/schema.sql` | `public.listings` definition; address columns are bare `TEXT NOT NULL` |
| `supabase/listings_dedupe.sql` | Partial unique index on the normalized address for active listings |
| `supabase/listings_rls.sql` | Owners may insert and update their own listings directly from the browser |
| `supabase/migrations/` | Dated migrations; a new constraint migration goes here |
| `tests/db/support/schema-files.ts` | Ordered list of SQL files the PGlite test DB applies; a new migration must be added |
| `tests/db/support/fixtures.ts` | Seeds three listings used across DB tests; must still satisfy the new constraints |
| `vitest.config.ts` | Two test projects (`db`, `routes`); no project for plain unit tests yet |

## 3. How it works today

**High level.** The browser writes listings straight to Supabase through the client SDK. No Nuxt server route sits between the form and the database. So the only validation today is (a) HTML `required` plus a non-empty check in the browser, and (b) `NOT NULL` in the database. Client-side checks alone can always be bypassed by calling Supabase directly with the user's own session, so a real rule has to live in the database.

**Form fields.**
- Street address: `<input type="text" required>` bound to `form.address` (`apps/web/app/pages/sell.vue:27-35`).
- City: `<input type="text" required>` bound to `form.city` (`apps/web/app/pages/sell.vue:37-45`).
- State: `<select required>` over `US_STATES` codes (`apps/web/app/pages/sell.vue:46-53`). The browser can only pick a listed code, though a direct write can send anything.
- ZIP: `<input type="text" required placeholder="12345">` with no `pattern`, `maxlength` or `inputmode` (`apps/web/app/pages/sell.vue:54-62`).
- County: optional text (`apps/web/app/pages/sell.vue:64-71`).
- `Field.vue` renders only a label and a slot (`apps/web/app/components/Field.vue:1-14`). There is no place for a per-field error message.

**Submit gate.** `canSubmit` checks only that address, city, state and zip are non-empty after `trim()`, plus a positive price (`apps/web/app/pages/sell.vue:646-656`). It disables the button (`apps/web/app/pages/sell.vue:403-404`), and `submit()` re-checks it (`apps/web/app/pages/sell.vue:663`).

**Geocode.** `submit()` joins `${address}, ${city}, ${state} ${zip}` and calls `/api/geocode` (`apps/web/app/pages/sell.vue:679-683`). A city of `Tecopa, CA` therefore produces `..., Tecopa, CA, CA 92389`. On failure it sets `lat`/`lng` to null and shows `geoWarning` (`apps/web/app/pages/sell.vue:686-690`, message at `:386-392`). The route itself only checks that `q` is non-empty (`apps/web/server/api/geocode.get.ts:28-31`).

**Save.** The payload copies `form.address`, `city`, `state` and `zip` **untrimmed** (`apps/web/app/pages/sell.vue:692-696`). Edit runs `.update(payload)` (`:739-745`) and new listings run `.insert(...)` (`:771-780`). The only address-specific error handling maps `23505` (the duplicate-address unique index) to a friendly message (`:748-750`, `:784-786`). Every other DB error shows the raw `message` (`:752`, `:788`).

**Database.**
- `address TEXT NOT NULL`, `city TEXT NOT NULL`, `state TEXT NOT NULL DEFAULT 'MN'`, `zip TEXT NOT NULL`, `county TEXT` (`supabase/schema.sql:49-53`). These columns have no `CHECK`. Other columns in the same table do use `CHECK`, for example `status` (`supabase/schema.sql:45-46`) and `property_type` (`:61`).
- The dedupe index normalizes with `lower(trim(address))`, `lower(trim(city))`, `upper(trim(state))`, `trim(zip)` (`supabase/listings_dedupe.sql:11-17`). It works around the untrimmed values rather than preventing them.
- RLS lets an owner insert and update their own rows with only a `user_id = auth.uid()` check (`supabase/listings_rls.sql:16-29`). Any shape of address passes.

**Other writers.** Searching the repo for `listings` inserts and updates turned up only `sell.vue` (`:740`, `:772`), the SQL seed files (`supabase/seed_listings.sql:81`, `supabase/seed_mock_listings.sql`, `supabase/seed_test_listings.sql`) and the DB test fixtures (`tests/db/support/fixtures.ts:32-35`). `apps/api/` does not exist on disk, even though `CLAUDE.md` describes it.

**Production data (read-only check run 2026-11-10).** I ran a service-role `select` of every `listings` row (7 rows, all `active`) against candidate rules. The rules fired on real rows, so the check itself is working:
- ZIP not `^\d{5}(-\d{4})?$`: 0 rows.
- State not a known code: 0 rows.
- City contains a comma: 2 rows. `b30b70a9…` has `Tecopa, CA`. `dc28eed8…` has city `Alabaster,` and address `114 Saddle Lake Dr,`.
- City ends with a two-letter state code: 1 row (`b30b70a9…`).
- Leading or trailing whitespace: 1 row (`57627130…`, `13109 Lola Drive ` / `Spring Hill `).
- Address with no digit: 0 rows. Length over 100: 0 rows.

## 4. What needs to change

In order:

1. **New `apps/web/app/utils/address.ts`.** Pure functions, auto-imported by Nuxt like `captcha.ts`:
   - `normalizeAddress(form)` returns new trimmed values with internal runs of spaces collapsed and trailing commas stripped from address and city. It returns new values and leaves the input alone.
   - `validateAddress(values)` returns `{ address?, city?, zip? }` error strings. Proposed rules:
     - ZIP must be `^\d{5}(-\d{4})?$`.
     - City must not contain a comma or digits, and must not end in a two-letter state code. That third rule needs care, see Risks.
     - Address must be at most 100 characters and include at least one letter.
     - State must be in `US_STATES`.
     - Named constants for the regexes and limits.
2. **`apps/web/app/components/Field.vue`.** Add an optional `error?: string` prop that renders a small red message under the slot, linked to the input by `aria-describedby`, or give the label an accessible error. This keeps the change in one place for every field.
3. **`apps/web/app/pages/sell.vue`.**
   - Compute `addressErrors` from `validateAddress(normalizeAddress(form))` and pass each one to its `Field`.
   - Show errors only after the field loses focus or after a submit attempt, so users don't see red while typing.
   - Fold "no address errors" into `canSubmit` (`:646-656`).
   - Build the payload from the normalized values (`:692-696`), and the geocode query (`:680`) from them too.
   - Add `inputmode="numeric"`, `autocomplete="postal-code"`, `maxlength="10"` to ZIP. Add `autocomplete="address-line1"` and `autocomplete="address-level2"` to street and city.
   - Map the new constraint violation (Postgres `23514`, check_violation) to a friendly message next to the existing `23505` handling (`:748`, `:784`).
4. **New migration `supabase/migrations/2026MMDD_listings_address_checks.sql`.**
   - Add named `CHECK` constraints on `public.listings`:
     - `zip ~ '^\d{5}(-\d{4})?$'`
     - `state IN (...51 codes...)`
     - `city !~ ','`
     - `address = btrim(address)` and `city = btrim(city)`
     - `char_length(address) <= 100`
   - Add them `NOT VALID` so the existing violating rows don't block the migration, then `VALIDATE CONSTRAINT` once those rows are fixed (step 6). Wrap it in `BEGIN/COMMIT` like `supabase/migrations/20261030_messages_lock_writes.sql`.
   - Keep the DB rules a **subset** of the client rules, so anything the form accepts the DB accepts.
5. **Tests.**
   - Add the migration to `APPLIED_FILES` in `tests/db/support/schema-files.ts`, after the 2026-10-30 entries.
   - New `tests/db/listing-address.test.ts`: an owner insert or update with a bad ZIP, a city with a comma, an unknown state or padded whitespace is rejected; a well-formed address is accepted.
   - Existing fixtures (`tests/db/support/fixtures.ts:33-35`) use zip `00000`, no state (so the default `MN`) and city `Town`. They pass the proposed rules, but confirm by running the suite.
   - Add a third Vitest project (`unit`, `tests/unit/**/*.test.ts`) to `vitest.config.ts`, with `tests/unit/address.test.ts` covering `normalizeAddress` and `validateAddress`. Cases: ZIP+4, a `Tecopa, CA` city, trailing commas, multi-word cities like `Winston-Salem` and `St. Paul`, and an empty value.
6. **Production data fix (needs Missa's approval; outward-facing write).**
   - Trim `57627130…`.
   - Strip the trailing commas on `dc28eed8…`.
   - Set the city on `b30b70a9…` to `Tecopa`.
   - Then run `VALIDATE CONSTRAINT`. This also produces a clean geocode string for Tecopa, though both geocoders already failed on it with the corrected city.
7. **Docs.** Add the migration to `supabase/MIGRATION_CHECKLIST.md` if that file still tracks run order.

## 5. Patterns to follow

- **Client utility module:** `apps/web/app/utils/captcha.ts`. Exported constants plus small pure functions with a one-line JSDoc each.
- **Constraint style:** inline `CHECK` on listing columns (`supabase/schema.sql:45-46`, `:61`, `:91-92`). For a migration that tightens an existing table, follow `supabase/migrations/20261030_messages_lock_writes.sql` (a leading comment explaining why, `BEGIN/COMMIT`, idempotent drops).
- **DB test style:** `tests/db/messages-integrity.test.ts`. Named UUID constants, `as(role, userId)` and `isDenied` from `tests/db/support/database.ts`, and table-driven `[label, value]` arrays for the rejected cases.
- **Friendly DB error mapping:** the existing `23505` branches in `apps/web/app/pages/sell.vue:748-750` and `:784-786`.
- **Normalization rules:** match what `supabase/listings_dedupe.sql:11-17` already does (`trim`, case-insensitive), so normalized saves and the dedupe index agree.

## 6. Reuse options

- **Address normalization and format rules (new capability).**
  - Repo: no existing validator. The dedupe index normalizes only in SQL. `US_STATES` can be reused for the state list.
  - Installed dependencies: no schema library. `zod` is not installed (`npm ls zod` is empty) and no server route uses `readValidatedBody`/`getValidatedQuery`.
  - Package: `zod` 4.6.7, MIT, last published 2026-10-12 (`npm view`). It would work but adds a dependency for five regex checks.
  - Open source: not searched. A US ZIP regex and a trim are standard and need no port.
  - **Recommendation: build.** The rules are a handful of named regexes. A small pure module is simpler to read and to defend than a new dependency. If a server route ever starts validating listing input, revisit zod then, since project rules call for `readValidatedBody` with a schema on server routes.
- **Address verification (does it exist):** out of scope here. The Census geocoder is a candidate for a separate ticket (Open question 1).
- **Per-field error UI:** extend `Field.vue` (repo). Nothing new to adopt.

## 7. Risks and blast radius

- **Constraints block existing rows.** Three active production rows break the proposed rules. Without `NOT VALID`, the `ALTER TABLE` fails. With `NOT VALID`, updates to those rows will still be checked, so those sellers would see an error on their next edit until the data is fixed. Fix the data before or right after the migration.
- **Edit mode re-runs geocoding.** Every save re-geocodes and overwrites `lat`/`lng` with null on failure (`apps/web/app/pages/sell.vue:677-698`). Three listings were backfilled with Census coordinates on 2026-11-10 because Nominatim can't find them. If their sellers save an edit, the pins disappear again. Validation work touches this same block, so don't make it worse. Fixing it is listed under Pre-existing problems.
- **Over-strict city rules.** "Ends with a two-letter state code" could reject a real city whose last word is two capital letters. None is known, but it's untested against a full list of places. Keep that rule client-only (a soft prompt), and keep the DB rule to "no comma".
- **State list is shared.** `US_STATES` feeds `ListingFilters.vue:88`, `dream-home.vue:71` and the paperwork pages (`paperwork/[slug].vue:212`, `paperwork/index.vue:196`). Read it in the validator, but don't change it in this ticket. A DB `state IN (...)` list duplicates it, so changing one means changing the other.
- **Territories.** The `useStates.ts:1-4` comment says "states and territories", but the list has only 50 states + DC. A `CHECK` written from it would block Puerto Rico and other territories. That's consistent with today's form, but it becomes a database rule (Open question 3).
- **Drafts in localStorage.** `loadDraft` restores old form values (`apps/web/app/pages/sell.vue:528-539`). A restored draft may now fail validation. That's fine, but errors should only show after a blur or submit so a restored draft doesn't open full of red.
- **ChoreQuest shares the Supabase project.** The migration touches only `public.listings`, which ChoreQuest doesn't use (inferred from the table name and the project memory note). Check before running.
- **Security note.** This is user input bound for a database. Supabase parameterizes the values, so there is no injection path. The real risk is a direct API call bypassing client checks, which is exactly why the DB constraints matter.

## 8. Verified vs. inferred

**Verified by reading code or running a read-only check:**
- Every `path:line` in sections 2-4.
- Only `sell.vue`, seed SQL and test fixtures write `listings`, found by searching the repo for insert/update/`INSERT INTO`.
- `apps/api/` is absent (`Get-ChildItem` failed on the path).
- zod isn't installed (`npm ls zod`), and zod's current version and license (`npm view`).
- Production data violations (service-role read-only select, 2026-11-10; nothing written). The rules flagged real rows, so the checker isn't passing everything.

**Inferred, not confirmed:**
- That Nuxt 4 auto-imports `app/utils/address.ts` the same way it does `captcha.ts`. That's how `captcha.ts` gets used, but I didn't trace it.
- That the PGlite test DB enforces regex `CHECK`s the same as production Postgres. PGlite is Postgres, but no test has run yet.
- That Supabase returns code `23514` through the JS client for a check violation. That's standard Postgres, but I didn't see it in this app.
- That the existing DB tests still pass with the new constraints. The fixtures look compliant, but no tests were run (investigation is read-only).
- That ChoreQuest doesn't read `public.listings`.
- That `MIGRATION_CHECKLIST.md` is still the source of truth for run order. It's referenced by `tests/db/support/schema-files.ts:5`, but I didn't read it in full.

## 9. Open questions

1. **Format checks only, or also verify the address exists?** Recommendation: format checks only in this ticket. Make "Census-first geocoding in `geocode.get.ts`" its own ticket, since that is what actually puts pins on the map.
2. **Enforce in the database too, or the form only?** Recommendation: both. The browser writes straight to Supabase, so form-only rules can be bypassed. Keep the DB rules looser than the form's.
3. **Allow US territories (PR, GU, VI, AS, MP)?** Recommendation: no change in this ticket. Write the DB list from today's `US_STATES`, and record territories as a product decision. The "national" positioning arguably covers them.
4. **Approve fixing the 3 production rows** (`57627130…` trim, `dc28eed8…` trailing commas, `b30b70a9…` city → `Tecopa`)? Recommendation: yes, right after the migration and before `VALIDATE CONSTRAINT`.
5. **Add a `unit` Vitest project?** It changes the test setup, so it's your call. Recommendation: yes. Pure rules are best tested without PGlite or a Nuxt build.

## 10. Pre-existing problems (separate tickets)

- **Editing a listing can wipe its map pin** (should fix). A failed geocode on edit writes `lat: null, lng: null` (`apps/web/app/pages/sell.vue:677-698`). Because the `listings_sync_location` trigger only fires when coordinates are non-null (`supabase/functions.sql:105-109`), `location` keeps the old point. So the map loses the pin while radius search still finds the listing. On edit it should keep the existing coordinates when the address is unchanged or the geocode fails.
- **The geocode warning is barely visible** (should fix). `geoWarning` is set (`apps/web/app/pages/sell.vue:689`), then the page redirects 1.5 s later (`:820-823`) under a "Listing published!" toast.
- **Nominatim misses real US addresses** (should fix). Census-first geocoding is proposed in project memory note `project_geocoding_gaps.md`.
- **The DB default state is `MN`** (`supabase/schema.sql:51`). The form always sends a state, but a write that omits it becomes Minnesota. That conflicts with the national-from-day-one rule.
- **`FULL_COVERAGE_STATES = ['MN']`** gates the transaction page and CMA route (`apps/web/app/composables/useStates.ts:63`, `apps/web/app/pages/transaction/[id].vue:149`, `apps/web/server/api/cma/[id].get.ts:35`). That's state privilege, which `CLAUDE.md` forbids.
- **`useStates.ts` comment says "states and territories"** but lists only states + DC (`apps/web/app/composables/useStates.ts:1-4`).
- **`CLAUDE.md` describes `apps/api/` (NestJS)**, which is no longer in the repo. It also says Nuxt 3, while `apps/web/package.json` has `nuxt ^4.4.2`.
- **Leftover debug logging** (nit). `console.log` of the photo count is left in committed code (`apps/web/app/pages/sell.vue:795-796`).
- **Photo errors are logged and ignored** (should fix). Photo delete and insert failures are logged and the flow continues to a success toast (`apps/web/app/pages/sell.vue:765-768`, `:805-808`).

## Recommended approach

Do it test-first in one branch off `main`, in this order:
1. Write `tests/unit/address.test.ts` against a stub `address.ts` and watch it fail, then implement the utility.
2. Write `tests/db/listing-address.test.ts` and watch it fail on the current schema. Before trusting it, break one constraint on purpose to confirm the test catches it. Then add the `NOT VALID` migration and register it in `schema-files.ts`.
3. Update `Field.vue` and `sell.vue` to show errors and save the normalized values. Check it by hand on `/sell` at 375 px with the `Tecopa, CA` case.
4. After review and Missa's approval, run the migration in production, fix the 3 rows, then `VALIDATE CONSTRAINT`.

Keep the edit-mode coordinate wipe and the Census geocoder in their own tickets, even though they sit in the same `submit()` block.

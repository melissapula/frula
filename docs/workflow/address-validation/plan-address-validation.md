# Plan: address validation

## 1. Task

Original task text, verbatim:

> adding validation to address fields

Scope as decided on 2026-11-10 (see Decisions). It covers **format** checks in the form and in the database, plus **verification** that the address can be found on a map. When an address can't be verified, the seller is warned and must confirm before it publishes. Nothing is hard-blocked.

**Definition of done:**

- The sell form (`/sell` and `/sell?edit=<id>`) normalizes street, city and ZIP. That means trimming, collapsing repeated spaces, and stripping trailing commas. It rejects malformed values with a message under each failing field, and Publish stays disabled until they're fixed. Errors show only after a field loses focus or after a submit attempt.
- Named `CHECK` constraints on `public.listings` reject a bad ZIP, an unknown state, a comma in the city, padded whitespace, and an address over 100 characters. A direct Supabase write that breaks them fails, and the form maps that failure (`23514`) to a friendly message.
- The 3 known bad production rows are fixed before the constraints go on.
- `/api/geocode?kind=address` tries the US Census geocoder first and falls back to Nominatim. Calls without `kind` (the browse "near" search) behave as today.
- Before saving, the sell form verifies the address. If no geocoder matches, an in-app dialog asks the seller to publish without a map pin or go back and check the address.
- Editing a listing no longer wipes its map pin. When the address is unchanged, the existing coordinates are kept. When it changed and can't be verified, the old pin is cleared rather than left at the wrong house.
- Unit tests cover the pure rules, DB tests cover the constraints, and route tests cover the geocoder fallback.

## 2. Source

Investigation: `investigation-address-validation.md`.

**Spot-check (2026-11-10). Every reference I opened still matches:**

- `apps/web/app/pages/sell.vue`: street, city, state, ZIP and county inputs at `:27-71`. `geoWarning` block at `:386-392`. Submit button gate at `:403-404`. `canSubmit` at `:646-656`. Geocode block at `:677-690`. Untrimmed payload at `:692-696`. `23505` branches at `:748-753` and `:784-789`. `console.log` at `:795-796`. Redirect timer at `:820-823`.
- `apps/web/app/components/Field.vue:1-14`: a label and a slot, nothing else.
- `supabase/schema.sql:49-53`: bare `TEXT NOT NULL` address columns, with `DEFAULT 'MN'` on state. There are `CHECK` examples at `:45-46` and `:61`.
- `tests/db/support/schema-files.ts:7-31`: the 2026-10-30 migrations are last.
- `tests/db/support/fixtures.ts:32-35`: the three listings use zip `00000`, city `Town` and the default state.
- `vitest.config.ts`: two projects, `db` and `routes`.
- `apps/web/app/composables/useStates.ts`: the comment at `:1-4` says "states and territories". The file has no imports, so tests can import it directly.
- `apps/web/server/api/geocode.get.ts`: Nominatim only, a hard-coded URL, raw `getQuery` at `:28`, and a 10/min per-IP limit at `:19-26`.

**What the investigation didn't cover (verification was out of its scope). Found while planning:**

- `/api/geocode` has a second caller, the browse "near" search (`apps/web/app/components/ListingFilters.vue:684-702`). It sends free text like `Bemidji, MN`, which the Census street-address endpoint can't match. So Census-first must be opt-in, not the default.
- The edit loader doesn't select `lat`/`lng` (`apps/web/app/pages/sell.vue:576-584`). The pin-wipe fix has to add them.
- `listings_sync_location` fires only when both coordinates are non-null (`supabase/functions.sql:105-109`). Clearing a pin therefore means sending `location: null` along with null `lat`/`lng`.
- Outbound service URLs are made testable through `runtimeConfig` plus `NUXT_*` env overrides. See `resendApiUrl` (`apps/web/nuxt.config.ts:48`) and the fakes in `tests/routes/support/test-env.ts:7-31` and `tests/routes/support/fake-services.ts`. The geocoder URLs follow the same pattern.
- An in-app confirm dialog already exists: `useDialog().confirm` (`apps/web/app/composables/useDialog.ts:49-51`, PR #7). Reuse it for "publish without a map pin".

None of this invalidates the investigation.

## 3. Decisions and assumptions

**Open questions, answered by Missa on 2026-11-10:**

1. **Format or verification:** both. This goes **against** the investigation's recommendation, so Census-first geocoding moves into this plan (Phases 3-4).
2. **Database enforcement:** yes. The DB rules are a looser subset of the form's rules.
3. **US territories:** no change. The DB state list is built from today's `US_STATES` (50 states + DC), and territories are logged as a product decision.
4. **Production row fix:** approved. It runs before the constraints are added (Phase 2 rollout).
5. **`unit` Vitest project:** approved (Phase 1).
6. **Unverified address behavior (new question):** warn and confirm. An unmatched address can still publish after an explicit confirm.
7. **Edit-mode pin wipe (new question):** fold it into this plan (Phase 4) instead of a separate ticket.

**Reuse:**

- Format rules: **build** a small pure module, `apps/web/app/utils/address.ts`. No zod, no new dependency. This follows the investigation's Reuse options.
- Per-field errors: **extend** `Field.vue`.
- "Publish without a pin" confirm: **reuse** `useDialog().confirm`.
- Census geocoder: an HTTP call with `$fetch`, which needs no package and no API key. **No new dependency** anywhere in the plan.
- Query validation in `geocode.get.ts`: `getValidatedQuery` with a plain validator function (h3 accepts one), because zod isn't installed. Confirm the signature in the installed h3 version.

**Assumptions to confirm during implementation:**

- **Constraints are added validated, not `NOT VALID`.** This is a deviation from the investigation, which proposed `NOT VALID` followed by `VALIDATE CONSTRAINT`. The data fix is approved and runs first, so a plain `ADD CONSTRAINT` is one step instead of two. If a bad row slipped in between the fix and the migration, the transaction fails and changes nothing. You rerun the fix select and try again. That failure is safe and loud.
- **Edit when the address changed and nothing matches: clear the pin, don't keep it.** Option 7 said "keep the existing coordinates when the address is unchanged or the geocode fails". Keeping old coordinates after a *changed* address would put the pin on the previous house, so this plan clears them (after the seller confirms). The coordinates are kept whenever the address is unchanged.
- **Edit with the address unchanged and already unpinned (for example Tecopa):** the form retries the geocode. On success it writes the pin. On failure it saves without a dialog, since the seller already accepted an unpinned listing.
- **Census API details (endpoint, params, response shape, terms) are not confirmed.** From memory: `GET /geocoder/locations/onelineaddress?address=…&benchmark=Public_AR_Current&format=json`, returning `result.addressMatches[0].coordinates.{x: lng, y: lat}` and `matchedAddress`, US-government public data, free. Check the official Census Geocoding Services docs before writing the code. Also confirm that storing results is allowed. The project memory note says Mapbox's free tier forbids storing, so this is worth checking explicitly.
- Nuxt auto-imports `apps/web/app/utils/*.ts`. The unit tests import `address.ts` directly, so `address.ts` imports `US_STATES` with an explicit relative import (`../composables/useStates`) and works outside Nuxt.
- PGlite enforces regex `CHECK`s like production Postgres, and supabase-js passes `23514` through on `error.code`. Phase 2's tests and hand check confirm both.
- ChoreQuest doesn't use `public.listings`. Check before running the Phase 2 migration (see project memory `project_shared_supabase_chorequest.md`).

## 4. Phase overview

1. **Address format rules in the sell form.** Client only, plus the `unit` Vitest project. Depends on nothing.
2. **Database `CHECK` constraints on listing addresses.** Includes the production data fix and `23514` handling. Depends on Phase 1 being **deployed** before the migration runs.
3. **Census-first geocoding, opt-in via `kind=address`.** Server route plus route tests. Depends on nothing (it can run alongside 1-2).
4. **Verify the address before saving, and stop the edit pin wipe.** Sell form plus a pure coordinates helper. Depends on Phases 1 and 3.

## 5. Phases

### Phase 1: Address format rules in the sell form

**Goal.** Catch malformed addresses in the form and save normalized values. This stands alone: users get immediate feedback, the saved data gets cleaner, and the database still accepts everything it does today.

**Changes.**

- `vitest.config.ts`: add a third project, `{ name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] }`.
- New `apps/web/app/utils/address.ts`, modeled on `apps/web/app/utils/captcha.ts` (exported constants, small pure functions, a one-line JSDoc each):
  - Constants: `ZIP_PATTERN = /^\d{5}(-\d{4})?$/`, `ADDRESS_MAX_LENGTH = 100`, `CITY_ENDS_IN_STATE_PATTERN` (last word is two capitals), and the message strings.
  - `interface AddressFields { address: string; city: string; state: string; zip: string }`.
  - `normalizeAddress(fields: Readonly<AddressFields>): AddressFields` returns new values. It trims, collapses internal whitespace runs, and strips trailing commas from address and city. State is uppercased and trimmed, ZIP trimmed. This matches `supabase/listings_dedupe.sql:11-17`.
  - `validateAddress(fields: Readonly<AddressFields>): AddressErrors`, where `AddressErrors` is `{ address?, city?, state?, zip? }`:
    - ZIP must match `ZIP_PATTERN`.
    - City must not contain a comma or a digit, and must not end in a two-letter state code. That third rule is **client-only** because of the over-strict risk, and its message suggests picking the state from the menu.
    - Address must be at most 100 characters and contain a letter.
    - State must be a code in `US_STATES`.
    - An empty field gets a "required" message.
  - `hasAddressErrors(errors: AddressErrors): boolean`.
- `apps/web/app/components/Field.vue`: add an optional `error?: string` prop. It renders `<p :id class="mt-1 text-xs text-red-600">` under the slot with a stable generated id, exposed through a slot prop so the input can bind `aria-describedby` and `aria-invalid`.
- `apps/web/app/pages/sell.vue`:
  - `const normalizedAddress = computed(() => normalizeAddress(form))` and `const addressErrors = computed(() => validateAddress(normalizedAddress.value))`.
  - Track `touched` per field (set on `@blur`) and a `hasTriedSubmit` ref. Pass `:error` to each address `Field` only when that field is touched or a submit was tried, so a restored draft (`:528-539`) doesn't open full of red.
  - `canSubmit` (`:646-656`) also requires `!hasAddressErrors(addressErrors.value)`. The button title (`:404`) changes to "Fix the highlighted fields first" when address errors exist.
  - `submit()`: set `hasTriedSubmit` first. Build the geocode query (`:680`) and the payload (`:693-696`) from `normalizedAddress.value`.
  - ZIP input: `inputmode="numeric"`, `autocomplete="postal-code"`, `maxlength="10"`. Street: `autocomplete="address-line1"`, `maxlength="100"`. City: `autocomplete="address-level2"`. State select: `autocomplete="address-level1"`.

**Tests.** New `tests/unit/address.test.ts`, arrange-act-assert with table-driven cases:

- `normalizeAddress`:
  - trims and collapses spaces (`13109 Lola Drive ` → `13109 Lola Drive`)
  - strips trailing commas (`114 Saddle Lake Dr,` and `Alabaster,`)
  - leaves the input object unchanged
- `validateAddress`:
  - accepts ZIP+4 and five-digit ZIPs; rejects `1234`, `123456`, `12345-12` and `ABCDE`
  - rejects `Tecopa, CA` (comma) and `Tecopa CA` (ends in a state code)
  - accepts `Winston-Salem`, `St. Paul`, `Coeur d'Alene` and `O'Fallon`
  - rejects an address with no letter and one over 100 characters
  - rejects state `XX` and accepts every `US_STATES` code
  - reports required for empty values
- Sanity-check the checker: before implementing, run against a stub that returns `{}` and watch the rejection cases fail.

**Verification.**

- `npx vitest run --project unit`: all pass, and the stub run failed first.
- `npm test`: the `db` and `routes` projects are unaffected.
- `npm run lint` and `npm run build`.
- By hand: run `npm run dev` and open `/sell` at 375 px.
  - Type `Tecopa, CA` in City and tab out. The error shows, linked by `aria-describedby`, and Publish is disabled.
  - Fix it, and the error clears.
  - Type `1234` in ZIP and tab out. It's rejected, and the numeric keypad shows on a phone emulator.
  - Reload with a saved draft. No red until blur or submit.
  - Before creating any test listing, check which Supabase project `apps/web/.env` points at. If it's production, delete the test listing afterwards.

**Safe to merge because** it's client-only. The database is unchanged and accepts everything the form now sends. Existing listings still load into edit mode, and their errors show only after blur or submit.

**Branch / PR:** `feat/address-format-rules`, "Validate and normalize address fields on the sell form".

---

### Phase 2: Database CHECK constraints on listing addresses

**Goal.** Make the format rules impossible to bypass with a direct Supabase call. This stands alone because the form from Phase 1 already sends values that pass.

**Changes.**

- New `supabase/migrations/20261111_listings_address_checks.sql` (use the actual merge date). It has a leading comment explaining why: the browser writes listings directly, so form checks can be bypassed. Then:
  - `BEGIN; … COMMIT;`, like `supabase/migrations/20261030_messages_lock_writes.sql:4`.
  - For each constraint, `ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS <name>;` followed by `ADD CONSTRAINT <name> CHECK (…);`:
    - `listings_zip_format`: `zip ~ '^\d{5}(-\d{4})?$'`
    - `listings_state_code`: `state IN (…the 51 codes from US_STATES…)`
    - `listings_city_no_comma`: `city !~ ','`
    - `listings_address_trimmed`: `address = btrim(address)`
    - `listings_city_trimmed`: `city = btrim(city)`
    - `listings_address_length`: `char_length(address) <= 100`
  - A comment above `listings_state_code` says it mirrors `apps/web/app/composables/useStates.ts`, and that changing one means changing the other.
- `tests/db/support/schema-files.ts:30`: append `'migrations/20261111_listings_address_checks.sql'` after the 2026-10-30 entries.
- `supabase/MIGRATION_CHECKLIST.md`: add item 23 under a new heading, "Listing address rules (run after message integrity)". Renumber the seed items to 24-25. The ⚠️ note says to deploy the Phase 1 form first, run the data fix below, check that the select returns no rows, and then run the migration. Include the one-time fix, in the same style as the `notified_at` block (`:90-93`):

  ```sql
  -- 1. Dry run: expect exactly 3 rows (57627130…, dc28eed8…, b30b70a9…).
  select id, address, city, zip, state from public.listings
  where address <> btrim(address) or city <> btrim(city)
     or address ~ ',\s*$' or city ~ ','
     or zip !~ '^\d{5}(-\d{4})?$' or char_length(address) > 100;

  -- 2. Fix.
  update public.listings set address = btrim(rtrim(address, ', ')), city = btrim(rtrim(city, ', '))
  where address <> btrim(rtrim(address, ', ')) or city <> btrim(rtrim(city, ', '));
  update public.listings set city = 'Tecopa'
  where id::text like 'b30b70a9%' and city = 'Tecopa, CA';

  -- 3. Re-run the dry run: expect 0 rows. Then run the migration.
  ```

  Step 1 is also the checker sanity check: it must return the 3 known rows before the 0-row result can be trusted.
- `apps/web/app/pages/sell.vue`: next to each `23505` branch (`:748`, `:784`), add `else if (err?.code === '23514')`, which sets `error.value` to "Some address details aren't in a format we accept. Check the street, city, state and ZIP." The constraint name goes only to `console.error`, never to the user. Use a named constant for `'23514'` and, while there, for `'23505'`.

**Tests.** New `tests/db/listing-address.test.ts`, styled after `tests/db/messages-integrity.test.ts` (named UUIDs, `as(role, userId)`, `isDenied`, `[label, value]` tables):

- The owner's insert is rejected for:
  - ZIP `1234`, `ABCDE` and `12345-12`
  - state `XX`, and lowercase `mn`
  - city `Tecopa, CA`
  - address `' 1 Main'`, city `'Town '`
  - a 101-character address
- The owner's update of `ACTIVE_LISTING` is rejected for the same values. This covers edits, not just inserts.
- A well-formed insert is accepted (`12345-6789`, `St. Paul`, `MN`).
- Every code in `US_STATES` (imported from `apps/web/app/composables/useStates.ts`) is accepted. This is the drift guard between the two lists.
- Sanity check: run the new test file before registering the migration in `schema-files.ts`. The rejection cases must fail. Then also comment out one constraint, see its cases fail, and restore it.
- Existing DB tests must still pass with the fixtures unchanged.

**Verification.**

- `npx vitest run --project db`: all pass, including the existing suites. Confirm it was a real run (test counts printed), not a cached one.
- `npm run lint` and `npm run build`.
- **Production rollout. Each step is a separate go-ahead from Missa:**
  1. Confirm Phase 1 is deployed.
  2. Confirm ChoreQuest doesn't touch `public.listings`.
  3. Run the dry-run select and expect the 3 rows.
  4. Run the fix, then re-run the select and expect 0 rows.
  5. Run the migration in the SQL Editor.
  6. As an owner in the browser console or the app, try saving `zip = '1234'` on your own listing. It's rejected with `23514`, and the friendly message shows.

**Safe to merge because** merging changes no database. The migration is run by hand, after Phase 1 is live and the data is fixed. The `23514` branch is harmless before the constraint exists. If the migration hits a bad row, the transaction rolls back and nothing changes.

**Branch / PR:** `feat/listing-address-checks`, "Enforce listing address format in the database".

---

### Phase 3: Census-first geocoding, opt-in via `kind=address`

**Goal.** Find more real US street addresses (Census matched 3 of 4 that Nominatim missed) without changing the browse "near" search. This stands alone: the route gains an opt-in mode that no caller uses until Phase 4.

**Changes.**

- `apps/web/nuxt.config.ts` runtimeConfig (server-only, next to `resendApiUrl` at `:48`):
  - `censusGeocoderUrl: process.env.CENSUS_GEOCODER_URL || 'https://geocoding.geo.census.gov'`
  - `nominatimUrl: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org'`
- `apps/web/server/api/geocode.get.ts`:
  - Replace the raw `getQuery` (`:28`) with `getValidatedQuery(event, validateGeocodeQuery)`. The plain validator returns `{ q: string; kind: 'address' | 'place' }`, with `q` trimmed, non-empty and at most 200 characters, and `kind` defaulting to `'place'`. Otherwise it throws `createError({ statusCode: 400 })`.
  - Add `geocodeWithCensus(q)`. It builds the URL from `config.censusGeocoderUrl` with `URLSearchParams` (confirm params against the Census docs), sets a `$fetch` `timeout` from a named constant (`CENSUS_TIMEOUT_MS = 5_000`), and returns `{ lat, lng, display_name } | null`. A network error or 5xx logs server-side (`console.error` with the status, no user data beyond the query) and returns `null`, so the route falls back instead of failing.
  - Move the existing Nominatim call into `geocodeWithNominatim(q)`, using `config.nominatimUrl`. Its behavior is unchanged: a 502 on error, `null` on no results.
  - In the handler: when `kind === 'address'`, try Census, then Nominatim. Otherwise, Nominatim only. Add `source: 'census' | 'nominatim'` to the response. The response shape is otherwise unchanged (`lat`, `lng`, `display_name`), so `ListingFilters.vue:690-694` keeps working.
  - Keep the rate limit (`:19-26`). It counts one call per request regardless of fallback.
  - Update the header comment (`:1-7`).
- `tests/routes/support/test-env.ts`: add `CENSUS_GEOCODER_URL`, `NUXT_CENSUS_GEOCODER_URL`, `NOMINATIM_URL` and `NUXT_NOMINATIM_URL`, all set to `FAKE_SERVICES_URL`. Add the `NUXT_` names to the guard list (`:22-27`).
- `tests/routes/support/fake-services.ts`: add handlers for `GET /geocoder/locations/onelineaddress` and `GET /search`, plus toggles `setCensusResult('match' | 'none' | 'down')` and `setNominatimResult('match' | 'none' | 'down')`. The fake responses copy the real response shapes taken from the docs.

**Tests.** New `tests/routes/geocode.test.ts`, styled after `tests/routes/notifications-send.test.ts`. It has at most 9 requests in total, because the route allows 10 per minute per IP and every test request comes from `127.0.0.1`. Cases:

- `kind=address`, Census matches: returns the Census coordinates with `source: 'census'`, and Nominatim is not called.
- `kind=address`, Census no match, Nominatim matches: `source: 'nominatim'`.
- `kind=address`, Census down: falls back to Nominatim.
- `kind=address`, both no match: 404.
- No `kind`: Census is never called (checked through `callsTo`).
- Missing or blank `q`: 400.
- Nominatim down with no `kind`: 502.

Sanity check: point one test at a deliberately wrong expected `source` and watch it fail before trusting the green run.

**Verification.**

- `npx vitest run --project routes`: the new and existing route tests pass.
- `npm run lint` and `npm run build`.
- By hand, with `npm run dev`:
  - `curl "http://localhost:3000/api/geocode?kind=address&q=13109%20Lola%20Drive,%20Spring%20Hill,%20FL%2034609"` (one of the Census-backfilled listings; check the real ZIP in the DB first) returns `source: "census"`.
  - The browse "near" search with `Bemidji, MN` still works.

**Security note for the PR.** This is an outbound request built from input. The hosts come only from server config, and user input reaches only the query string, through `URLSearchParams`. No input selects the host, so there's no SSRF path. The `q` length cap limits abuse of the upstream services.

**Safe to merge because** no caller sends `kind=address` yet, so production traffic still takes the Nominatim-only path, and the response only gains an additive `source` field.

**Branch / PR:** `feat/census-geocoding`, "Try the Census geocoder first for street addresses".

---

### Phase 4: Verify the address before saving, and stop the edit pin wipe

**Goal.** Sellers learn before publishing that their address can't be placed on the map, and choose to fix it or publish without a pin. Edits stop erasing good coordinates. This stands alone as the user-facing completion of Phases 1 and 3.

**Changes.**

- New `apps/web/app/utils/coordinates.ts`. Pure, unit-tested, explicit types:
  - `type GeocodePlan = 'geocode' | 'keep'`.
  - `planGeocode({ isEdit, isAddressChanged, hasExistingPin }): GeocodePlan` returns `'keep'` only for an edit with the address unchanged and a pin present. Everything else returns `'geocode'`.
  - `coordinatesForSave({ isEdit, isAddressChanged, hasExistingPin, match })` returns the payload fragment:
    - `{}` (leave the DB values alone) when the plan is `keep`, or when the edit has the address unchanged and no match.
    - `{ lat, lng }` on a match.
    - `{ lat: null, lng: null, location: null }` for a new listing or a changed address with no match. Clearing `location` is needed because `listings_sync_location` skips null coordinates (`supabase/functions.sql:105-109`).
  - `isSameAddress(a: AddressFields, b: AddressFields): boolean` compares normalized values case-insensitively for city and street, like the dedupe index.
- `apps/web/app/pages/sell.vue`:
  - Edit loader: add `lat, lng` to the select (`:577`). Store `originalAddress` (normalized `AddressFields`) and `hasExistingPin` in refs. They are not part of `form`, so drafts and the payload don't carry them.
  - In `submit()`, replace the geocode block (`:674-690`):
    1. Call `planGeocode`. If the plan is `geocode`, call `$fetch('/api/geocode', { params: { q, kind: 'address' } })`, with `q` built from `normalizedAddress`.
    2. On a 404, or a 502/429 (with a different message: "The map lookup isn't available right now"), when the edit isn't an unchanged-and-already-unpinned case:
       - `await useDialog().confirm({ title: "We couldn't find this address on the map", message: 'It will publish without a map pin and won't show in map search. Check the street, city and ZIP, or publish anyway.', confirmLabel: 'Publish without a pin', cancelLabel: 'Check the address' })`
       - On cancel: `submitting = false`, return.
    3. Spread `coordinatesForSave(...)` into the payload in place of `lat, lng` (`:698-699`).
  - Remove `geoWarning`. That's the ref (`:509`), the set (`:689`) and the block (`:386-392`). It's replaced by the pre-save dialog, which also fixes the warning that was hidden behind the 1.5 s redirect (`:820-823`).
  - Keep the `console.warn` on geocode failure only if lint config requires a trace. Otherwise drop it with the block.

**Tests.** New `tests/unit/coordinates.test.ts`. One case per row of the decision table:

- New listing with a match → `{ lat, lng }`.
- New listing with no match → all nulls.
- Edit, unchanged, pinned → plan `keep`, fragment `{}`.
- Edit, unchanged, unpinned, then a match → `{ lat, lng }`. With no match → `{}`.
- Edit, changed, with a match → `{ lat, lng }`. With no match → all nulls.
- `isSameAddress` ignores case and padding.

Sanity check: flip one branch in a stub and watch its case fail.

**Verification.**

- `npx vitest run`: all three projects pass.
- `npm run lint` and `npm run build`.
- By hand, with `npm run dev` at 375 px (check which Supabase project `apps/web/.env` targets, and use and delete a throwaway listing if it's production):
  1. A new listing at a Census-findable address publishes with a pin and no dialog.
  2. A new listing at `691 Desert Trail Way`, `Tecopa`, `CA`, `92389` shows the dialog. "Check the address" returns to the form with nothing saved. "Publish without a pin" saves with null `lat`/`lng`/`location`.
  3. **With Missa's approval, on a listing she owns:** edit one of the 3 Census-backfilled listings, changing only the price. A service-role select before and after shows the same `lat`, `lng` and `location`, and no `/api/geocode` call shows in the network tab.
  4. Edit a listing's street to an unfindable address and confirm. `lat`, `lng` and `location` are all null afterwards, and the listing no longer turns up in a radius search around the old point.

**Safe to merge because** it changes only the sell form and a new pure helper, and uses the route mode already merged in Phase 3. The pin-wipe fix only writes fewer coordinates on edit than today, never different ones from a source the seller didn't trigger.

**Branch / PR:** `feat/address-verification`, "Confirm before publishing an address we can't map, and keep pins on edit". If you start before Phases 1 and 3 are merged, branch off Phase 3's branch and open the PR as a **stacked** PR: its base is `feat/census-geocoding`, so the diff shows only Phase 4. After Phase 3 merges, GitHub retargets the base to `main` (or you change it in the PR's "Edit" next to the base branch), and you rebase onto `main` and push with `git push --force-with-lease`. That overwrites the remote branch only if nobody else pushed to it since your last fetch.

## 6. Risks

- **Constraint blocks a row that slipped in.** Phase 2 runs the fix first and the migration inside one transaction. A failure rolls back cleanly, and the dry-run select shows why.
- **Over-strict city rule.** "Ends in a two-letter state code" may reject a real place. It's client-only in Phase 1, so a seller who hits it is blocked only by the form. If that happens, loosen it to a non-blocking hint in a follow-up. The DB rule is only "no comma".
- **State list drift.** The DB `IN (...)` list duplicates `US_STATES`. Phase 2's "every `US_STATES` code is accepted" test fails if a code is added to one list and not the other.
- **Census API shape or terms differ from memory.** Phase 3 starts by confirming them against the official docs. The fake mirrors the documented shape, and the hand `curl` against the real service confirms it. If the terms forbid storing results, stop Phase 3 and raise it before merging.
- **Census is slow or down.** Phase 3 adds a 5 s timeout and falls back to Nominatim, so a sell submit is never blocked by Census alone.
- **Rate limit in tests and for real users.** It stays at 10/min per IP. Phase 3 keeps its suite at 9 requests or fewer. Phase 4 makes at most one geocode call per submit, and none on an unchanged edit, so it uses fewer calls than today.
- **Clearing a pin on edit is a data write.** It happens only after the seller changed the address and explicitly confirmed. It's covered by unit tests and hand check 4.
- **Shared Supabase project with ChoreQuest.** Phase 2 touches only `public.listings`. Confirm before running the migration.
- **Hand checks on production data.** Each phase's hand checks name which Supabase project to confirm first, and the production steps need a separate go-ahead.

## 7. Out of scope (separate tickets)

From the investigation's pre-existing problems:

- **DB default state is `MN`** (`supabase/schema.sql:51`). This conflicts with national-from-day-one. The new `listings_state_code` constraint accepts `MN`, so the default still applies on writes that omit state.
- **`FULL_COVERAGE_STATES = ['MN']`** gates the transaction page and the CMA route (`apps/web/app/composables/useStates.ts:63`, `apps/web/app/pages/transaction/[id].vue:149`, `apps/web/server/api/cma/[id].get.ts:35`). That's state privilege.
- **`useStates.ts` comment** says "states and territories" (`:1-4`) but lists only states + DC. Territories as listing states are a product decision (Decision 3).
- **`CLAUDE.md` drift.** It describes the absent `apps/api/` and says Nuxt 3, while the repo uses `nuxt ^4.4.2`.
- **Leftover `console.log`** of the photo count (`apps/web/app/pages/sell.vue:795-796`). Nit.
- **Photo delete and insert errors are logged and ignored**, then the success toast shows (`apps/web/app/pages/sell.vue:765-768`, `:805-808`). Should fix.

Also out of scope:

- **Tecopa will still have no pin.** Neither geocoder finds it, even with the corrected city. Manual coordinate entry, or a pin the seller drags on the map, is its own feature.
- **Mapbox geocoding.** Excluded because its free tier forbids storing results (project memory `project_geocoding_gaps.md`).
- **County validation.** It stays optional free text.
- **A server route for listing writes, plus zod.** Revisit only if listing input moves server-side.

The investigation's "geocode warning is barely visible" problem is **in** scope. Phase 4 replaces that warning.

## Recommendation

Start with **Phase 1**. It's client-only, it's the prerequisite for running Phase 2's migration, and its `unit` Vitest project is what Phase 4's tests use. Phase 3 has no dependency on Phase 1 and can be picked up in parallel if you want two PRs in review at once.

## Progress

- **Phase 1:** done, committed (`0af52f5`) and pushed. PR #12 (https://github.com/melissapula/frula/pull/12) merged to `main` on 2026-11-10 as `d1fe41d`. Deployment to production not yet confirmed. Branch `feat/address-format-rules`, based on `main` at `dcbabe6` (#11). Added the `unit` Vitest project, `apps/web/app/utils/address.ts` (normalize + validate), an `error` prop on `Field.vue` that exposes `errorId`/`invalid` to the slot, and per-field errors, `autocomplete`/`inputmode`/`maxlength`, and normalized geocode query and payload in `sell.vue`. 82 unit tests in `tests/unit/address.test.ts`. Deviations:
  - The button title says "Fix the highlighted fields first" only while an error is actually shown, instead of whenever address errors exist. Publish is disabled while errors exist, so an untouched empty form would otherwise point at highlights that aren't there.
  - `canSubmit` dropped its four `trim().length` checks, because the "required" rule in `validateAddress` covers them.
  - Two tests beyond the plan's list: a digit in the city, and a street of exactly 100 characters (boundary).
  - Lint couldn't run (pre-existing: `@nuxt/eslint` isn't in `nuxt.config.ts` modules). Hand checks in the browser are not done yet.
- **Phase 2:** done, committed (`0b40214`) and pushed. PR #13 (https://github.com/melissapula/frula/pull/13) merged to `main` on 2026-11-10 as `8242acd`. Production rollout steps 1-5 done on 2026-11-10, as reported by Missa: Phase 1 is deployed, ChoreQuest was checked, the dry run returned the 3 rows, the fix left 0, and the migration was applied. Step 6 (a `zip = '1234'` save rejected with `23514` and the friendly message showing) is not done yet. The migration file kept the date `20261111` although it merged on 2026-11-10; left as is, since the order is still correct. Branch `feat/listing-address-checks`, based on `main` at `d1fe41d` (#12). Added `supabase/migrations/20261111_listings_address_checks.sql` (six named `CHECK`s in one transaction), registered it in `tests/db/support/schema-files.ts`, added checklist item 23 with the one-time fix (seed items renumbered to 24-25), and `UNIQUE_VIOLATION`/`CHECK_VIOLATION` constants plus a friendly `23514` message in `sell.vue`. 70 tests in `tests/db/listing-address.test.ts`. Deviations:
  - Each rejection test asserts the specific constraint name in the error rather than using `isDenied`. `isDenied` matches only "permission denied", which a CHECK violation never produces.
  - The checklist's dry-run select also checks `state` against the 51 codes. Without that, a bad state row would pass the dry run and only show up when the migration rolls back.
  - The migration file keeps the date `20261111`. Rename it if it merges on another day, and update `schema-files.ts` and the checklist to match.
- **Phase 3:** done, committed (`d3013dd`) and pushed. PR #14 (https://github.com/melissapula/frula/pull/14) merged to `main` on 2026-11-10 as `cdd44de`. Branch `feat/census-geocoding`, based on `main` at `8242acd` (#13). Added `censusGeocoderUrl`/`nominatimUrl` to server `runtimeConfig`. `geocode.get.ts` now validates the query with `getValidatedQuery` (q 1-200 chars, kind `address`|`place`), tries Census first for `kind=address` (5 s timeout, falls back on any failure or no match), and adds `source` to the response. Fake Census and Nominatim handlers plus `setCensusResult`/`setNominatimResult` in `fake-services.ts`, the four env names in `test-env.ts`. 8 tests in `tests/routes/geocode.test.ts` (9 requests). Census docs checked on 2026-11-10: endpoint, params and response shape match the plan, and a live call matched the fake's shape. No storage restriction was found in the geocoder docs or the Census Data API terms, but no geocoder-specific terms were found either. Deviations:
  - `vitest.config.ts`: the `routes` project has `fileParallelism: false` (approved by Missa). Two route files now start the fake on the same fixed port, so running them in parallel fails with `EADDRINUSE`.
  - The Nominatim host was moved to config before the first test run, so the failing run didn't send requests to the real Nominatim.
  - Extra test: `q` over 200 characters returns 400.
  - An unknown `kind` returns 400. It isn't tested, because the 10-per-minute limit leaves no room for a 10th request.
  - The Census failure log carries only the HTTP status, not the query.
- **Phase 4:** done, committed (`9db53cd`) and pushed. PR #15 (https://github.com/melissapula/frula/pull/15) merged to `main` on 2026-11-10 as `2b769d6`. Deployed: confirmed on 2026-11-10 (the live `/sell` script contains the new dialog text). Browser-tested on frulahomes.com on 2026-11-10, with every Supabase write intercepted in the page (nothing reached the database): the not-found dialog with both buttons, the outage dialog, a new listing with a match, a price-only edit (no geocode, no coordinates sent), a case-only street change (treated as unchanged), and a changed unfindable street (nulls sent). Not covered: the database actually storing the nulls, and the radius search dropping the listing; the window stayed at desktop width, so 375 px wasn't checked. Branch `feat/address-verification`, based on `main` at `cdd44de` (#14), not stacked. Added `apps/web/app/utils/coordinates.ts` (`planGeocode`, `coordinatesForSave`, `isSameAddress`) and 17 tests in `tests/unit/coordinates.test.ts`. `sell.vue`: the edit loader selects `lat, lng` and stores `originalAddress`/`hasExistingPin` outside `form`. Submit skips the geocode on an unchanged, pinned edit, and otherwise calls `/api/geocode` with `kind: 'address'`. On failure it asks through `useDialog().confirm` (not on an unchanged, already-unpinned edit), and spreads `coordinatesForSave(...)` into the payload. `geoWarning` (ref, set, block) and its `console.warn` are removed. Deviations:
  - The outage dialog (any failure other than 404, such as 502, 429 or network) has its own title, "The map lookup isn't available right now", and the cancel label "Go back" instead of "Check the address", because the address may be fine.
  - Extra test: an unchanged, pinned edit returns `{}` even if a match is passed.
  - Typecheck of `.vue` files couldn't run (pre-existing: `nuxi typecheck` fetches `vue-tsc` through npx, which fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`). The pure module and its test were typechecked with `tsc --strict`. Lint couldn't run (pre-existing, same as Phase 1). Hand checks 1-4 are not done yet.

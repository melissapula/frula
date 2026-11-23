✨ Confirm before publishing an address we can't map, and keep pins on edit

## 📝 Description
- Before saving, the sell form now checks that the address can be found on the map. It uses the Census-first lookup added in #14 (`/api/geocode?kind=address`).
- If no geocoder matches, an in-app dialog asks the seller to publish without a map pin or go back and check the address. Before, the listing published silently, and the "couldn't pinpoint" warning flashed behind the 1.5 s redirect where nobody saw it.
- Editing a listing no longer wipes its map pin. Previously every save re-geocoded, and a failed lookup wrote null coordinates over a good pin. Now an edit with an unchanged, pinned address skips the lookup entirely. If the address changed and can't be found, the old pin is cleared after the seller confirms, rather than left on the previous house.
- This is the fourth and last step toward address validation.

## 🔗 Related Issue(s)
- Builds on #12 (address format rules) and #14 (Census-first geocoding), both merged.

## 🏷️ Type of Change
- ✅ 🐛 Bug fix (non-breaking change which fixes an issue)
- ✅ ✨ New feature (non-breaking change which adds functionality)
- ⬜ 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- ⬜ ♻️ Refactoring / Tech debt
- ⬜ 📚 Documentation update

## 🛠️ Changes Made
- `apps/web/app/utils/coordinates.ts` (new, pure, no Nuxt imports):
  - `planGeocode` returns `'keep'` only for an edit whose address is unchanged and already pinned. Everything else gets `'geocode'`.
  - `coordinatesForSave` returns the payload's coordinates:
    - `{}` leaves the stored values alone.
    - `{ lat, lng }` on a match.
    - `{ lat: null, lng: null, location: null }` clears the pin. Clearing has to null `location` by hand, because the `listings_sync_location` trigger skips rows with null coordinates and would otherwise keep the old point.
  - `isSameAddress` compares normalized addresses, ignoring case for street and city like the dedupe index.
- `apps/web/app/pages/sell.vue`:
  - The edit loader also selects `lat, lng`, and remembers the original address and whether the listing had a pin. These are kept outside `form`, so drafts and the payload don't carry them.
  - `submit()` geocodes with `kind: 'address'` only when the plan says to. On failure it asks through `useDialog().confirm`. A 404 asks the seller to check the address. Any other failure (502, 429, network) says the lookup is unavailable. An unchanged edit that was already unpinned saves without asking.
  - The payload spreads `coordinatesForSave(...)` in place of `lat, lng`.
  - The `geoWarning` banner and its `console.warn` are removed.
- `tests/unit/coordinates.test.ts` (new): 17 tests, one for each case of the decision table.

## 🎯 Definition of Done
- ✅ A new listing saves the match's coordinates, and with no match saves null `lat`, `lng` and `location`. Covered by the "saves a new listing with a match" and "saves a new listing with no match" tests in `tests/unit/coordinates.test.ts`.
- ✅ An edit with the address unchanged and a pin skips the lookup and leaves the stored coordinates alone. Covered by "plans an edit with the address unchanged and a pin", "saves an unchanged, pinned edit", and "keeps the stored pin on an unchanged edit even if a match is passed". The form only calls `/api/geocode` when the plan is `'geocode'` (`apps/web/app/pages/sell.vue:793`).
- ✅ An edit with the address unchanged and no pin retries the lookup. It saves the match if one is found, and otherwise changes nothing. Covered by the two "unchanged, unpinned edit" tests.
- ✅ An edit with a changed address saves the new match, or clears the pin when nothing matches. Covered by the two "changed edit" tests.
- ✅ An address counts as unchanged regardless of case and padding, and any change to street, city, state or ZIP counts as a change. Covered by the `isSameAddress` tests.
- ✅ The tests catch a wrong answer. With one `coordinatesForSave` branch flipped, its two cases failed, and a stub implementation failed 7 of 17.
- ⬜ When no geocoder matches, the seller sees the dialog. "Check the address" saves nothing, and "Publish without a pin" saves with null coordinates. This is implemented at `apps/web/app/pages/sell.vue:745` and `:796-804`, but not checked in a browser yet.
- ⬜ End to end, a price-only edit of a pinned listing keeps the same `lat`, `lng` and `location`, and makes no `/api/geocode` request. Not checked against a real listing yet.
- ⬜ End to end, changing a listing's street to an unfindable address and confirming leaves `lat`, `lng` and `location` null, and the listing drops out of radius search around the old point. Not checked against a real listing yet.

## 🧪 How to Test
1. Check out `feat/address-verification` and run `npm install`.
2. Check which Supabase project `apps/web/.env` points at. If it's production, use a throwaway listing for steps 4-7 and delete it afterwards.
3. Run `npm run dev --workspace=web`, sign in, and open `/sell` at 375 px wide.
4. Create a listing at a Census-findable address, for example `4600 Silver Hill Rd`, `Washington`, `DC`, `20233`. Expected: it publishes with a map pin and no dialog.
5. Create a listing at `691 Desert Trail Way`, `Tecopa`, `CA`, `92389`. Expected: the "We couldn't find this address on the map" dialog appears.
   - Click "Check the address". Expected: you stay on the form, and nothing is saved.
   - Submit again and click "Publish without a pin". Expected: it saves, with null `lat`, `lng` and `location` in the database.
6. Edit the pinned listing from step 4 and change only the price. Expected: the network tab shows no `/api/geocode` request, and `lat`, `lng` and `location` are the same before and after.
7. Edit that listing again, change the street to an unfindable address, and confirm the dialog. Expected: `lat`, `lng` and `location` are all null, and the listing no longer turns up in a radius search around the old point.
8. Run `npx vitest run`. Expected: all 8 files and 321 tests pass. The `routes` files run one after another, so it takes about 2 minutes.

## ✅ Checklist
- ⬜ My code follows the style guidelines of this project — Prettier passes on every touched file, but `npm run lint` can't run. That's a pre-existing problem this PR doesn't touch: `eslint.config.mjs` imports `.nuxt/eslint.config.mjs`, which isn't generated because `@nuxt/eslint` isn't in the `nuxt.config.ts` modules.
- ✅ I have performed a self-review of my own code
- ✅ I have commented my code, particularly in hard-to-reach areas
- ✅ I have added tests that prove my fix is effective or that my feature works
- ✅ New and existing unit tests pass locally with my changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

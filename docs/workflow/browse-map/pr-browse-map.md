🐛 Stop the browse page shaking on pin hover, and group overlapping pins
## 📝 Description
- **Shake:** hovering some map pins on the browse page made the whole page shake. Hovering a pin narrowed the list to one listing, which made the page shorter and scrolled the map out from under the cursor. That ended the hover, the full list came back, the map scrolled back under the cursor, and the cycle repeated. Now hovering only shows the popup and highlights the card. The list narrows only when a pin is clicked.
- **Hidden pins:** pins close together drew on top of each other and hid one another. A newly published Bemidji listing looked like it had no pin because it sat within about 1px of another listing's pin at the national zoom. Those pins are now grouped into a count bubble that zooms in to split them when clicked.

## 🔗 Related Issue(s)
- None

## 🏷️ Type of Change
- ✅ 🐛 Bug fix (non-breaking change which fixes an issue)
- ⬜ ✨ New feature (non-breaking change which adds functionality)
- ⬜ 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- ⬜ ♻️ Refactoring / Tech debt
- ⬜ 📚 Documentation update

## 🛠️ Changes Made
- `apps/web/app/pages/browse.vue`: the list narrows to one listing only when a pin is clicked (`pinnedId`), never on hover. Removed the `hoverSource` state that drove the hover narrowing.
- `apps/web/app/utils/mapClusters.ts` (new): wraps `supercluster` to return the pins and clusters for a visible area and zoom. It's a pure function, so it's unit-tested without a map.
- `apps/web/app/components/BrowseMap.client.vue`: draws pins and cluster bubbles from that index and redraws on every `moveend`, adding and removing only the markers that changed. Clicking a bubble eases to its expansion zoom. Popups anchor to the listing's own coordinates, so a card hover still works while its listing is grouped. A hover held by a pin that gets absorbed into a cluster is cleared, because a removed element never fires `mouseleave`.
- `apps/web/package.json`: adds `supercluster` ^9.1.0, Mapbox's clustering library, which ships its own types. mapbox-gl keeps its internal 8.x copy, separate from this one.

## 🎯 Definition of Done
- ✅ Hovering a map pin no longer changes the page height or scroll position, so the page doesn't shake. Browser check at 1440×900, scrolled 600px, hovering the land pin: one steady state across 25 samples, where production flipped between two states. Code: `apps/web/app/pages/browse.vue:227`
- ✅ Hovering a pin still shows its popup and highlights its card. Same browser check: popup open, land card highlighted, full list kept.
- ✅ Clicking a pin still narrows the list to that listing, with "Show all" to go back. Browser check: clicking the $265K pin left one card and the "Show all" button. Code: `apps/web/app/pages/browse.vue:229`
- ✅ Pins that would overlap are grouped into a bubble showing the count. Browser check: the two Bemidji listings about 200 m apart showed as one "2" bubble. Tests: `groups listings that would overlap into one cluster with their count` and `groups listings in nearby towns whose pins would overlap at the national view`
- ✅ Clicking a bubble zooms in until its listings separate. Browser check: clicking the Bemidji bubble showed the $265K and $415K pins. Test: `splits a cluster when zoomed to its expansion zoom`. Code: `apps/web/app/components/BrowseMap.client.vue:275`
- ✅ Listings far apart stay separate pins. Test: `keeps listings that are far apart as separate pins`
- ✅ Hovering a card whose listing is inside a bubble still shows that listing's popup. Browser check: hovering the 2320 Lake Ave NE card while grouped showed its popup. Code: `apps/web/app/components/BrowseMap.client.vue:170`
- ⬜ Behavior on phones and touch screens. Not tested yet.
- ⬜ Listings with identical coordinates (two units at one address) separate. Out of scope: they stay grouped even at full zoom. It's rare, because only one active listing is allowed per address.

## 🧪 How to Test
1. Check out `fix/browse-map-shake-clusters`, run `npm ci`, put the Supabase and Mapbox values in `apps/web/.env` (see `.env.example`), and run `npm run dev`. Open `http://localhost:3000/browse` in a desktop-width window. No sign-in is needed.
2. At the national view, the two Bemidji, MN listings show as one dark "2" bubble rather than two overlapping price pins.
3. Click the bubble. The map zooms in and shows two separate price pins.
4. Scroll the page down until the list has moved but the map is still in view. Hover any pin. The popup opens, the matching card gets a green outline, and the page stays still.
5. Move off the pin. The popup closes and the full list is unchanged.
6. Click a pin. The list narrows to that listing with a "← Show all" button. Click empty map or "Show all" to get the full list back.
7. Zoom back out until a listing is inside a bubble, then hover that listing's card in the list. Its popup appears on the map at the listing's location.
8. Run `npx vitest run --project unit`. All tests pass, including `tests/unit/map-clusters.test.ts`.

## ✅ Checklist
- ✅ My code follows the style guidelines of this project
- ⬜ I have performed a self-review of my own code — the author hasn't reviewed it yet
- ✅ I have commented my code, particularly in hard-to-reach areas
- ✅ I have added tests that prove my fix is effective or that my feature works
- ✅ New and existing unit tests pass locally with my changes

Lint and typecheck report problems that are already on `main`, and this branch adds none. Lint flags one `unified-signatures` error on the unchanged `defineEmits` in `BrowseMap.client.vue`. Typecheck reports 156 errors on `main` and the same 156 on this branch.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

# Test Card 04 — Browse Page, Map, and Filters

**Priority:** Critical
**Precondition:** Seed data loaded (10+ listings), signed in optional

---

## Basic browse

- [ ] Navigate to `/browse`
- [ ] Verify the listing count appears (e.g., "10 homes")
- [ ] Verify listing cards show: photo, price, beds/baths/sqft, address, FSBO badge
- [ ] Verify the Mapbox map renders on the right (desktop) or via Map toggle (mobile)
- [ ] Verify color-coded markers appear: green for homes, amber for land, blue for commercial
- [ ] Verify the map legend shows in the bottom-left corner

## Map interactions

- [ ] Hover over a listing card → verify the map marker gets a popup with photo + summary
- [ ] Hover over a map marker → verify the listing card highlights with a green ring
- [ ] Click a marker → verify the card filters to just that one (expanded view)
- [ ] Verify "← Show all N listings" button appears
- [ ] Click "← Show all" → verify full list returns
- [ ] Click a marker on a LAND listing → verify popup shows acreage + terrain (not beds/baths)
- [ ] Click the popup itself → verify it navigates to the listing detail page

## Location filters

- [ ] Switch to "Near a place" mode
- [ ] Type "Austin, TX" and click Go
- [ ] Verify the green radius circle appears on the map
- [ ] Verify listings are sorted by distance (nearest first)
- [ ] Verify distance badges appear on the cards (e.g., "2.3 mi")
- [ ] Adjust the radius slider → verify results update
- [ ] Click "Clear location"
- [ ] Switch to "State / city" mode
- [ ] Pick a state from the dropdown → verify only listings in that state show
- [ ] Type a city name → verify filtering works

## Advanced filters

- [ ] Click "Show advanced filters"
- [ ] Set a price range (e.g., $200K–$600K) → verify results filter
- [ ] Set beds min to 3 → verify <3 bed listings disappear
- [ ] Check "Waterfront" → verify only waterfront listings show
- [ ] Check a feature (e.g., "Pool") → verify filtering works
- [ ] Select a view (e.g., "Mountain") → verify filtering
- [ ] Click "Clear filters" → verify everything resets

## Mobile

- [ ] Open the page on mobile (or resize to <640px)
- [ ] Verify the "Show filters" button appears
- [ ] Tap it → verify filter drawer opens
- [ ] Verify the List/Map toggle works
- [ ] Verify the hamburger menu opens and shows all nav links

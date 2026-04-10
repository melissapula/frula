# Test Card 10 — Dream Home Finder

**Priority:** High
**Precondition:** Seed data loaded (10+ listings), signed in

---

## Basic search

- [ ] Navigate to `/dream-home`
- [ ] Verify "Your matches will appear here" placeholder before searching
- [ ] Set a max budget (e.g., $800,000)
- [ ] Set ideal bedrooms to 4
- [ ] Set ideal bathrooms to 2
- [ ] Check "Has a garage"
- [ ] Check "Waterfront"
- [ ] Select a few view chips (e.g., Mountain, Lake)
- [ ] Select a few feature chips (e.g., Open concept, Fireplace, Deck)
- [ ] Click "Find my dream home"
- [ ] Verify results appear sorted by match percentage (highest first)

## Match scoring

- [ ] Verify match badges are color-coded: green (80%+), amber (50-79%), gray (<50%)
- [ ] Verify a listing with ALL your preferences scores near 100%
- [ ] Verify a listing with SOME preferences scores in the middle range
- [ ] Verify a listing with FEW preferences scores low
- [ ] Verify beds/baths use proximity scoring:
    - A home with exactly 4 beds = higher % than one with 3 beds
    - But 3 beds still shows (not excluded like Browse would do)

## Minimum match slider

- [ ] Drag the "Minimum match" slider to 80%
- [ ] Verify lower-scoring results disappear
- [ ] Verify the count updates (e.g., "3 matches at 80%+")
- [ ] Set it to 100% → verify only perfect matches (if any) remain
- [ ] Set it back to 0% → verify all results return

## Pagination

- [ ] If there are 10+ results, verify "Show next 10" button at the bottom
- [ ] Click it → verify 10 more load (or remaining count)

## Save as alert

- [ ] With results showing, verify the "Email me new matches" button appears
- [ ] Click it → verify "✓ Alert saved" feedback
- [ ] (Note: the actual email cron isn't built yet — this just saves the preferences)

## Difference from Browse

- [ ] Verify Dream Home shows ALL listings ranked by match %, even bad matches
- [ ] Verify Browse EXCLUDES listings that don't pass every active filter
- [ ] This is the core differentiator — confirm it feels different in practice

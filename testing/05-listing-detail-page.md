# Test Card 05 — Listing Detail Page

**Priority:** Critical
**Precondition:** Seed data loaded, signed in as any user

---

## Content rendering

- [ ] Navigate to any listing → verify the page loads without errors
- [ ] Verify photo gallery shows:
    - [ ] Mobile: swipeable strip with prev/next arrows + counter (1/5)
    - [ ] Desktop: hero + grid layout
    - [ ] Click any photo → verify fullscreen lightbox opens
    - [ ] In lightbox: test left/right arrows (click + keyboard)
    - [ ] In lightbox: verify thumbnail strip at bottom, click a thumbnail
    - [ ] In lightbox: press Escape → verify it closes
    - [ ] In lightbox: click outside the image → verify it closes
- [ ] Verify title/address/city/state/zip
- [ ] Verify quick stats strip (beds, baths, sqft, acres, year built, garage)
- [ ] Verify key feature badges (waterfront, single story, mountain view, etc.) — only if applicable
- [ ] Verify description + highlights render
- [ ] Verify "Features & lifestyle" section shows views + feature chips (homes only)
- [ ] Verify "Land details" section shows terrain + utilities (land only)
- [ ] Verify "Property facts" grid with all the detailed fields
- [ ] Verify "Where it is" map shows with a colored marker

## Mortgage calculator

- [ ] Verify calculator appears on non-land listings
- [ ] Verify it does NOT appear on land listings
- [ ] Change the down payment slider → verify monthly payment updates live
- [ ] Change the interest rate → verify payment updates
- [ ] Change the loan term (15/20/30) → verify payment updates
- [ ] Verify "Total interest paid" and "Total of payments" are reasonable

## Share buttons

- [ ] Click "Copy link" → verify "✓ Copied!" feedback, then paste to verify the URL
- [ ] Click Facebook → verify it opens a Facebook share dialog in new tab
- [ ] Click X/Twitter → verify it opens a tweet with address + price
- [ ] Click Email → verify it opens your email client with subject + body
- [ ] Click Text → verify it opens SMS with the listing details
- [ ] On mobile: verify the native "Share..." button appears (if supported)

## Sidebar

- [ ] Verify price + $/sqft displayed
- [ ] Verify "FSBO — view seller profile →" badge links to `/seller/<id>`
- [ ] Click "💰 Make an offer" → verify modal opens (Test Card 07)
- [ ] Click "📅 Request a viewing" → verify modal opens (Test Card 08)
- [ ] Click "Contact seller" → verify navigation to inbox
- [ ] Click the heart "Save listing" → verify it toggles (Test Card 06)
- [ ] Click "📊 View market snapshot" → verify navigation to market page
- [ ] Verify "Listed X days ago" shows at the bottom

## Market snapshot

- [ ] Click "View market snapshot" → verify the page loads
- [ ] If ZHVI is loaded: verify ZIP market card shows median value + YoY trend
- [ ] If ZHVI not loaded: verify the "not yet loaded" fallback message
- [ ] Verify nearby Frula listings section shows comparable homes with photos
- [ ] Verify "Need a professional valuation?" section appears
- [ ] Verify Zillow attribution text at the bottom of the ZIP card

# Test Card 02 — Create a Listing

**Priority:** Critical
**Precondition:** Signed in as User A

---

## Tests

- [ ] Navigate to `/sell`
- [ ] Verify heading says "List your home"
- [ ] Fill in required fields: address, city, state, ZIP, property type, asking price
- [ ] Verify the "Publish listing" button is DISABLED until all required fields are filled
- [ ] Fill in optional fields: year built, beds, baths, sqft, lot size, garage stalls, parking spaces, stories, basement type
- [ ] Check "Single story / no stairs"
- [ ] Open "Features & lifestyle" section:
    - [ ] Check "Waterfront" → verify "Body of water" field appears
    - [ ] Type a body of water name
    - [ ] Select 2-3 view chips (e.g., Lake, Woods)
    - [ ] Verify features are grouped by category (Interior layout, Kitchen & bath, etc.)
    - [ ] Select 5+ features across multiple groups
- [ ] Open "Utilities" section → select water source + sewer type
- [ ] Fill in headline + description + highlights (one per line)
- [ ] **Photo upload:**
    - [ ] Drag and drop 3+ photos into the upload area
    - [ ] Verify "Optimizing photo..." appears briefly (compression)
    - [ ] Verify progress bars run to 100%
    - [ ] Verify thumbnail grid shows all photos
    - [ ] Verify first photo has "Primary" badge
    - [ ] Reorder photos using the ← → arrows
    - [ ] Remove one photo using the "Remove" button
- [ ] Click "Publish listing"
- [ ] Verify redirect to `/listing/<id>`
- [ ] Verify all entered data appears on the listing detail page
- [ ] Verify photos show in the gallery
- [ ] Verify the listing pin appears on the map (if geocoding succeeded)

## Duplicate prevention

- [ ] Go back to `/sell` and try creating a listing with the EXACT same address
- [ ] Verify you see the "This address is already listed as active" error

## Land listing (property-type specific)

- [ ] Create a second listing with property type = "Land"
- [ ] Verify "Land details" section appears (terrain, road access, utilities at lot)
- [ ] Select terrain chips, road access, and utility chips
- [ ] Verify "Utilities" section does NOT appear (that's for homes only)
- [ ] Verify mortgage calculator does NOT appear on the land listing detail page

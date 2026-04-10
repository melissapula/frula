# Test Card 03 — Edit & Delete a Listing

**Priority:** Critical
**Precondition:** Signed in as User A with at least one active listing

---

## Edit flow

- [ ] Navigate to one of your own listings at `/listing/<id>`
- [ ] Verify you see "This is your listing" message + "Edit listing" + "Delete listing" buttons
- [ ] Click "Edit listing"
- [ ] Verify redirect to `/sell?edit=<id>`
- [ ] Verify heading says "Edit your listing"
- [ ] Verify all fields are pre-populated with existing data (address, price, beds, features, photos, etc.)
- [ ] Change the price
- [ ] Add one new photo
- [ ] Toggle one feature on that wasn't on before
- [ ] Click "Save changes"
- [ ] Verify redirect back to `/listing/<id>`
- [ ] Verify the updated price, new photo, and new feature all appear
- [ ] Verify the geocoding still works (pin on map)

## Delete flow

- [ ] Create a quick throwaway listing (minimal fields — just address, state, zip, price)
- [ ] Navigate to that listing detail page
- [ ] Click "Delete listing"
- [ ] Verify confirmation dialog appears: "Permanently delete this listing for [address]?"
- [ ] Click OK
- [ ] Verify redirect to `/account`
- [ ] Verify the deleted listing no longer appears in your account dashboard
- [ ] Navigate to `/browse` and verify the deleted listing is gone from the map + list

## Edge cases

- [ ] Visit someone ELSE's listing → verify you do NOT see Edit/Delete buttons
- [ ] Try manually navigating to `/sell?edit=<someone-else's-listing-id>` → verify you see an ownership error

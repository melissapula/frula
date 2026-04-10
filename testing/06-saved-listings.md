# Test Card 06 — Saved Listings

**Priority:** High
**Precondition:** Signed in, multiple listings exist

---

## Heart button on listing cards

- [ ] Navigate to `/browse`
- [ ] Click the 🤍 heart on a listing card → verify it turns ❤️ red
- [ ] Verify the ❤️ badge in the navbar updates the count
- [ ] Click the ❤️ again → verify it toggles back to 🤍
- [ ] Verify the navbar count decrements

## Heart button on listing detail page

- [ ] Navigate to a listing detail page
- [ ] Click the "Save listing" button in the sidebar
- [ ] Verify it changes to "Saved" with red styling
- [ ] Click again to unsave → verify it toggles back

## Saved page

- [ ] Save 3+ listings from browse
- [ ] Navigate to `/saved` (via navbar ❤️ or footer link)
- [ ] Verify all saved listings appear as cards
- [ ] Verify count matches the navbar badge
- [ ] Unsave one listing from this page → verify it disappears immediately
- [ ] Verify the navbar badge decrements

## Guest behavior

- [ ] Sign out
- [ ] Click a heart on a listing card → verify redirect to `/login`
- [ ] Navigate to `/saved` → verify redirect to `/login`

## Seller notification

- [ ] As User B, save a listing owned by User A
- [ ] As User A, check the notifications bell → verify a "Someone saved your home ❤️" notification appears

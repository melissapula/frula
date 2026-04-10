# Test Card 07 — Make an Offer

**Priority:** Critical
**Precondition:** Two accounts (User A = seller, User B = buyer), User A has an active listing

---

## Submit an offer

- [ ] As User B, navigate to User A's listing
- [ ] Click "💰 Make an offer"
- [ ] Verify the modal opens with:
    - [ ] Amber disclaimer: "This is an expression of interest, not a contract"
    - [ ] Listing address shown
- [ ] Fill in offer price → verify "X% over/under asking" feedback appears live
- [ ] Set financing type (e.g., Conventional)
- [ ] Set earnest money amount
- [ ] Pick a proposed closing date
- [ ] Check 2+ contingencies (inspection, appraisal)
- [ ] Write a note to the seller
- [ ] Click "Send offer"
- [ ] Verify redirect to the inbox thread

## Seller receives offer

- [ ] As User A, check the notifications bell → verify "💰 [name] made an offer" notification
- [ ] Click it → verify navigation to the inbox thread
- [ ] Verify the offer renders as an **OfferCard** (not plain text):
    - [ ] Big bold offer price
    - [ ] "X% over/under asking" comparison
    - [ ] Financing type, earnest money, closing date, contingencies listed
    - [ ] Buyer's note visible
    - [ ] Three action buttons: Accept / Counter / Decline
- [ ] Verify User A received an **email notification** about the offer

## Accept the offer

- [ ] As User A, click "Accept" on the OfferCard
- [ ] Verify confirmation dialog appears
- [ ] Click OK → verify:
    - [ ] OfferCard shows "✓ Offer accepted — transaction started" with green border
    - [ ] A system message appears: "✅ Offer accepted at $X. Transaction is now open."
    - [ ] Navigation to `/transaction/<id>` works
    - [ ] Transaction page shows listing summary + both checklists

## Counter an offer (separate test)

- [ ] Repeat the offer flow above
- [ ] As User A, click "Counter" instead of Accept
- [ ] Verify the OfferModal opens in counter mode ("Send counter-offer")
- [ ] Verify the price is pre-filled with the original offer amount
- [ ] Change the price and submit
- [ ] Verify the original OfferCard shows "↪ Countered" status
- [ ] Verify a NEW OfferCard appears below from User A to User B
- [ ] As User B, verify they see the counter OfferCard with Accept/Counter/Decline

## Decline an offer (separate test)

- [ ] Repeat the offer flow above
- [ ] As User A, click "Decline"
- [ ] Verify the optional reason prompt appears
- [ ] Enter a reason (or leave blank)
- [ ] Verify the OfferCard shows "✗ Offer declined" with red border
- [ ] Verify a system message appears in the thread

## Guest behavior

- [ ] Sign out, go to a listing, click "Make an offer" → verify redirect to `/login`

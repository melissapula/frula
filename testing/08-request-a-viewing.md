# Test Card 08 — Request a Viewing

**Priority:** High
**Precondition:** Two accounts (User A = seller, User B = buyer), User A has an active listing

---

## Submit a viewing request

- [ ] As User B, navigate to User A's listing
- [ ] Click "📅 Request a viewing"
- [ ] Verify the modal opens with listing address + helper text
- [ ] Pick a preferred date (must be today or later)
- [ ] Select a time of day (Morning / Afternoon / Evening / Any time)
- [ ] Pick a backup date (optional)
- [ ] Enter party size
- [ ] Write a note (optional)
- [ ] Click "Send request"
- [ ] Verify redirect to the inbox thread

## Seller receives viewing request

- [ ] As User A, check the notifications bell → verify "📅 [name] requested a viewing" notification
- [ ] Click it → verify navigation to the inbox thread
- [ ] Verify the request renders as a **ViewingCard** (not plain text):
    - [ ] Formatted date (e.g., "Saturday, April 12, 2026")
    - [ ] Time of day
    - [ ] Backup date (if provided)
    - [ ] Party size
    - [ ] Buyer's note
    - [ ] Two action buttons: Confirm / Decline
- [ ] Verify User A received an **email notification**

## Confirm the viewing

- [ ] As User A, click "Confirm" on the ViewingCard
- [ ] Verify the card shows "✓ Viewing confirmed" with green border
- [ ] Verify a system message appears: "✅ Viewing confirmed for [date]."

## Decline the viewing

- [ ] Repeat the viewing request flow
- [ ] As User A, click "Decline"
- [ ] Verify the optional reason prompt appears
- [ ] Enter a suggestion (or leave blank)
- [ ] Verify the card shows "✗ Viewing declined" with red border
- [ ] Verify a system message appears in the thread

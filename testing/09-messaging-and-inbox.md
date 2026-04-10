# Test Card 09 — Messaging & Inbox

**Priority:** Critical
**Precondition:** Two accounts with at least one message thread between them

---

## Send a message

- [ ] As User B, navigate to User A's listing
- [ ] Click "Contact seller" → verify redirect to `/inbox/<listingId>/<userId>`
- [ ] Type a message in the composer at the bottom
- [ ] Press Enter (or click Send)
- [ ] Verify the message appears as a green bubble on the right
- [ ] Verify the timestamp shows "just now"

## Receive a message

- [ ] As User A, check the navbar → verify "Inbox" has a green unread badge
- [ ] Verify the badge number matches the actual unread count
- [ ] Navigate to `/inbox`
- [ ] Verify the thread shows in the list with:
    - [ ] User B's name
    - [ ] Listing address
    - [ ] Last message preview (bold if unread)
    - [ ] Relative timestamp
    - [ ] Unread count badge
- [ ] Click the thread → verify messages load
- [ ] Verify the unread badge in the navbar decrements after opening the thread
- [ ] Reply to User B's message
- [ ] Verify it appears as a green bubble

## Email notifications

- [ ] When User B sends a message, verify User A receives an email with:
    - [ ] Subject like "💬 New message about [address]"
    - [ ] Message body preview
    - [ ] "Reply in inbox" button linking to the thread

## Inbox management

- [ ] Hover over a thread in the inbox list → verify action buttons appear (🚩 ✉️ 🗑️)
- [ ] Click 🚩 (flag) → verify the flag icon appears next to the sender name
- [ ] Click 🚩 again → verify the flag is removed
- [ ] Click ✉️ (mark unread) → verify the thread goes bold + navbar badge updates
- [ ] Click 🗑️ (delete) → verify confirmation prompt → verify thread disappears

## Realtime

- [ ] Open two browser windows as User A and User B in the same thread
- [ ] Send a message from User B → verify it appears in User A's window within ~2 seconds (no refresh needed)

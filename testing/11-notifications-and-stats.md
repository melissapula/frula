# Test Card 11 — Notifications Bell & Seller Stats

**Priority:** High
**Precondition:** Two accounts, User A has listings

---

## Notifications bell

- [ ] As User A, click the 🔔 bell in the navbar
- [ ] Verify the dropdown opens showing recent notifications
- [ ] Verify each notification has: icon (💰/📅/💬/❤️), title, body, timestamp
- [ ] Verify unread notifications have a green tint + green dot
- [ ] Click a notification → verify it navigates to the right page + marks as read
- [ ] Click "Mark all read" → verify all notifications lose the unread styling
- [ ] Verify the bell badge count updates accurately
- [ ] Click outside the dropdown → verify it closes

## Triggering notifications

Trigger each type and verify it appears in the bell:

- [ ] User B sends User A a message → 💬 notification
- [ ] User B makes an offer on User A's listing → 💰 notification
- [ ] User B requests a viewing → 📅 notification
- [ ] User B saves User A's listing → ❤️ notification

## Realtime

- [ ] Leave User A's browser open with the bell visible
- [ ] As User B, send an offer
- [ ] Verify User A's bell badge updates within seconds (no refresh)

## Seller stats card

- [ ] As User A, navigate to one of your OWN listings
- [ ] Verify the "📊 Your listing stats" card appears in the sidebar
- [ ] Verify it shows: Views (this week / all-time), Saves, Messages
- [ ] Verify "Only you see this" badge
- [ ] As User B, visit that listing → verify User A's view count increments
- [ ] As User B, save that listing → verify User A's save count increments
- [ ] Verify week-over-week deltas show (+N or flat)

## Owner-only visibility

- [ ] As User B, visit User A's listing → verify the stats card does NOT appear

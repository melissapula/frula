# Test Card 13 — Account Dashboard

**Priority:** High
**Precondition:** Signed in with at least one listing, some messages, and some saved homes

---

## Dashboard layout

- [ ] Navigate to `/account`
- [ ] Verify welcome header: "Welcome back, [first name] 💚"
- [ ] Verify "Member since [date]" displays correctly
- [ ] Verify "+ List a new home" button appears

## Quick stats strip

- [ ] Verify 4 stat cards show: Unread messages, Saved homes, My listings, Dream home alerts
- [ ] Click "Unread messages" card → verify navigation to `/inbox`
- [ ] Click "Saved homes" card → verify navigation to `/saved`
- [ ] Click "Dream home alerts" card → verify navigation to `/dream-home`

## My listings section

- [ ] Verify your listings show with: thumbnail photo, address, price, status badge, view count, save count
- [ ] Verify active listings have a green "active" badge
- [ ] Click a listing → verify navigation to the listing detail page
- [ ] If no listings: verify empty state with "List your home" CTA

## Recent activity section

- [ ] Verify recent notifications display with icons + timestamps
- [ ] Verify "Open inbox →" link

## Sidebar

- [ ] Verify profile card with avatar initials + name + email
- [ ] Verify "Quick links" section with all major page links
- [ ] Click "Sign out" → verify redirect to homepage
- [ ] Verify signed out state (no longer authenticated)

# Test Card 12 — Paperwork Directory

**Priority:** Medium
**Precondition:** None (public pages)

---

## Browse page

- [ ] Navigate to `/paperwork`
- [ ] Verify heading says "📄 Paperwork directory" (not "guides")
- [ ] Verify the "Pick your state" banner appears when no state is selected
- [ ] Verify federal + concept guides show by default (NOT 50 state cards)
- [ ] Pick a state (e.g., Texas) from the dropdown
- [ ] Verify that state's resources card appears alongside federal + concept guides
- [ ] Verify the state selection persists (navigate away and back)
- [ ] Filter by "Who" → Seller → verify only seller-relevant guides show
- [ ] Filter by "Phase" → Before listing → verify filtering works
- [ ] Click a federal guide card → verify it navigates to the detail page

## Detail page — federal guide

- [ ] Navigate to `/paperwork/lead-paint-disclosure`
- [ ] Verify Federal badge + Seller badge + Before listing badge
- [ ] Verify "⚠️ Draft content" warning banner (since content is placeholder)
- [ ] Verify intro paragraph
- [ ] Verify the green "Open official source ↗" button links to the EPA
- [ ] Verify sections render with body text
- [ ] Verify "⚠️ Things to watch out for" section at the bottom
- [ ] Verify disclaimer footer

## Detail page — concept guide (state-finder)

- [ ] Navigate to `/paperwork/sellers-property-disclosure`
- [ ] Verify "All 50 states" badge
- [ ] Verify the state-finder widget: "Find your state's official form"
- [ ] Pick a state from the dropdown → verify the "Open [state] ↗" button appears
- [ ] Click it → verify it opens the state real estate commission website in a new tab
- [ ] Verify the selected state persists (navigate to another concept guide → same state pre-selected)

## Detail page — per-state entry

- [ ] Navigate to `/paperwork/tx-real-estate-forms`
- [ ] Verify the page links to the Texas Real Estate Commission
- [ ] Verify "Auto-generated from state real estate commission directory" in the footer
- [ ] Verify the "Open official source ↗" button works

## Disclaimer language

- [ ] Verify "Informational only — not legal advice" appears in the footer of every guide page
- [ ] Verify the browse page footer has the same disclaimer

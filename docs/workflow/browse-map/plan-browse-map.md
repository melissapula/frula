# Plan: browse map shake and overlapping pins

Suggested PR title: Stop the browse page shaking on pin hover, and group overlapping pins

## Problem

Reported 2026-11-22 after publishing 2320 Lake Ave NE, Bemidji:

1. Hovering a map pin (seen on the land listing) made the whole page shake back and forth.
   Cause: hovering a pin narrowed the list to one listing, which shortened the page and
   scrolled the map out from under the cursor. That ended the hover, which restored the list
   and scrolled the map back under the cursor, over and over. Reproduced on production at
   1440×900, scrolled 600px.
2. The new listing seemed to have no pin. It saved with coordinates (Census geocoder), but at
   the national zoom its pin drew within about 1px of 3175 Power Dam Rd NE's pin, about 200 m
   away, and was hidden under it.

## Phase 1: fix both (branch `fix/browse-map-shake-clusters`)

Requirements:

- Hovering a map pin never changes the page height or scroll position, so the page doesn't shake.
- Hovering a pin still shows its popup and highlights its card.
- Clicking a pin still narrows the list to that listing, with "Show all" to go back.
- Pins that would overlap are grouped into a bubble showing how many listings it holds.
- Clicking a bubble zooms in until its listings separate.
- Listings far apart stay separate pins.
- Hovering a card whose listing is inside a bubble still shows that listing's popup.

Out of scope: listings with identical coordinates (they never separate), mobile and touch
testing, and the existing lint setup and typecheck errors on main.

## Progress

- Phase 1: done, commit 17fec69, branch pushed. Draft PR open: https://github.com/melissapula/frula/pull/19

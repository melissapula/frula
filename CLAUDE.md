# 🏠 Frula Homes — Project Context for Claude

> Read this file at the start of every session to get fully up to speed.
> Last updated: April 2026

---

## What Is Frula Homes?

Frula Homes (frulahomes.com) is a For Sale By Owner (FSBO) real estate platform
built for people who want to sell their home without paying agent commissions.
Think Zillow — except Zillow no longer lets sellers manage their own listings,
and traditional agents charge 5-6% commission.

Frula Homes replaces the agent with:

- A smart listing builder with photo uploads
- A free CMA (Comparable Market Analysis) tool built on MN public parcel data
- Smart transaction checklists for buyer and seller (MN-specific)
- Step-by-step paperwork guides for every MN document
- Buyer/seller messaging

**Tagline:** Frula Homes — Sell it yourself.

**Scope decision (April 2026):** Frula Homes is a pure DIY FSBO experience for now.
Missa is intentionally NOT offering her licensed transaction-coordinator services
through the platform until she has more on-the-ground experience as a Minnesota
realtor. See "Possible Future Enhancements" below.

---

## The Person Building This

**Missa** (Melissa Freundschuh-Pula) — Software Engineer at TransImpact,
Bemidji MN. Stack: Angular, TypeScript, StencilJS, NestJS, Webpack, Sass.
Owns a company-wide design system with 50+ Storybook components.
M.S. Software Engineering, B.S. Mathematics.

She is also pursuing a Minnesota real estate license through Edina Realty's
LaunchER program (they paid for her 90-hour prelicense coursework in exchange
for her keeping her license with them for 1 year post-licensing).

**This is a solo project — just Missa and Claude building it together.**

**Her partner is Chrissy** — visual artist and band director. The name
"Frula" comes from the first two and last two letters of Missa's last name
(Freundschuh-Pula → Fr + ula). "Chrissa" (Chrissy + Missa) was also
considered but chrissa.com was taken.

---

## Key Decisions Already Made

### Name & Brand

- **Company name:** Frula Homes
- **Domain:** frulahomes.com (registered on Cloudflare)
- **Instagram:** @frulahomes
- **Facebook:** Frula Homes page created
- **Logo/brand:** Not yet designed

### Tech Stack

- **Frontend:** Nuxt 3 + TypeScript (mobile-first)
- **Backend:** NestJS + TypeScript
- **Database:** Supabase (Postgres + PostGIS + Auth)
- **File storage:** Cloudinary (free tier)
- **Maps:** Mapbox GL JS (50k free loads/month)
- **Email:** Resend (3k free/month)
- **Payments:** Stripe (Phase 2)
- **IDE:** VS Code (free — NOT JetBrains, which is work-paid)
- **Dev machine:** SilverFox — HP ENVY 17, Windows 11, i7, 32GB RAM, WSL2 installed
- **Repo:** Private GitHub repo (not yet created — next step)

### CMA Strategy

- Build our own CMA engine using FREE MN public parcel data
- Data source: MN Geospatial Commons (gisdata.mn.gov)
- Start with Beltrami + neighboring counties (Hubbard, Clearwater, Cass, Koochiching)
- PostGIS radius queries to find comparable sales
- Weighted scoring by: recency, sq footage match, bed/bath match, distance
- Adjustment factors: condition, garage (+$15k), finished basement (+$25/sqft)
- Claude API generates a narrative explanation of the estimate
- Weekly/monthly cron jobs keep data fresh
- Sellers' completed sales become our best long-term comp data (the moat)
- Label output clearly: "Seller Market Estimate — not a licensed appraisal"

### Monetization

| Tier     | Price | Includes                                           |
| -------- | ----- | -------------------------------------------------- |
| Basic    | $49   | 30-day listing, 15 photos, CMA                     |
| Standard | $99   | 90-day listing, 40 photos, CMA + refresh, featured |
| Premium  | $199  | 6-month listing, unlimited photos, top placement   |

_Note: TC service tiers are deferred — see "Possible Future Enhancements" below._

### Legal / Business Notes

- Missa signed Edina Realty LaunchER agreement (March 20, 2026)
- Agreement only covers tuition reimbursement + 5 conditions
- NO outside business restrictions, NO non-compete, NO IP assignment
- No legal obligation to disclose Frula Homes to Edina Realty
- Once licensed: TC services must flow through sponsoring broker (MN state law)
- Platform itself (tech/listings/CMA) requires NO broker involvement
- Built on personal laptop (SilverFox) — NOT work laptop, NOT work IDE
- Frula Homes IP belongs entirely to Missa

---

## What's Already Built

### Database (supabase/schema.sql)

All 12 tables created with RLS policies:

- profiles, listings, listing_photos, listing_documents
- parcels (MN public data), cma_reports
- messages, saved_listings, transactions
- checklist_templates, transaction_checklists
- listing_plans (monetization), search_alerts

PostGIS enabled for geo radius queries.

### Database Functions (supabase/functions.sql)

- `find_comps()` — PostGIS function that finds comparable sales within radius
- Auto-syncs lat/lng → geography column on insert/update

### Seed Data (supabase/seed.sql)

- MN Residential Seller Checklist — 20 items across 5 phases
- MN Residential Buyer Checklist — 17 items across 5 phases
- All items have: phase, description, due_offset_days, guide_key

### NestJS API (apps/api/src/)

- main.ts — bootstrap with validation, CORS, Swagger docs
- app.module.ts — all modules wired up
- cma/cma.service.ts — full CMA algorithm (comp finding, scoring, calculation, narrative)
- parcels/parcel-sync.service.ts — weekly/monthly cron jobs for data freshness

### Landing Page

- Designed and built (shown in Claude conversation)
- Shows: hero, stats, 5 feature cards, 3 pricing tiers
- Uses Playfair Display + DM Sans fonts
- Brand color: #1D9E75 (teal/green)

---

## What Needs to Be Built Next (Priority Order)

1. **Private GitHub repo** — create `frula-homes` repo, push scaffold
2. **Supabase project** — create free project, run schema/functions/seed SQL
3. **Nuxt 3 frontend scaffold** — project setup, Tailwind, Mapbox, Supabase client
4. **Listing browse page** — mobile-first, map + list view, filters
5. **Listing detail page** — photo gallery, details, CMA report, contact seller
6. **Listing creation form** — seller flow, photo upload, auto-fill from parcel data
7. **CMA report display** — value range, comp cards on map, AI narrative
8. **Auth flow** — sign up, sign in, profile
9. **Transaction checklists UI** — buyer and seller views, completion tracking
10. **Paperwork guide pages** — document-by-document walkthroughs
11. **Messaging system** — buyer/seller Q&A
12. **Coming soon page** — point frulahomes.com at something while building
13. **Stripe integration** — listing payment tiers
14. **Admin dashboard** — parcel import, listing moderation

---

## Possible Future Enhancements (deferred — not on current roadmap)

- **Licensed TC services from Missa** — document review (~$149), transaction
  coordination (~$399), and full representation. Deferred until Missa has more
  on-the-ground experience as a licensed MN realtor. Market rate for TC is
  $300-$600 (a local Bemidji agent quoted $2,000, way over market). When this
  comes back on the roadmap: add a "Hire Missa" feature card to the landing
  page, a TC services pricing section, a booking flow, and corresponding
  monetization tiers. Until then, Frula Homes stays a pure DIY experience.

---

## Mobile-First Rules (Non-Negotiable)

- 74% of homebuyers search on mobile
- Design 375px wide first, enhance for desktop
- Bottom nav on mobile, top nav on desktop
- Minimum 44px tap targets
- Swipeable photo galleries
- One-tap to contact seller
- Auto-save forms (sellers get phone calls mid-fill)
- Page load under 3 seconds on mobile

---

## File Structure

```
frula-homes/  (rename from fsbo-platform)
├── apps/
│   ├── web/          ← Nuxt 3 frontend (not yet scaffolded)
│   └── api/          ← NestJS backend (partially scaffolded)
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── cma/cma.service.ts
│           └── parcels/parcel-sync.service.ts
├── packages/
│   └── shared/       ← Shared types (not yet built)
├── supabase/
│   ├── schema.sql    ✅ complete
│   ├── functions.sql ✅ complete
│   └── seed.sql      ✅ complete
├── .env.example      ✅ complete
├── README.md         ✅ complete
└── CLAUDE.md         ← this file
```

---

## Environment Variables Needed

All documented in .env.example:

- SUPABASE_URL + keys (get from supabase.com project settings)
- ANTHROPIC_API_KEY (for CMA narratives)
- CLOUDINARY credentials (for photo uploads)
- MAPBOX_TOKEN (for maps)
- RESEND_API_KEY (for emails)
- STRIPE keys (Phase 2)

---

## Vibe / Tone Notes

- Missa is direct, excited, technically strong
- She does not want over-hedged answers — be direct and confident
- This is a real business, not a toy project — treat it that way
- She is building this on evenings/weekends around a full-time job + family
- Every session should produce something real and shippable
- She uses "we" when talking about the project — lean into that

---

## Session Log

### Session 1 (April 2026)

- Conceived the idea
- Researched CMA data providers (ATTOM $500/mo, Estated $179/mo, BatchData $0.01/call)
- Decided to build our own CMA on free MN public data
- Designed full data model (12 tables)
- Designed monetization strategy
- Added transaction checklists + paperwork guides + "hire me" TC services
- Researched TC market rates ($300-$600 — local agent quoted $2,000)
- Built: schema.sql, functions.sql, seed.sql, CMA service, parcel sync service
- Built: landing page design
- Named the company: Frula Homes
- Registered: frulahomes.com, @frulahomes Instagram, Frula Homes Facebook
- Reviewed Edina Realty agreement — no restrictions on outside business
- Confirmed: build on personal laptop (SilverFox) with VS Code
- Next: GitHub repo + Nuxt 3 frontend

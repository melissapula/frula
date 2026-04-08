# 🏠 Frula Homes — Project Context for Claude

> Read this file at the start of every session to get fully up to speed.
> Last updated: April 2026

---

## What Is Frula Homes?

Frula Homes (frulahomes.com) is a national For Sale By Owner (FSBO) real estate
platform built for people who want to sell their home without paying agent
commissions. Think Zillow — except Zillow no longer lets sellers manage their
own listings, and traditional agents charge 5-6% commission.

Frula Homes is a TECH PLATFORM, not a real estate service. This distinction
is intentional and important. No licensed services are offered. No
representation. No transaction coordination. This puts Frula Homes in the
same legal category as TurboTax or LegalZoom — guiding users through a
complex process without doing it for them.

**Tagline:** Frula Homes — Sell it yourself.

---

## What Frula Homes Does

```
├── Listing platform (national, all 50 states)
│     ├── Any seller in any state can list
│     ├── Photo uploads, map search, filters
│     ├── Residential, land, commercial, multi-family
│     └── Buyer/seller direct messaging
│
├── CMA tool (phased by state)
│     ├── Start with MN public parcel data (free)
│     ├── Expand state by state as data sources added
│     └── Clearly labeled: "Seller Market Estimate —
│         not a licensed appraisal"
│
├── Smart transaction checklists (national)
│     ├── Seller checklist — state-specific, dynamic
│     ├── Buyer checklist — state-specific, dynamic
│     ├── Due dates calculated from closing date
│     └── Phase-based: immediately / disclosure /
│         inspection / pre-closing / closing
│
└── Paperwork guides (national, phased)
      ├── Federal docs — day one (lead paint, HUD-1,
      │   closing disclosure — apply in all states)
      ├── MN-specific docs — day one (deep expertise)
      └── Other states — added over time
```

## What Frula Homes Does NOT Do

- ❌ No licensed real estate representation
- ❌ No transaction coordination services
- ❌ No document preparation (guides users to prepare
  their own — never fills out docs for them)
- ❌ No MLS access at launch (Phase 2 consideration)

The line: guiding someone through filling out a document
themselves = fine. Filling it out for them = practicing law.
Always stay on the right side of that line.

---

## The Person Building This

**Missa** (Melissa Freundschuh-Pula) — Software Engineer at TransImpact,
Bemidji MN. Stack: Angular, TypeScript, StencilJS, NestJS, Webpack, Sass.
Owns a company-wide design system with 50+ Storybook components.
M.S. Software Engineering, B.S. Mathematics. U.S. Marine Corps veteran.

She is also pursuing a Minnesota real estate license through Edina Realty's
LaunchER program (they paid for her 90-hour prelicense coursework in exchange
for her keeping her license with Edina for 1 year post-licensing). Her real
estate knowledge deeply informs the product — but the platform itself requires
no license to operate.

**This is a solo project — just Missa and Claude building it together.**

**Her partner is Chrissy** — visual artist and band director. The name
"Frula" comes from the first two and last two letters of Missa's last name
(Freundschuh-Pula → Fr + ula).

---

## Key Decisions Already Made

### Name & Brand

- **Company name:** Frula Homes
- **Domain:** frulahomes.com (registered on Cloudflare)
- **Instagram:** @frulahomes
- **Facebook:** Frula Homes page created
- **Brand color:** #1D9E75 (teal/green)
- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Logo:** Not yet designed

### Tech Stack

- **Frontend:** Nuxt 3 + TypeScript + Tailwind CSS (mobile-first)
- **Backend:** NestJS + TypeScript
- **Database:** Supabase (Postgres + PostGIS + Auth)
- **File storage:** Cloudinary (free tier — 25GB)
- **Maps:** Mapbox GL JS (50k free loads/month)
- **Geocoding:** Nominatim / OpenStreetMap (free)
- **Email:** Resend (3k free/month)
- **Payments:** Stripe (Phase 2)
- **IDE:** VS Code (free)
- **Dev machine:** SilverFox — HP ENVY 17, Windows 11,
  i7-1195G7, 32GB RAM, WSL2 installed
- **Repo:** Private GitHub repo (create next session)

### CMA Strategy

- Build our own CMA engine using FREE public data
- Start with MN Geospatial Commons (gisdata.mn.gov)
- Initial counties: Beltrami, Hubbard, Clearwater, Cass, Koochiching
- PostGIS radius queries find comparable sales
- Weighted scoring: recency, sqft match, bed/bath, distance
- Adjustment factors: condition, garage (+$15k MN), finished basement (+$25/sqft)
- Claude API generates plain-English narrative of the estimate
- Weekly/monthly cron jobs keep data fresh
- Platform's own completed sales become best long-term comp data (the moat)
- Expand to other states' public data sources over time

### Monetization

| Revenue Stream       | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| Basic listing        | $49 — 30 days, 15 photos, CMA                                |
| Standard listing     | $99 — 90 days, 40 photos, CMA + refresh, featured            |
| Premium listing      | $199 — 6 months, unlimited photos, top placement             |
| Listing boost        | $19/week to resurface in search                              |
| Affiliate referrals  | Title companies, inspectors, photographers pay for placement |
| State guide upgrades | $19 for full state-specific paperwork guide (basic is free)  |
| Data/market reports  | Long-term — anonymized trend data for investors              |

**No commission. No percentage of sale. No TC fees.**

### Competitive Position

Frula Homes is NOT trying to compete with Houzeo on MLS access.
The differentiator is experience depth — specifically post-offer guidance
that no competitor provides well:

| Feature               | Competitors      | Frula Homes       |
| --------------------- | ---------------- | ----------------- |
| Listing platform      | ✅               | ✅                |
| MLS access            | ✅               | ❌ Phase 2        |
| Built-in CMA          | Basic/none       | ✅ Full engine    |
| Post-offer checklists | ❌               | ✅ Dynamic        |
| Paperwork guides      | ❌               | ✅ State-specific |
| National from day one | ✅               | ✅                |
| Closing fee           | Some charge 0.5% | ❌ Never          |
| Licensed services     | Some             | ❌ intentionally  |

The TurboTax analogy: TurboTax didn't replace accountants for everyone.
But it served the people who were capable of doing it themselves and just
needed guidance. Frula Homes is TurboTax for real estate transactions.

---

## Legal Notes

- Platform is educational technology, not a real estate service
- No state real estate licenses required to operate
- Standard disclaimers on all content:
  "This is educational information, not legal or real estate advice"
- CMA output labeled: "Seller Market Estimate — not a licensed appraisal"
- Document guides help users fill out their own forms — never fill for them
- Missa's Edina Realty LaunchER agreement has NO outside business restrictions
- No obligation to disclose Frula Homes to Edina Realty
- Built on personal laptop (SilverFox) with free tools — IP belongs to Missa

---

## What's Already Built

### Database (supabase/schema.sql) ✅

12 tables with RLS policies and PostGIS:
profiles, listings, listing_photos, listing_documents,
parcels, cma_reports, messages, saved_listings,
transactions, checklist_templates, transaction_checklists,
listing_plans, search_alerts

### Database Functions (supabase/functions.sql) ✅

- find_comps() — PostGIS radius search for comparable sales
- Auto-sync lat/lng → geography on insert/update

### Seed Data (supabase/seed.sql) ✅

- MN Residential Seller Checklist — 20 items, 5 phases
- MN Residential Buyer Checklist — 17 items, 5 phases

### NestJS API (apps/api/src/) ✅

- main.ts — bootstrap, CORS, Swagger
- app.module.ts — all modules wired
- cma/cma.service.ts — full CMA algorithm
- parcels/parcel-sync.service.ts — cron sync jobs

### Landing Page ✅

- Designed (Playfair Display + DM Sans, #1D9E75)
- Hero, stats, 6 feature cards, 3 pricing tiers
- Needs to be converted to Nuxt component

---

## What Needs to Be Built (Priority Order)

1. **Private GitHub repo** — create `frula-homes`, push scaffold
2. **Rename project** — fsbo-platform → frula-homes everywhere
3. **Supabase project** — create free project, run SQL files in order
4. **Coming soon page** — point frulahomes.com at something now
5. **Nuxt 3 frontend scaffold** — Tailwind, Mapbox, Supabase client
6. **Listing browse page** — mobile-first, map + list view, filters
7. **Listing detail page** — photo gallery, details, CMA, contact
8. **Listing creation form** — seller flow, photo upload, parcel autofill
9. **CMA report display** — value range, comp cards, AI narrative
10. **Auth flow** — sign up, sign in, profile
11. **Checklist UI** — buyer + seller views, completion tracking
12. **Paperwork guide pages** — document walkthroughs (MN first)
13. **Messaging system** — buyer/seller Q&A threads
14. **Stripe integration** — listing payment tiers
15. **Affiliate system** — referral placements for local service providers
16. **Admin dashboard** — parcel import, listing moderation
17. **State expansion** — add public data sources + guides per state

---

## Mobile-First Rules (Non-Negotiable)

- 74% of homebuyers search on mobile — design for them first
- Build 375px wide first, enhance for desktop second
- Bottom nav on mobile, top nav on desktop
- Minimum 44px tap targets everywhere
- Swipeable photo galleries on listing cards and detail pages
- One-tap to message seller
- Auto-save all forms (sellers get interrupted)
- Target: page load under 3 seconds on mobile

---

## Content Strategy (SEO Moat)

Missa's real estate knowledge = content nobody else can write as well.
Target: rank #1 for "how to sell your home FSBO in [state]" queries.

- State-specific FSBO guides (MN first, expand outward)
- Document explainers ("what is a seller disclosure statement")
- Process guides ("what happens after offer accepted")
- This content drives organic traffic AND demonstrates platform authority

---

## File Structure

```
frula-homes/
├── apps/
│   ├── web/          ← Nuxt 3 (not yet scaffolded)
│   └── api/          ← NestJS (partially scaffolded)
│       └── src/
│           ├── main.ts                        ✅
│           ├── app.module.ts                  ✅
│           ├── cma/cma.service.ts             ✅
│           └── parcels/parcel-sync.service.ts ✅
├── packages/
│   └── shared/       ← Shared types (not yet built)
├── supabase/
│   ├── schema.sql    ✅
│   ├── functions.sql ✅
│   └── seed.sql      ✅
├── .env.example      ✅
├── README.md         ✅
└── CLAUDE.md         ← this file
```

---

## Environment Variables Needed

Documented in .env.example:

- SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY (CMA narratives via Claude API)
- CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET
- MAPBOX_TOKEN
- RESEND_API_KEY
- STRIPE_SECRET_KEY (Phase 2)

---

## Working Style Notes

- Missa is direct, technically strong, and excited about this
- She does not want over-hedged or wishy-washy answers
- She has asked Claude to be honest even when uncomfortable —
  not just a cheerleader (Claude confirmed it will be)
- This is a real business — treat every session as productive work time
- She builds on evenings/weekends around full-time job + family
- Every session should produce something real and shippable
- She uses "we" when talking about the project — lean into that
- When starting a session, read this file and confirm you're up to speed,
  then ask what we're tackling today

---

## Session Log

### Session 1 (April 2026)

- Conceived the idea, researched CMA providers
- Decided to build own CMA on free MN public data
- Designed full data model (12 tables)
- Designed monetization strategy
- Added transaction checklists + paperwork guides
- Researched TC market rates ($300-600; local agent quoted $2,000)
- Built: schema.sql, functions.sql, seed.sql
- Built: CMA service, parcel sync service, NestJS scaffold
- Built: landing page design
- Named company: Frula Homes
- Registered: frulahomes.com, @frulahomes Instagram, Frula Homes Facebook
- Reviewed Edina Realty agreement — no outside business restrictions
- Confirmed: build on SilverFox (personal laptop) with VS Code

### Session 1 (continued — same day, switched to personal laptop)

- Confirmed SilverFox specs are more than adequate
- WSL2 already installed ✅
- Researched existing FSBO competitors (Houzeo, ForSaleByOwner, FSBO.com etc.)
- Missa asked honest question: "are you just encouraging me or is this real?"
  Claude gave honest cold analysis — pros AND cons. Still worth building.
- **PIVOT:** Dropped licensed TC/representation services entirely
    - Removes licensing dependency
    - Removes state-by-state regulatory complexity
    - Platform is now pure tech (TurboTax model, not agent model)
    - National from day one instead of MN-only
    - Cleaner legally, faster to launch, higher ceiling
- Updated monetization to affiliate model to compensate for lost TC revenue
- Next session: GitHub repo setup + Nuxt 3 frontend scaffold

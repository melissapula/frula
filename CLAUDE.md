# 🏠 Frula Homes — Project Context for Claude

> Read this file at the start of every session to get fully up to speed.
> Last updated: April 9, 2026

---

## What Is Frula Homes?

Frula Homes (frulahomes.com) is a national For Sale By Owner (FSBO) real
estate **informational platform** built for people who want to sell their
home without paying agent commissions.

Frula Homes is a pure INFORMATION PLATFORM, not a real estate service.
This distinction is intentional and critical. No licensed services are
offered. No representation. No transaction coordination. No document
preparation. No walkthroughs of how to fill out legal forms. We provide
links to official resources, smart checklists, and buyer-seller
communication tools — and that's the line.

**Tagline:** Frula Homes — Sell it yourself.

---

## What Frula Homes Does

```
├── Listing platform (national, all 50 states)
│     ├── Any seller in any state can list (always free)
│     ├── Photo uploads w/ browser compression, map search, filters
│     ├── Residential, land, commercial, multi-family
│     ├── Buyer/seller direct messaging + structured offers + viewings
│     ├── Dream Home Finder (match-scored search for buyers)
│     └── Saved listings, notifications bell, email alerts
│
├── Market Snapshot (national, free)
│     ├── ZIP-level median home values from Zillow ZHVI (free public data)
│     ├── Year-over-year price trends per ZIP
│     ├── Nearby Frula listings within 5 miles (PostGIS)
│     ├── Listing price vs. area median comparison
│     └── Labeled: "Informational market context — not an appraisal"
│
├── Smart transaction checklists (national)
│     ├── Seller + buyer checklists, phase-based
│     ├── Due dates calculated from closing date
│     └── Cross-party realtime updates
│
├── Paperwork directory (national, all 50 states + DC)
│     ├── Federal docs: lead paint, closing disclosure, 1099-S, Fair Housing
│     ├── Concept guides: seller disclosure, purchase agreement, title
│     │   insurance, home inspection, deed types
│     ├── Per-state: auto-generated entries linking to each state's
│     │   real estate commission for official forms
│     └── State-finder widget on every concept page
│
├── Structured offers & viewing requests
│     ├── Buyer fills out offer form (price, financing, contingencies)
│     ├── Renders as an OfferCard in the inbox with Accept/Counter/Decline
│     ├── Viewing requests with date/time picker + Confirm/Decline
│     └── Both trigger email notifications via Resend
│
└── Engagement loop
      ├── In-app notification bell with realtime updates
      ├── Transactional emails (offers, viewings, messages) via Resend
      ├── Welcome email on signup/confirmation
      ├── Seller stats card (views, saves, messages — week-over-week)
      ├── Unread inbox badge in navbar
      └── Share buttons (Facebook, X, SMS, email, copy link, Web Share API)
```

## What Frula Homes Does NOT Do

- ❌ No licensed real estate representation
- ❌ No transaction coordination services
- ❌ No document preparation or review
- ❌ No walkthroughs of how to fill out legal forms
- ❌ No MLS access (Phase 2: affiliate partnership consideration)
- ❌ No programmatic display ads (Google AdSense, banner networks)
- ❌ No commissions, closing fees, or percentage of sale — ever

The line: pointing users to official resources and letting them
communicate directly = fine. Filling out forms for them, interpreting
legal documents, or representing them = practicing law. We stay firmly
on the informational side.

---

## The Person Building This

**Missa** (Melissa Freundschuh-Pula) — Software Engineer at TransImpact,
Bemidji MN. Stack: Angular, TypeScript, StencilJS, NestJS, Webpack, Sass.
Owns a company-wide design system with 50+ Storybook components.
M.S. Software Engineering, B.S. Mathematics. U.S. Marine Corps veteran.

She is also pursuing a Minnesota real estate license through Edina Realty's
LaunchER program. Her real estate knowledge informs the product — but the
platform itself requires no license to operate.

**This is a solo project — just Missa and Claude building it together.**

**Her partner is Chrissy** — visual artist and band director. The name
"Frula" comes from the first two and last two letters of Missa's last name
(Freundschuh-Pula → Fr + ula).

---

## Key Decisions (Current)

### Name & Brand

- **Company name:** Frula Homes
- **Domain:** frulahomes.com (Cloudflare)
- **Instagram:** @frulahomes
- **Facebook:** Frula Homes
- **Brand color:** #1D9E75 (teal/green)
- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Public name:** Missa (not a pseudonym — her lifelong nickname)

### Tech Stack

- **Frontend:** Nuxt 3 + TypeScript + Tailwind CSS (mobile-first)
- **Database:** Supabase (Postgres + PostGIS + Auth + RLS + Realtime)
- **File storage:** Cloudinary (free tier — 25GB)
- **Maps:** Mapbox GL JS (50k free loads/month)
- **Geocoding:** Nominatim / OpenStreetMap (free)
- **Email:** Resend (3k free/month) + Cloudflare Email Routing (free)
- **Market data:** Zillow Research ZHVI (free public CSV, attribution req'd)
- **Payments:** Stripe (Phase 2 — not yet wired)
- **Repo:** Private GitHub repo (melissapula/frula)

### Market Snapshot Strategy (replaces old CMA plan)

The original CMA plan (MN public parcel data, state-by-state ingestion)
is dead. It conflicted with the national-from-day-one positioning and
would have taken months per state.

Current approach:

- **Phase 1 (now):** Free Market Snapshot using Zillow ZHVI (ZIP-level
  median home values) + nearby Frula listings via PostGIS radius
- **Phase 2:** Optional paid CMA add-on ($9) via third-party AVM API
  (ATTOM or similar) — generates a professional report
- **Phase 3:** Frula's own completed sales become unique comp data
  (the long-term moat no competitor can replicate)

### Monetization (Updated)

**Always free to list. Always free to browse. No commission, ever.**

| Revenue Stream (Phase 2+) | Detail                                    |
| ------------------------- | ----------------------------------------- |
| Featured placement        | $19/week — top of search + Dream Home     |
| Listing refresh           | $9 — bumps to top of "newest" sort        |
| Social share kit          | $29 — auto-generated images for socials   |
| Professional CMA report   | $9 — third-party AVM-powered PDF          |
| Curated service directory | Title cos, inspectors, etc. pay placement |
| MLS syndication (Phase 3) | $99 pass-through via flat-fee MLS partner |

**No programmatic ads. No data selling. No subscriptions required.**

### Positioning

Frula Homes is an **informational platform** — NOT a brokerage, NOT an
agent, NOT a legal advisor. The differentiators vs. competitors:

| Feature                | Other FSBO Sites     | Frula Homes          |
| ---------------------- | -------------------- | -------------------- |
| Listing platform       | ✅                   | ✅ (always free)     |
| MLS access             | Some (via brokerage) | ❌ Phase 2 affiliate |
| Dream Home Finder      | ❌                   | ✅ match-scored      |
| Structured offers      | ❌                   | ✅ Accept/Counter    |
| Transaction checklists | ❌                   | ✅ realtime          |
| Paperwork directory    | ❌                   | ✅ all 50 states     |
| Market Snapshot        | Basic/none           | ✅ ZIP-level + comps |
| Commission/closing fee | Some charge 0.5%     | ❌ Never             |
| Hidden brokerage       | Many                 | ❌ Not a brokerage   |

---

## Legal Notes

- Platform is an **informational platform**, not a real estate service
- No state real estate licenses required to operate
- Disclaimers everywhere: "Informational only, not legal advice"
- Market Snapshot labeled: "Informational market context — not an appraisal"
- Paperwork section links to official sources — never hosts or fills forms
- Offers are "expressions of interest, not binding contracts"
- Missa's Edina Realty LaunchER agreement has NO outside business restrictions
- Built on personal laptop with free tools — IP belongs to Missa
- Privacy Policy + Terms of Service drafted (placeholder, needs attorney review)

---

## Critical Platform Rules

### National from Day One — No State Privilege

Frula Homes is a true 50-state platform. NO state (including MN)
gets privileged content, features, or default treatment. This has been
explicitly reaffirmed by Missa. See memory note
`project_national_from_day_one.md` for full details.

### Informational Only — No Walkthroughs

The platform provides links, checklists, and educational context. It
does NOT walk users through filling out documents field-by-field.
See memory note `project_informational_only_positioning.md`.

### Free to List — Always

Listing a home on Frula is free forever. Revenue comes from optional
paid boosts and curated sponsored service placements. See memory note
`project_pricing_direction.md`.

---

## Mobile-First Rules (Non-Negotiable)

- 74% of homebuyers search on mobile — design for them first
- Build 375px wide first, enhance for desktop second
- Minimum 44px tap targets everywhere
- Target: page load under 3 seconds on mobile

---

## What's Built (as of April 9, 2026)

### Nuxt 3 Frontend (apps/web/)

- Landing page with hero, Dream Home callout, Why Frula section, features
- Browse page with Mapbox map, color-coded markers, comprehensive filters,
  hover-sync with popovers, pin-to-expand, radius search, region search
- Listing detail page with photo gallery, all property fields, location map,
  mortgage calculator, share buttons, sidebar with offers/viewings/save
- Sell form with Cloudinary photo upload + browser compression, geocoding,
  all filter-parity fields, edit mode (?edit=id), delete
- Dream Home Finder with match scoring, min-match slider, pagination
- Paperwork directory with 50-state auto-generated entries + federal +
  concept guides + state-finder widget
- Market Snapshot page (ZIP-level Zillow data + nearby Frula listings)
- Inbox with OfferCard/ViewingCard rendering, Accept/Counter/Decline,
  flag/mark-unread/delete per thread
- Notifications bell with realtime subscription + dropdown
- Auth: login, signup, forgot-password, reset-password, welcome email
- Saved listings page + heart button + nav badge
- "How we make money" page, Privacy Policy, Terms of Service
- SiteFooter on all public pages, branded error page
- robots.txt

### Database (Supabase)

- Core: profiles, listings, listing_photos, listing_documents
- Market: parcels, zip_market_data
- Social: messages (with kind/payload for offers/viewings), saved_listings,
  notifications, listing_views
- Transactions: transactions, checklist_templates, transaction_checklists
- Commerce: listing_plans, search_alerts
- PostGIS functions: listing_ids_in_radius (returns id + distance_meters)
- RLS policies on all tables
- Realtime enabled for messages + notifications

### Server Routes (apps/web/server/)

- /api/geocode — Nominatim proxy
- /api/market-snapshot — ZIP data + nearby listings + comparisons
- /api/notifications/send — transactional email (offer/viewing/message)
- /api/notifications/save — save-notification for listing owners
- /api/notifications/welcome — one-time welcome email

### Scripts

- scripts/ingest-zillow-zhvi.mjs — downloads + parses Zillow ZHVI CSV,
  bulk-upserts ~30k ZIPs into zip_market_data

### NestJS API (apps/api/src/) — legacy, partially scaffolded

- cma/cma.service.ts — original CMA algorithm (superseded by Market Snapshot)
- parcels/parcel-sync.service.ts — original parcel cron (superseded)

---

## What's Left to Build (Priority Order)

1. **Account dashboard refresh** — seller command center with listings, stats,
   messages, saves, notifications
2. **Photo gallery lightbox** — fullscreen, arrow keys, swipe, counter
3. **Public seller profile pages** — click name → see all their listings
4. **Dynamic sitemap.xml** — server route generating XML for SEO
5. **Search alerts UI** — manage dream-home email preferences
6. **Stripe integration** — wire up listing boosts when Phase 2 hits
7. **Curated service directory** — title companies, inspectors, etc.
8. **Link health checker** — GitHub Actions cron for paperwork URLs
9. **Cloudinary → R2 migration** — when approaching 1,500 active listings

---

## Environment Variables

Documented in .env.example + apps/web/.env:

- SUPABASE_URL + SUPABASE_KEY + SUPABASE_SERVICE_ROLE_KEY
- CLOUDINARY_CLOUD_NAME + CLOUDINARY_UPLOAD_PRESET
- MAPBOX_TOKEN
- RESEND_API_KEY
- EMAIL_FROM + EMAIL_REPLY_TO
- PUBLIC_SITE_URL

---

## Working Style Notes

- Missa is direct, technically strong, and excited about this
- She wants Claude to be enthusiastic AND honest — warm energy by default,
  but flag structural problems clearly when she proposes new ideas
- She does NOT want walkthrough-style content or MN-privileged features
- This is a real business — treat every session as productive work time
- She builds on evenings/weekends around full-time job + family
- Every session should produce something real and shippable
- She uses "we" when talking about the project — lean into that
- Build first, polish styling later — feature breadth before visual polish

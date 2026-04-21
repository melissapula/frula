# Frula Homes

> Sell your home. Keep the commission.

**Frula Homes** is a nationwide For Sale By Owner (FSBO) informational
platform built for people who want to sell their home without paying
agent commissions. Free to list, free to browse, no commission — ever.

**Live at [frulahomes.com](https://frulahomes.com)**

---

## What It Does

- **Listing platform** — any seller in any state can list for free, with
  photo uploads, map search, and comprehensive filters
- **Dream Home Finder** — buyers describe their ideal home and every
  listing in the country is match-scored and ranked
- **Structured offers & viewings** — buyers send offers with price,
  financing, and contingencies; sellers accept/counter/decline
- **Buyer/seller messaging** — direct inbox with real-time updates and
  email notifications
- **Market Snapshot** — ZIP-level median home values from Zillow ZHVI
  with nearby Frula listings for context
- **Paperwork directory** — links to official forms for all 50 states +
  DC, organized by transaction phase
- **Smart checklists** — seller prep and buyer guide checklists with
  progress tracking

## What It Does NOT Do

Frula Homes is an **informational platform**, not a brokerage. No
licensed services, no representation, no document preparation, no
walkthroughs of how to fill out legal forms. We provide links to
official resources, checklists, and communication tools.

---

## Tech Stack

| Layer       | Tech                                 |
| ----------- | ------------------------------------ |
| Frontend    | Nuxt 3 + TypeScript + Tailwind CSS   |
| Database    | Supabase (Postgres + PostGIS + Auth) |
| Storage     | Cloudinary (photo uploads)           |
| Maps        | Mapbox GL JS                         |
| Geocoding   | Nominatim / OpenStreetMap            |
| Email       | Resend (transactional)               |
| Market data | Zillow Research ZHVI                 |
| Hosting     | Cloudflare Pages                     |
| Monitoring  | Sentry                               |

---

## Project Structure

```
fsbo-platform/
├── apps/
│   └── web/              # Nuxt 3 app (frontend + server routes)
│       ├── app/
│       │   ├── pages/    # All routes
│       │   ├── components/
│       │   ├── composables/
│       │   └── plugins/
│       ├── server/
│       │   ├── api/      # Nitro server routes
│       │   ├── middleware/# Security headers
│       │   ├── routes/   # Sitemap
│       │   └── utils/    # Rate limiter, scoring
│       └── public/       # Static assets, favicon, manifest
├── supabase/
│   ├── schema.sql        # Core tables + RLS policies
│   ├── functions.sql     # PostGIS helpers
│   ├── seed.sql          # Checklist templates
│   └── migrations/       # Incremental schema changes
├── scripts/
│   └── ingest-zillow-zhvi.mjs  # ZIP market data loader
└── .env.example
```

---

## Getting Started

### 1. Supabase

Create a project at [supabase.com](https://supabase.com), then run
in the SQL Editor (in order):

1. `supabase/schema.sql`
2. `supabase/functions.sql`
3. `supabase/seed.sql`
4. All files in `supabase/migrations/` (any order)

### 2. Environment

```bash
cp .env.example apps/web/.env
# Fill in Supabase, Cloudinary, Mapbox, Resend keys
```

### 3. Install & Run

```bash
npm install
npm run dev
```

App runs at `http://localhost:3000`.

### 4. Zillow Data (optional)

Populate ZIP-level market data for the Market Snapshot feature:

```bash
set -a && source apps/web/.env && set +a && node scripts/ingest-zillow-zhvi.mjs
```

---

## Deployment

Deployed to **Cloudflare Pages** with automatic builds on push to `main`.

- Build command: `npm run build`
- Root directory: `apps/web`
- Environment variables set in Cloudflare Pages dashboard

---

## License

Private repository. All rights reserved.

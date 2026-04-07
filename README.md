# 🏠 FSBO Platform

> For Sale By Owner — built for real people, not real estate agents.

A full-stack FSBO listing platform with built-in CMA (Comparable Market Analysis),
smart transaction checklists, and optional paperwork support.

---

## Stack

| Layer    | Tech                          |
| -------- | ----------------------------- |
| Frontend | Nuxt 3 + TypeScript           |
| Backend  | NestJS + TypeScript           |
| Database | Supabase (Postgres + PostGIS) |
| Auth     | Supabase Auth                 |
| Storage  | Cloudinary                    |
| Maps     | Mapbox GL JS                  |
| Email    | Resend                        |
| Payments | Stripe (Phase 2)              |

---

## Project Structure

```
fsbo-platform/
├── apps/
│   ├── web/          # Nuxt 3 frontend
│   └── api/          # NestJS backend
├── packages/
│   └── shared/       # Shared types/utilities
├── supabase/
│   ├── schema.sql    # Run first — creates all tables
│   ├── functions.sql # Run second — PostGIS functions
│   └── seed.sql      # Run third — MN checklist templates
└── .env.example      # Copy to .env and fill in values
```

---

## Getting Started

### 1. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run in order:
    - `supabase/schema.sql`
    - `supabase/functions.sql`
    - `supabase/seed.sql`
3. Copy your `SUPABASE_URL` and keys from Project Settings → API

### 2. Environment Variables

```bash
cp .env.example .env
# Fill in your Supabase, Cloudinary, Mapbox, etc. keys
```

### 3. Install Dependencies

```bash
yarn install
```

### 4. Start Development

```bash
# Start both API and web simultaneously
yarn dev

# Or individually:
yarn dev:api   # NestJS on :3001
yarn dev:web   # Nuxt on :3000
```

### 5. API Docs

Visit `http://localhost:3001/docs` for Swagger UI

---

## MN Parcel Data Import

1. Download statewide parcel data from [gisdata.mn.gov](https://gisdata.mn.gov)
2. Go to: Layers → Cadastral → MN Statewide Parcel Dataset
3. Download the CSV for your target counties
4. Use the admin import endpoint:
    ```
    POST /api/parcels/import
    Content-Type: multipart/form-data
    ```

---

## Key Features

- ✅ Property listings (residential, land, commercial, multi-family)
- ✅ Photo uploads via Cloudinary
- ✅ Map-based search with Mapbox
- ✅ CMA engine using MN public parcel data + PostGIS
- ✅ AI-generated CMA narrative (Claude API)
- ✅ Transaction checklists for buyer + seller (MN-specific)
- ✅ Document guides for MN paperwork
- ✅ Buyer/seller messaging
- ✅ Saved listings + search alerts
- 🔜 Stripe payment tiers
- 🔜 Admin dashboard
- 🔜 Email notifications (Resend)
- 🔜 Multi-state expansion

---

## License

Private — not open source (yet 😄)

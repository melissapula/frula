# Supabase SQL Migration Checklist

Run these in order in the **Supabase SQL Editor** before testing.
Each file is idempotent (safe to re-run) thanks to `IF NOT EXISTS`
and `IF EXISTS` guards.

## Core schema (run these first, in order)

1. **`schema.sql`** — Core tables: profiles, listings, listing_photos,
   listing_documents, parcels, cma_reports, messages, saved_listings,
   transactions, checklist_templates, transaction_checklists,
   listing_plans, search_alerts. Plus PostGIS extension, RLS policies,
   and the auth trigger.

2. **`functions.sql`** — PostGIS helper functions + auto lat/lng→geography
   sync trigger.

3. **`seed.sql`** — MN residential checklist templates (seller + buyer).

## Schema extensions (run after core, any order)

4. **`listings_radius.sql`** — `listing_ids_in_radius()` PostGIS RPC
   returning (id, distance_meters) ordered by distance.

5. **`listings_features.sql`** — Adds waterfront, water_body_name,
   view_types[], features[] columns + GIN indexes.

6. **`listings_terrain.sql`** — Adds terrain[], road_access, utilities[]
   columns + GIN indexes.

7. **`listings_more_fields.sql`** — Adds single_story, pets_allowed,
   large_dogs_ok, parking_spaces, rent_period, lease_term_months,
   available_from, furnished + listing_type index.

8. **`listings_dedupe.sql`** — Partial unique index preventing duplicate
   active listings at the same address. ⚠️ Will fail if duplicates
   already exist — delete them first.

9. **`messages_kinds.sql`** — Adds kind + payload columns to messages
   for structured offers/viewings.

10. **`messages_flagged.sql`** — Adds flagged boolean to messages.

11. **`notifications.sql`** — notifications table + RLS.

12. **`listing_views.sql`** — listing_views table for seller stats + RLS.

13. **`profiles_welcomed_at.sql`** — Adds welcomed_at column to profiles
    for idempotent welcome emails.

14. **`zip_market_data.sql`** — ZIP-level market data table for the
    Market Snapshot feature.

## RLS patches (run if not already included in schema.sql)

15. **`listings_rls.sql`** — Additional RLS policies if needed.
16. **`messages_rls.sql`** — Additional message RLS policies.
17. **`transactions_rls.sql`** — Transaction RLS policies.

## Seed data (optional, for testing)

18. **`seed_mock_listings.sql`** — 2 land parcels + 1 commercial property
    (MN). Uses the first profile as owner.

19. **`seed_listings.sql`** — Larger seed set if it exists.

## Post-migration: Zillow ZHVI ingestion (optional)

After running the SQL above, populate ZIP-level market data by running
the ingestion script from the project root:

```bash
set -a && source apps/web/.env && set +a && node scripts/ingest-zillow-zhvi.mjs
```

This downloads ~30k ZIPs of Zillow data and takes about 2 minutes.

## Quick verification

After running all migrations, verify in the Table Editor that you see:

- profiles (with welcomed_at column)
- listings (with waterfront, features, terrain, etc.)
- listing_photos
- messages (with kind, payload, flagged columns)
- saved_listings
- notifications
- listing_views
- transactions
- transaction_checklists
- checklist_templates
- search_alerts
- zip_market_data (populated after ZHVI ingestion)

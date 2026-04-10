# Test Card 00 — Pre-Test Setup

**Priority:** MUST DO FIRST
**Do this before running any other test card.**

---

## Database migrations

Run ALL of these in the **Supabase SQL Editor**, in order.
See `supabase/MIGRATION_CHECKLIST.md` for details.

- [ ] `schema.sql`
- [ ] `functions.sql`
- [ ] `seed.sql`
- [ ] `listings_radius.sql`
- [ ] `listings_features.sql`
- [ ] `listings_terrain.sql`
- [ ] `listings_more_fields.sql`
- [ ] `listings_dedupe.sql`
- [ ] `messages_kinds.sql`
- [ ] `messages_flagged.sql`
- [ ] `notifications.sql`
- [ ] `listing_views.sql`
- [ ] `profiles_welcomed_at.sql`
- [ ] `zip_market_data.sql`
- [ ] `listings_rls.sql` (if exists)
- [ ] `messages_rls.sql` (if exists)
- [ ] `transactions_rls.sql` (if exists)

## Seed test data

- [ ] Run `seed_test_listings.sql` in the SQL Editor
      (creates 10 diverse listings across 8 states)

## Zillow market data

From the project root terminal:

```bash
set -a && source apps/web/.env && set +a && node scripts/ingest-zillow-zhvi.mjs
```

- [ ] Verify "✅ Done!" output with ~30k records upserted

## Rotate exposed keys

Both of these were pasted in chat and should be rotated:

- [ ] **Supabase service role key:**
      Go to Supabase Dashboard → Settings → API → Reset service role key →
      copy new key → update `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env`

- [ ] **Resend API key:**
      Go to Resend Dashboard → API Keys → delete `frula-supabase-smtp` →
      create new key with same name + Sending access → copy →
      update `RESEND_API_KEY` in `apps/web/.env` AND update the Supabase
      SMTP password (Settings → Auth → SMTP → Password field)

## Start the dev server

```bash
npm run dev
```

- [ ] Verify the app loads at `http://localhost:3000`
- [ ] Verify the browse page shows the 10 seed listings

## Create two test accounts

You'll need two accounts for buyer/seller testing:

- [ ] **Account A (Seller):** Sign up with a real email you can check
- [ ] **Account B (Buyer):** Sign up with a DIFFERENT real email you can check
- [ ] Verify both received welcome emails

## You're ready!

Start with Test Card 01 and work through them in order.
Cards 01-09 are critical path. Cards 10-14 are important but
less likely to block real users.

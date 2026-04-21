-- =============================================
-- FSBO PLATFORM — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor
-- =============================================

-- Enable PostGIS for geo queries (comps within radius)
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================
-- USERS (extends Supabase auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- LISTINGS
-- =============================================
CREATE TABLE public.listings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Status
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','pending','sold','expired','withdrawn')),

  -- Location
  address             TEXT NOT NULL,
  city                TEXT NOT NULL,
  state               TEXT NOT NULL DEFAULT 'MN',
  zip                 TEXT NOT NULL,
  county              TEXT,
  lat                 DECIMAL(10, 7),
  lng                 DECIMAL(10, 7),
  location            GEOGRAPHY(POINT, 4326), -- PostGIS for radius queries
  parcel_id           TEXT, -- County APN / parcel number

  -- Property type
  property_type       TEXT NOT NULL DEFAULT 'residential'
                        CHECK (property_type IN ('residential','land','commercial','multi-family','condo')),
  listing_type        TEXT NOT NULL DEFAULT 'for_sale'
                        CHECK (listing_type IN ('for_sale','for_rent')),

  -- Price
  price               DECIMAL(12, 2) NOT NULL,
  price_reduced_from  DECIMAL(12, 2),

  -- Physical details
  sqft                INTEGER,
  lot_size            DECIMAL(10, 4),
  lot_unit            TEXT DEFAULT 'acres' CHECK (lot_unit IN ('acres','sqft')),
  beds                INTEGER,
  full_baths          INTEGER,
  three_quarter_baths INTEGER,
  half_baths          INTEGER,
  year_built          INTEGER,
  garage              BOOLEAN DEFAULT FALSE,
  garage_stalls       INTEGER,
  basement            BOOLEAN DEFAULT FALSE,
  basement_finished   BOOLEAN DEFAULT FALSE,
  stories             DECIMAL(3,1),

  -- Narrative
  title               TEXT,
  description         TEXT,
  highlights          JSONB DEFAULT '[]', -- ["New roof 2022", "Updated kitchen"]

  -- Utilities / features (MN-relevant)
  heat_type           TEXT, -- forced air, radiant, etc
  water_source        TEXT CHECK (water_source IN ('city','well','other')),
  sewer_type          TEXT CHECK (sewer_type IN ('city','septic','other')),
  hoa                 BOOLEAN DEFAULT FALSE,
  hoa_fee             DECIMAL(8,2),
  hoa_frequency       TEXT CHECK (hoa_frequency IN ('monthly','quarterly','annual')),

  -- Meta
  views               INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,
  days_on_market      INTEGER DEFAULT 0,
  listed_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  sold_at             TIMESTAMPTZ,
  sold_price          DECIMAL(12,2),

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for geo queries
CREATE INDEX listings_location_idx ON public.listings USING GIST (location);
CREATE INDEX listings_status_idx ON public.listings (status);
CREATE INDEX listings_property_type_idx ON public.listings (property_type);
CREATE INDEX listings_zip_idx ON public.listings (zip);

-- =============================================
-- LISTING PHOTOS
-- =============================================
CREATE TABLE public.listing_photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order    INTEGER DEFAULT 0,
  is_primary    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- LISTING DOCUMENTS (disclosures, surveys, etc)
-- =============================================
CREATE TABLE public.listing_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  label         TEXT NOT NULL, -- "Seller Disclosure", "Well Inspection", etc
  url           TEXT NOT NULL,
  is_public     BOOLEAN DEFAULT FALSE, -- visible to buyers?
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- PARCEL DATA (from MN public records)
-- Updated via cron job
-- =============================================
CREATE TABLE public.parcels (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id           TEXT UNIQUE NOT NULL, -- County APN
  address             TEXT,
  city                TEXT,
  state               TEXT DEFAULT 'MN',
  zip                 TEXT,
  county              TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  location            GEOGRAPHY(POINT, 4326),

  -- Property characteristics
  property_class      TEXT, -- residential, agricultural, etc
  sqft                INTEGER,
  lot_size            DECIMAL(10,4),
  beds                INTEGER,
  baths               DECIMAL(4,1),
  year_built          INTEGER,
  garage              BOOLEAN,

  -- Valuation
  assessed_value      DECIMAL(12,2),
  estimated_market_value DECIMAL(12,2),
  tax_year            INTEGER,

  -- Sale history
  last_sale_price     DECIMAL(12,2),
  last_sale_date      DATE,

  -- Data freshness
  data_source         TEXT DEFAULT 'mn_parcel',
  source_updated_at   DATE,
  imported_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX parcels_location_idx ON public.parcels USING GIST (location);
CREATE INDEX parcels_zip_idx ON public.parcels (zip);
CREATE INDEX parcels_last_sale_date_idx ON public.parcels (last_sale_date);

-- =============================================
-- CMA REPORTS
-- =============================================
CREATE TABLE public.cma_reports (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,

  -- Estimate
  low_estimate      DECIMAL(12,2),
  mid_estimate      DECIMAL(12,2),
  high_estimate     DECIMAL(12,2),
  confidence_score  INTEGER CHECK (confidence_score BETWEEN 0 AND 100),

  -- Comps used (stored as JSON array of parcel data)
  comps             JSONB DEFAULT '[]',
  methodology       TEXT,
  ai_narrative      TEXT, -- Claude-generated explanation

  -- Data quality
  data_source       TEXT DEFAULT 'mn_parcel',
  comps_avg_age_days INTEGER, -- how old are the comps on avg

  generated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MESSAGES (buyer <-> seller Q&A)
-- =============================================
CREATE TABLE public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id    UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  sender_id     UUID NOT NULL REFERENCES public.profiles(id),
  recipient_id  UUID NOT NULL REFERENCES public.profiles(id),
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX messages_listing_idx ON public.messages (listing_id);
CREATE INDEX messages_recipient_idx ON public.messages (recipient_id, is_read);

-- =============================================
-- SAVED LISTINGS (buyer watchlist)
-- =============================================
CREATE TABLE public.saved_listings (
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);

-- =============================================
-- TRANSACTIONS (post-offer)
-- =============================================
CREATE TABLE public.transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id        UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES public.profiles(id),
  buyer_id          UUID REFERENCES public.profiles(id),

  -- Key dates
  offer_accepted_at TIMESTAMPTZ,
  inspection_date   TIMESTAMPTZ,
  closing_date      TIMESTAMPTZ,
  possession_date   TIMESTAMPTZ,

  -- Financials
  offer_price       DECIMAL(12,2),
  earnest_money     DECIMAL(12,2),
  down_payment      DECIMAL(12,2),
  financing_type    TEXT CHECK (financing_type IN ('conventional','fha','va','cash','usda')),

  -- Professional help
  service_requested TEXT CHECK (service_requested IN ('none','review','tc','full')),
  service_status    TEXT DEFAULT 'pending',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- CHECKLISTS
-- =============================================
CREATE TABLE public.checklist_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('seller','buyer')),
  property_type TEXT DEFAULT 'residential',
  state         TEXT DEFAULT 'MN',
  items         JSONB NOT NULL, -- array of {id, title, description, phase, due_offset_days}
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checklist templates are public read"
  ON public.checklist_templates
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE TABLE public.transaction_checklists (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.profiles(id),
  role            TEXT NOT NULL CHECK (role IN ('seller','buyer')),
  items           JSONB NOT NULL, -- copy of template + completion state per item
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- LISTING PLANS (monetization)
-- =============================================
CREATE TABLE public.listing_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id          UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES public.profiles(id),
  plan                TEXT NOT NULL CHECK (plan IN ('basic','standard','premium')),
  amount_cents        INTEGER NOT NULL,
  stripe_payment_id   TEXT,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEARCH ALERTS
-- =============================================
CREATE TABLE public.search_alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filters         JSONB NOT NULL,
  email_frequency TEXT DEFAULT 'daily' CHECK (email_frequency IN ('instant','daily','weekly')),
  last_sent_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cma_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all, edit own
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listings: active listings are public, owners manage their own
CREATE POLICY "Active listings are public" ON public.listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "Users manage own listings" ON public.listings FOR ALL USING (auth.uid() = user_id);

-- Photos follow listing access
CREATE POLICY "Photos are public if listing is" ON public.listing_photos FOR SELECT USING (true);
CREATE POLICY "Owners manage photos" ON public.listing_photos FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Messages: only sender and recipient
CREATE POLICY "Message participants only" ON public.messages FOR ALL USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Saved listings: own only
CREATE POLICY "Own saved listings" ON public.saved_listings FOR ALL USING (auth.uid() = user_id);

-- Transactions: seller or buyer
CREATE POLICY "Transaction parties only" ON public.transactions FOR ALL USING (
  auth.uid() = seller_id OR auth.uid() = buyer_id
);

-- Listing documents: public docs viewable, owners manage their own
CREATE POLICY "Public documents are viewable" ON public.listing_documents FOR SELECT USING (
  is_public = TRUE AND listing_id IN (SELECT id FROM public.listings WHERE status = 'active')
);
CREATE POLICY "Owners manage documents" ON public.listing_documents FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Listing plans: tied to listing ownership
CREATE POLICY "Users manage own listing plans" ON public.listing_plans FOR ALL USING (
  auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Search alerts: own only
CREATE POLICY "Users manage own search alerts" ON public.search_alerts FOR ALL USING (auth.uid() = user_id);

-- CMA reports: listing owners can view
CREATE POLICY "Owners view own CMA reports" ON public.cma_reports FOR SELECT USING (
  auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
);

-- Parcels: public reference data (read-only for all)
CREATE POLICY "Parcels are public reference data" ON public.parcels FOR SELECT USING (true);

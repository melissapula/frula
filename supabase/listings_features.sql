-- =============================================
-- Adds richer search columns to listings:
--   - waterfront flag + body of water name
--   - view_types[]: water, mountain, lake, river, city, woods, golf
--   - features[]:   pool, fireplace, central_ac, deck, fenced_yard,
--                   updated_kitchen, new_roof, solar, ev_charger, dock
-- =============================================

ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS waterfront      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS water_body_name TEXT,
    ADD COLUMN IF NOT EXISTS view_types      TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS features        TEXT[] DEFAULT '{}';

-- GIN indexes so array `&&` (overlap) and `@>` (contains) queries are fast
CREATE INDEX IF NOT EXISTS listings_view_types_idx ON public.listings USING GIN (view_types);
CREATE INDEX IF NOT EXISTS listings_features_idx   ON public.listings USING GIN (features);
CREATE INDEX IF NOT EXISTS listings_year_built_idx ON public.listings (year_built);
CREATE INDEX IF NOT EXISTS listings_price_idx      ON public.listings (price);

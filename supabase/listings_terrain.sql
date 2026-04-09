-- =============================================
-- Adds land-specific search columns:
--   - terrain[]: wooded, hilly, flat, rolling, prairie,
--                wetland, cleared, pasture, tillable
--   - road_access: paved, gravel, dirt, seasonal, none
--   - utilities[]: electric, gas, city_water, well, city_sewer,
--                  septic, internet, none
-- =============================================

ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS terrain     TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS road_access TEXT,
    ADD COLUMN IF NOT EXISTS utilities   TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS listings_terrain_idx   ON public.listings USING GIN (terrain);
CREATE INDEX IF NOT EXISTS listings_utilities_idx ON public.listings USING GIN (utilities);

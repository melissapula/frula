-- =============================================
-- Adds:
--   - single_story         BOOLEAN  (accessibility / no-stairs)
--   - pets_allowed         BOOLEAN  (rentals + condo HOAs)
--   - large_dogs_ok        BOOLEAN  (rental nuance)
--   - parking_spaces       INTEGER  (non-garage spots)
--   - rent_period          TEXT     (month / week / night) for rentals
--   - lease_term_months    INTEGER  (12, 6, 1, etc.)
--   - available_from       DATE
--   - furnished            BOOLEAN
-- =============================================

ALTER TABLE public.listings
    ADD COLUMN IF NOT EXISTS single_story      BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pets_allowed      BOOLEAN,
    ADD COLUMN IF NOT EXISTS large_dogs_ok     BOOLEAN,
    ADD COLUMN IF NOT EXISTS parking_spaces    INTEGER,
    ADD COLUMN IF NOT EXISTS rent_period       TEXT
        CHECK (rent_period IN ('month','week','night')),
    ADD COLUMN IF NOT EXISTS lease_term_months INTEGER,
    ADD COLUMN IF NOT EXISTS available_from    DATE,
    ADD COLUMN IF NOT EXISTS furnished         BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS listings_listing_type_idx ON public.listings (listing_type);

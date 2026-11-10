-- The browser writes listings straight to Supabase, so the sell form's address checks can be
-- skipped by calling the API directly. These are a looser subset of the form's rules. Run the
-- data fix in MIGRATION_CHECKLIST.md first: a row that still breaks a rule fails the whole
-- transaction and nothing changes.
BEGIN;

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_zip_format;
ALTER TABLE public.listings ADD CONSTRAINT listings_zip_format
  CHECK (zip ~ '^\d{5}(-\d{4})?$');

-- Mirrors US_STATES in apps/web/app/composables/useStates.ts. Changing one means changing the
-- other.
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_state_code;
ALTER TABLE public.listings ADD CONSTRAINT listings_state_code
  CHECK (state IN (
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
    'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
    'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
    'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_city_no_comma;
ALTER TABLE public.listings ADD CONSTRAINT listings_city_no_comma
  CHECK (city !~ ',');

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_address_trimmed;
ALTER TABLE public.listings ADD CONSTRAINT listings_address_trimmed
  CHECK (address = btrim(address));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_city_trimmed;
ALTER TABLE public.listings ADD CONSTRAINT listings_city_trimmed
  CHECK (city = btrim(city));

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_address_length;
ALTER TABLE public.listings ADD CONSTRAINT listings_address_length
  CHECK (char_length(address) <= 100);

COMMIT;

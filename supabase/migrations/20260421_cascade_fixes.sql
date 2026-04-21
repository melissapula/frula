-- Fix missing ON DELETE CASCADE on transactions and listing_plans
-- Without this, deleting a listing orphans these rows.

-- transactions.listing_id
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_listing_id_fkey,
  ADD CONSTRAINT transactions_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- listing_plans.listing_id
ALTER TABLE public.listing_plans
  DROP CONSTRAINT IF EXISTS listing_plans_listing_id_fkey,
  ADD CONSTRAINT listing_plans_listing_id_fkey
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- =============================================
-- Per-view event log for listings, so the seller
-- stats card can compute "views this week" and
-- week-over-week trends.
--
-- Anonymous viewers get a NULL viewer_id. Sellers
-- viewing their own listing are filtered out at
-- write time so vanity numbers stay honest.
-- =============================================

CREATE TABLE IF NOT EXISTS public.listing_views (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    viewer_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS listing_views_listing_idx
    ON public.listing_views (listing_id, viewed_at DESC);

ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can write a view event
CREATE POLICY "Anyone can log a view"
    ON public.listing_views
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only the listing owner can read view events for their listing
CREATE POLICY "Owners read their listing views"
    ON public.listing_views
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = (
            SELECT user_id FROM public.listings WHERE id = listing_id
        )
    );

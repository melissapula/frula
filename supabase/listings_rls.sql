-- =============================================
-- RLS: allow authenticated users to manage their own listings
-- Run after seed_listings.sql
-- =============================================

-- Owners can SELECT their own listings (any status)
DROP POLICY IF EXISTS "Owners can read their own listings" ON public.listings;
CREATE POLICY "Owners can read their own listings"
    ON public.listings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Owners can INSERT a listing for themselves
DROP POLICY IF EXISTS "Owners can create listings" ON public.listings;
CREATE POLICY "Owners can create listings"
    ON public.listings
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Owners can UPDATE their own listings
DROP POLICY IF EXISTS "Owners can update their listings" ON public.listings;
CREATE POLICY "Owners can update their listings"
    ON public.listings
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Owners can DELETE their own listings
DROP POLICY IF EXISTS "Owners can delete their listings" ON public.listings;
CREATE POLICY "Owners can delete their listings"
    ON public.listings
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Owners can INSERT photos onto their listings
DROP POLICY IF EXISTS "Owners can add photos" ON public.listing_photos;
CREATE POLICY "Owners can add photos"
    ON public.listing_photos
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.listings l
            WHERE l.id = listing_photos.listing_id
              AND l.user_id = auth.uid()
        )
    );

-- Owners can manage photos on their own listings
DROP POLICY IF EXISTS "Owners can update photos" ON public.listing_photos;
CREATE POLICY "Owners can update photos"
    ON public.listing_photos
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings l
            WHERE l.id = listing_photos.listing_id
              AND l.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Owners can delete photos" ON public.listing_photos;
CREATE POLICY "Owners can delete photos"
    ON public.listing_photos
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.listings l
            WHERE l.id = listing_photos.listing_id
              AND l.user_id = auth.uid()
        )
    );

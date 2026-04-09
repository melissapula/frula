-- =============================================
-- Prevent duplicate ACTIVE listings for the same address.
--
-- Partial unique index: only enforced when status = 'active'.
-- A home that is sold/expired/withdrawn can be re-listed later
-- (same address, new active row) without conflict.
-- Address normalization: trim + lowercase so "123 Main St "
-- and "123 main st" collide.
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS listings_active_address_unique
    ON public.listings (
        lower(trim(address)),
        lower(trim(city)),
        upper(trim(state)),
        trim(zip)
    )
    WHERE status = 'active';

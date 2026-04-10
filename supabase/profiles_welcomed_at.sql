-- =============================================
-- Adds a `welcomed_at` timestamp to profiles so the
-- welcome email can be sent exactly once per user.
--
-- The /api/notifications/welcome route checks this
-- column and bails if it's already set, making the
-- endpoint safely idempotent — called multiple times
-- (from /signup and /confirm) only ever sends one email.
-- =============================================

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS welcomed_at TIMESTAMPTZ;

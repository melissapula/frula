-- =============================================
-- Adds a per-message `flagged` boolean for the
-- email-style flag/star action in the inbox.
-- =============================================

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS messages_flagged_idx
    ON public.messages (recipient_id)
    WHERE flagged = TRUE;
